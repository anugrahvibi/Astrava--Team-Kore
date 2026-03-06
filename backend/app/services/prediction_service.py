"""
CascadeNet Backend — Prediction Service
Integrates with the AI_ML service to project flood risks.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.config import get_settings
from app.models import Prediction, SensorReading, Zone
from app.schemas import PredictionOut, SensorSignals
from app.services.ml_service_client import ml_client


class PredictionService:
    @staticmethod
    async def get_ml_prediction(zone_id: str, scenario: str = 'current') -> Optional[Dict[str, Any]]:
        """Get prediction from AI_ML LSTM service."""
        try:
            return await ml_client.predict_zone(zone_id, scenario)
        except Exception as e:
            # Log error but don't fail - fallback to internal logic
            print(f"ML service prediction failed for {zone_id}: {e}")
            return None

    @staticmethod
    async def get_latest_prediction(db: AsyncSession, zone_id: str) -> Optional[Prediction]:
        """Fetch the most recent ML prediction for a zone."""
        stmt = (
            select(Prediction)
            .where(Prediction.zone_id == zone_id)
            .order_by(desc(Prediction.predicted_at))
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def calculate_probability(reading: SensorReading) -> Tuple[float, float, float, bool, bool, bool]:
        """
        Simplified internal logic for calculating flood probability and lead time
        based on input features (PRD Section 4.3). This acts as a fallback or 
        demonstration version. In production, this would call the ML service.
        """
        # Thresholds (from PRD Section 6.2 & 6.3)
        RAINFALL_THRESHOLD = 20.0  # mm/hr
        RIVER_THRESHOLD = 5.0     # meters
        RESERVOIR_THRESHOLD = 85.0 # percent

        # Basic signal state
        rainfall_signal = reading.rainfall_mmhr >= RAINFALL_THRESHOLD
        river_signal = reading.river_level_m >= RIVER_THRESHOLD
        reservoir_signal = reading.reservoir_pct >= RESERVOIR_THRESHOLD
        two_signal_confirmed = (rainfall_signal and river_signal) or (rainfall_signal and reservoir_signal) or (river_signal and reservoir_signal)

        # Basic probability calculator (mock / rule-based for the hackathon backend)
        # Probability = weights based on signal counts
        prob = 0.0
        if rainfall_signal: prob += 0.35
        if river_signal: prob += 0.45
        if reservoir_signal: prob += 0.15
        
        # Scaling based on values
        if reading.rainfall_mmhr > 40.0: prob += 0.15
        if reading.river_level_m > 6.0: prob += 0.20
        if reading.reservoir_pct > 95.0: prob += 0.10
        
        prob = min(prob, 1.0) # Cap at 100%

        # Project water level based on river level
        # For simplicity, project 15% increase if signals are high
        multiplier = 1.0 + (prob * 0.3)
        projected_water_level = reading.river_level_m * multiplier

        # Lead time calculation (more probability = less lead time)
        # Base 12 hours - reduction based on prob
        base_lead_time = 12.0
        lead_time = max(2.0, base_lead_time - (prob * 6.0))

        return prob, projected_water_level, lead_time, rainfall_signal, river_signal, reservoir_signal

    @staticmethod
    async def generate_prediction(db: AsyncSession, zone_id: str, reading: SensorReading, scenario: str = 'current') -> Prediction:
        """Create a new flood prediction for a zone, using ML service when available."""
        settings = get_settings()

        # Try to get prediction from ML service first
        ml_result = await PredictionService.get_ml_prediction(zone_id, scenario)
        
        if ml_result and ml_result.get('status') == 'success':
            # Use ML service prediction
            pred_data = ml_result['prediction']
            prob = pred_data['flood_probability']
            level = pred_data['projected_water_level_m']
            lead_time = pred_data['lead_time_hours']
            alert_level = pred_data['alert_level']
            confidence = pred_data.get('confidence_score', 0.92)
            rain_s = pred_data.get('rainfall_signal', False)
            river_s = pred_data.get('river_signal', False)
            res_s = pred_data.get('reservoir_signal', False)
            two_signals = pred_data.get('two_signal_confirmed', False)
            model_version = "cascade_lstm_v1"
        else:
            # Fallback to internal calculation
            prob, level, lead_time, rain_s, river_s, res_s = await PredictionService.calculate_probability(reading)
            
            # Two-signal confirmation logic for RED alert level (PRD Section 6.2)
            alert_level = "GREEN"
            two_signals = sum([rain_s, river_s, res_s]) >= 2
            
            if prob >= settings.red_threshold and (two_signals or reading.river_level_m > 7.0):
                alert_level = "RED"
            elif prob >= settings.amber_threshold or rain_s or river_s or res_s:
                alert_level = "AMBER"
            
            confidence = 0.92
            model_version = "cascade_v1"

        prediction = Prediction(
            zone_id=zone_id,
            predicted_at=datetime.now(),
            flood_probability=prob,
            projected_water_level_m=level,
            lead_time_hrs=lead_time,
            alert_level=alert_level,
            confidence_score=confidence,
            rainfall_signal=rain_s,
            river_signal=river_s,
            reservoir_signal=res_s,
            two_signal_confirmed=two_signals,
            model_version=model_version
        )
        
        db.add(prediction)
        
        # Update zone level cache
        stmt = (
            select(Zone)
            .where(Zone.id == zone_id)
        )
        res = await db.execute(stmt)
        zone = res.scalar_one_or_none()
        if zone:
            zone.current_alert_level = alert_level
            
        await db.commit()
        await db.refresh(prediction)
        return prediction
