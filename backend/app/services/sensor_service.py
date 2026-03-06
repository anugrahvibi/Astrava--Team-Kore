"""
CascadeNet Backend — Sensor Service
Handles ingestion and maintenance of live sensor readings.
"""
from datetime import datetime, timedelta
import random
from typing import Optional, List

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SensorReading, Zone
from app.schemas import SensorReadingCreate, SensorReadingOut


class SensorService:
    @staticmethod
    async def get_latest_readings(db: AsyncSession, zone_id: str) -> Optional[SensorReading]:
        """Fetch the most recent sensor reading for a zone."""
        stmt = (
            select(SensorReading)
            .where(SensorReading.zone_id == zone_id)
            .order_by(desc(SensorReading.timestamp))
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_reading(db: AsyncSession, data: SensorReadingCreate) -> SensorReading:
        """Record a new sensor reading."""
        reading = SensorReading(
            zone_id=data.zone_id,
            timestamp=datetime.now(),
            rainfall_mmhr=data.rainfall_mmhr,
            river_level_m=data.river_level_m,
            reservoir_pct=data.reservoir_pct,
            reservoir_inflow_m3s=data.reservoir_inflow_m3s,
            reservoir_outflow_m3s=data.reservoir_outflow_m3s,
            data_quality="good"
        )
        db.add(reading)
        await db.commit()
        await db.refresh(reading)
        return reading

    @staticmethod
    def generate_mock_reading(zone_id: str, scenario: str = "normal") -> SensorReadingCreate:
        """Generate mock sensor data for demo/testing."""
        if scenario == "flood_imminent":
            # Scenario: It's been raining hard for 3 hours, river is rising fast
            return SensorReadingCreate(
                zone_id=zone_id,
                rainfall_mmhr=random.uniform(15.0, 30.0),  # Heavy rain
                river_level_m=random.uniform(4.5, 6.2),    # High river
                reservoir_pct=random.uniform(88.0, 95.0),  # Reservoir nearly full
                reservoir_inflow_m3s=1200.0,
                reservoir_outflow_m3s=400.0
            )
        elif scenario == "receding":
            # Scenario: Rain stopped, but river still high
            return SensorReadingCreate(
                zone_id=zone_id,
                rainfall_mmhr=random.uniform(0.0, 2.0),
                river_level_m=random.uniform(3.0, 4.5),
                reservoir_pct=random.uniform(75.0, 85.0),
                reservoir_inflow_m3s=300.0,
                reservoir_outflow_m3s=600.0
            )
        else:
            # Normal baseline
            return SensorReadingCreate(
                zone_id=zone_id,
                rainfall_mmhr=random.uniform(0.0, 5.0),
                river_level_m=random.uniform(1.2, 2.5),
                reservoir_pct=random.uniform(45.0, 65.0),
                reservoir_inflow_m3s=150.0,
                reservoir_outflow_m3s=150.0
            )
