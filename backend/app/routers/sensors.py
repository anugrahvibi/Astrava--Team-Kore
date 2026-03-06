"""
CascadeNet Backend — Sensors Router
Endpoints for live and mock sensor data.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import SensorReading, Zone
from app.schemas import SensorReadingOut, SensorReadingCreate
from app.services.sensor_service import SensorService


router = APIRouter(prefix="/sensors", tags=["Sensors"])


@router.get("/{zone_id}", response_model=SensorReadingOut)
async def get_latest_sensor_reading(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch the most recent live sensor readings for a zone (PRD 4.2)."""
    reading = await SensorService.get_latest_readings(db, zone_id)
    if not reading:
        raise HTTPException(status_code=404, detail="No sensor data found for zone")
    return reading


@router.post("/mock", response_model=SensorReadingOut)
async def generate_mock_data(zone_id: str, scenario: str = "normal", db: AsyncSession = Depends(get_db)):
    """Generate and persist mock sensor data for testing/demo (PRD 4.4)."""
    mock_data = SensorService.generate_mock_reading(zone_id, scenario)
    return await SensorService.create_reading(db, mock_data)
