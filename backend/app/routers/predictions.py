"""
CascadeNet Backend — Predictions Router
Endpoints for ML-driven flood projections.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Prediction, SensorReading, Zone
from app.schemas import PredictionOut, SensorSignals
from app.services.prediction_service import PredictionService
from app.services.sensor_service import SensorService


router = APIRouter(prefix="/zones", tags=["Predictions"])


@router.get("/{zone_id}/prediction", response_model=PredictionOut)
async def get_zone_prediction(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch recent flood prediction for a zone (PRD Section 7.2)."""
    # Verify zone exists
    stmt = select(Zone).where(Zone.id == zone_id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Zone not found")
        
    prediction = await PredictionService.get_latest_prediction(db, zone_id)
    if not prediction:
        # Generate initial if missing (fallback for demo)
        reading = await SensorService.get_latest_readings(db, zone_id)
        if not reading:
            raise HTTPException(status_code=404, detail="Sensors not found for zone")
        prediction = await PredictionService.generate_prediction(db, zone_id, reading)
        
    return PredictionOut(
        zone_id=prediction.zone_id,
        predicted_at=prediction.predicted_at,
        flood_probability=prediction.flood_probability,
        projected_water_level_m=prediction.projected_water_level_m,
        lead_time_hrs=prediction.lead_time_hrs,
        alert_level=prediction.alert_level,
        confidence_score=prediction.confidence_score,
        signals=SensorSignals(
            rainfall=prediction.rainfall_signal,
            river_level=prediction.river_signal,
            reservoir_pct=prediction.reservoir_signal
        ),
        two_signal_confirmed=prediction.two_signal_confirmed,
        model_version=prediction.model_version
    )
