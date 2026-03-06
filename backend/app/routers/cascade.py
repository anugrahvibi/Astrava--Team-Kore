"""
CascadeNet Backend — Cascade Router
Endpoints for infrastructure impact analysis.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Prediction, Zone
from app.schemas import CascadeOut
from app.services.cascade_service import CascadeService
from app.services.prediction_service import PredictionService


router = APIRouter(prefix="/zones", tags=["Cascade Impact"])


@router.get("/{zone_id}/cascade", response_model=CascadeOut)
async def get_zone_cascade(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Predict infrastructure failures based on projected water level (PRD 7.2)."""
    # Verify zone
    stmt = select(Zone).where(Zone.id == zone_id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Zone not found")
        
    # Get latest prediction
    prediction = await PredictionService.get_latest_prediction(db, zone_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="No active prediction for zone")
        
    # Predict impact
    return await CascadeService.predict_impact(db, zone_id, prediction.projected_water_level_m)


@router.get("/infrastructure/nodes", tags=["Infrastructure"])
async def get_all_nodes(db: AsyncSession = Depends(get_db)):
    """Fetch all infrastructure nodes across all zones."""
    return await CascadeService.get_all_nodes(db)


@router.get("/infrastructure/nodes/{node_id}", tags=["Infrastructure"])
async def get_node(node_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch detail for a single infrastructure node (PRD 7.2)."""
    node = await CascadeService.get_node_status(db, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node
