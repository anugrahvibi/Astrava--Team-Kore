"""
CascadeNet Backend — Alerts Router
Endpoints for department-specific active alerts.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Alert
from app.schemas import AlertOut
from app.services.actionability_service import ActionabilityService


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/active", response_model=List[AlertOut])
async def get_active_alerts(role: str, db: AsyncSession = Depends(get_db)):
    """Fetch all active alerts targeting a stakeholder role (PRD 7.2)."""
    # Supported roles: dam_operator | ndrf | collector | hospital | highway | power | public
    alerts = await ActionabilityService.get_active_alerts(db, role)
    return [AlertOut.from_orm(a) for a in alerts]


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Acknowledge an alert to mark it as seen."""
    stmt = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.acknowledged = True
    await db.commit()
    await db.refresh(alert)
    return alert
