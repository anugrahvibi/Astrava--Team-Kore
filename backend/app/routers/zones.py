"""
CascadeNet Backend — Zones Router
Endpoints for zone data and risk status.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Zone, Prediction
from app.schemas import ZoneSummary


router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("/", response_model=List[ZoneSummary])
async def get_all_zones(db: AsyncSession = Depends(get_db)):
    """Fetch all zones with their current risk status (PRD Section 7.2)."""
    stmt = select(Zone)
    result = await db.execute(stmt)
    zones = result.scalars().all()
    
    # Enrich with latest prediction data for each zone
    zone_summaries = []
    for zone in zones:
        stmt = (
            select(Prediction)
            .where(Prediction.zone_id == zone.id)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        pred = res.scalar_one_or_none()
        
        zone_summaries.append(ZoneSummary(
            id=zone.id,
            name=zone.name,
            region=zone.region,
            current_alert_level=zone.current_alert_level,
            population=zone.population,
            elevation_avg_m=zone.elevation_avg_m,
            last_updated=zone.updated_at,
            flood_probability=pred.flood_probability if pred else 0.0,
            projected_water_level_m=pred.projected_water_level_m if pred else 0.0,
            lead_time_hrs=pred.lead_time_hrs if pred else 0.0
        ))
        
    return zone_summaries


@router.get("/{zone_id}", response_model=ZoneSummary)
async def get_zone(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single zone's details."""
    stmt = select(Zone).where(Zone.id == zone_id)
    result = await db.execute(stmt)
    zone = result.scalar_one_or_none()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    # Enrich with latest prediction data
    stmt = (
        select(Prediction)
        .where(Prediction.zone_id == zone.id)
        .order_by(Prediction.predicted_at.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    pred = res.scalar_one_or_none()
    
    return ZoneSummary(
        id=zone.id,
        name=zone.name,
        region=zone.region,
        current_alert_level=zone.current_alert_level,
        population=zone.population,
        elevation_avg_m=zone.elevation_avg_m,
        last_updated=zone.updated_at,
        flood_probability=pred.flood_probability if pred else 0.0,
        projected_water_level_m=pred.projected_water_level_m if pred else 0.0,
        lead_time_hrs=pred.lead_time_hrs if pred else 0.0
    )
