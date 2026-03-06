"""
CascadeNet Backend — Simulation Router
Endpoints for replaying historical flood scenarios.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SimulateRequest, SimulateResult
from app.services.simulation_service import SimulationService


router = APIRouter(prefix="/simulate", tags=["Simulation"])


@router.post("/", response_model=List[SimulateResult])
async def run_simulation(req: SimulateRequest, db: AsyncSession = Depends(get_db)):
    """Replay a historical flood scenario through the engine (PRD 7.2)."""
    # Supported scenario: 2022_godavari_flood
    try:
        results = await SimulationService.run_scenario(db, req.scenario, req.zone_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
