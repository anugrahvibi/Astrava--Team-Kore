"""
CascadeNet Backend — Simulation Service
Handles scenario replays for demo mode (PRD Section 10.3).
"""
import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Zone, InfrastructureNode, SensorReading, Prediction
from app.schemas import (
    SimulateRequest, SimulateResult, SimulateHourState, 
    CascadeFailureItem, DepartmentAction, ActionBundle
)
from app.services.prediction_service import PredictionService
from app.services.cascade_service import CascadeService
from app.services.actionability_service import ActionabilityService


class SimulationService:
    @staticmethod
    async def run_scenario(db: AsyncSession, scenario_name: str, zone_id: Optional[str] = None) -> List[SimulateResult]:
        """
        Replay a historical flood scenario (PRD Section 10.3)
        temporal model: depth(t) = peak_level * sin(pi * t / 24)
        """
        # Load zone(s)
        stmt = select(Zone)
        if zone_id:
            stmt = stmt.where(Zone.id == zone_id)
        result = await db.execute(stmt)
        zones = result.scalars().all()

        results = []
        for zone in zones:
            # Baseline parameters for scenario
            peak_multiplier = 1.15 if scenario_name == '2022_godavari_flood' else 1.0
            # Higher elevation = less flood depth
            base_peak = 6.5 if zone.elevation_avg_m < 10 else 3.5
            peak_flood_m = base_peak * peak_multiplier
            
            hourly_states = []
            max_prob = 0.0
            total_failed_nodes = set()
            total_pop_impact = 0

            # 24-hour simulation cycle
            for hour in range(25):
                # 1. Generate sensor snapshot for this hour
                # Sine curve peaking at hour 12
                intensity = math.sin(math.pi * hour / 24.0)
                current_depth = peak_flood_m * intensity
                
                rainfall = 45.0 * intensity * peak_multiplier
                res_pct = 60.0 + (38.0 * intensity)
                
                sensor_reading = SensorReading(
                    zone_id=zone.id,
                    timestamp=datetime.now() + timedelta(hours=hour),
                    rainfall_mmhr=rainfall,
                    river_level_m=current_depth,
                    reservoir_pct=res_pct,
                    data_quality="good"
                )

                # 2. Get prediction outcome
                prob, proj_level, lead_time, rain_s, river_s, res_s = await PredictionService.calculate_probability(sensor_reading)
                
                # Simple alert level logic
                alert_level = "GREEN"
                if prob >= 0.75 and (rain_s and river_s): alert_level = "RED"
                elif prob >= 0.50: alert_level = "AMBER"
                
                if prob > max_prob: max_prob = prob

                # 3. Predict cascade failures
                cascade = await CascadeService.predict_impact(db, zone.id, current_depth)
                
                current_failed_nodes = []
                for failure in cascade.failures:
                    if failure.node_id not in total_failed_nodes:
                        total_failed_nodes.add(failure.node_id)
                        total_pop_impact += failure.affected_population or 0
                    current_failed_nodes.append(failure)

                hourly_states.append(SimulateHourState(
                    hour=hour,
                    zone_id=zone.id,
                    flood_probability=prob,
                    projected_water_level_m=current_depth,
                    alert_level=alert_level,
                    failed_infrastructure=current_failed_nodes,
                    sensor_snapshot={
                        "rainfall_mmhr": round(rainfall, 2),
                        "river_level_m": round(current_depth, 2),
                        "reservoir_pct": round(res_pct, 1)
                    }
                ))

            # Generate final action bundle for peak of simulation
            # We'll mock a peak prediction object for ActionabilityService
            peak_prediction = Prediction(
                id=999,
                zone_id=zone.id,
                flood_probability=max_prob,
                projected_water_level_m=peak_flood_m,
                lead_time_hrs=6.0,
                alert_level="RED" if max_prob >= 0.75 else "AMBER"
            )
            peak_reading = SensorReading(
                zone_id=zone.id,
                rainfall_mmhr=45.0 * peak_multiplier,
                river_level_m=peak_flood_m,
                reservoir_pct=95.0
            )
            
            # This is a bit of a hack to get the action bundle without DB side-effects for sim
            # For the demo, we'll just extract the action bundle
            action_bundle = await ActionabilityService.generate_action_bundle(db, zone.id, peak_prediction, peak_reading)

            results.append(SimulateResult(
                scenario=scenario_name,
                zone_id=zone.id,
                total_hours=25,
                peak_hour=12,
                peak_water_level_m=peak_flood_m,
                peak_probability=max_prob,
                total_infrastructure_failures=len(total_failed_nodes),
                total_population_impact=total_pop_impact,
                hourly_states=hourly_states,
                department_actions=action_bundle.departments
            ))
            
        return results
