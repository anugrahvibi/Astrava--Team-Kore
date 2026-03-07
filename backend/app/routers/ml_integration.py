"""
CascadeNet Backend — ML Integration Router
Endpoints that proxy and integrate with AI_ML service functionality.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel

from app.services.ml_service_client import ml_client

router = APIRouter(prefix="/ml", tags=["ML Integration"])


# Request/Response Models
class HardenRequest(BaseModel):
    cost_rupees: float = 1_000_000


class BudgetAllocationRequest(BaseModel):
    budget_inr: float = 5_000_000


# Health Check
@router.get("/health")
async def ml_health_check():
    """Check if ML service is healthy."""
    try:
        return await ml_client.health_check()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ML service unavailable: {str(e)}")


# Simulation Endpoints
@router.post("/simulate")
async def run_simulation():
    """Run the full cascade simulation pipeline."""
    try:
        return await ml_client.run_simulation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/scenarios")
async def get_scenarios():
    """Get all simulation scenarios."""
    try:
        return await ml_client.get_scenarios()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenarios: {str(e)}")


@router.get("/graph")
async def get_infrastructure_graph():
    """Get infrastructure graph data."""
    try:
        return await ml_client.get_graph()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get graph: {str(e)}")


@router.get("/node/{node_id}")
async def get_node_details(node_id: str = Path(..., description="Node ID")):
    """Get details for a specific infrastructure node."""
    try:
        return await ml_client.get_node(node_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get node: {str(e)}")


# ROI and What-If Analysis
@router.post("/harden/{node_id}")
async def harden_node_analysis(
    node_id: str = Path(..., description="Node ID to harden"),
    request: HardenRequest = HardenRequest()
):
    """Run hardening analysis for a specific node."""
    try:
        return await ml_client.harden_node(node_id, request.cost_rupees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hardening analysis failed: {str(e)}")


@router.get("/roi/rank")
async def get_roi_rankings():
    """Get ROI rankings for all infrastructure nodes."""
    try:
        return await ml_client.rank_roi()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ROI ranking failed: {str(e)}")


@router.post("/roi/allocate")
async def allocate_budget_optimization(request: BudgetAllocationRequest):
    """Run budget allocation optimization."""
    try:
        return await ml_client.allocate_budget(request.budget_inr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget allocation failed: {str(e)}")


# Network Analytics
@router.get("/analytics/vulnerability-map")
async def get_vulnerability_analysis():
    """Get structural vulnerability analysis."""
    try:
        return await ml_client.get_vulnerability_map()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vulnerability analysis failed: {str(e)}")


# 3D Map Data Endpoints
@router.get("/map/flood-grid/{hour}")
async def get_flood_grid(
    hour: int = Path(..., ge=0, le=24, description="Hour of simulation (0-24)"),
    multiplier: float = Query(1.0, ge=0.8, le=1.2, description="Flood peak multiplier")
):
    """Get flood grid data for 3D map visualization."""
    try:
        return await ml_client.get_flood_grid(hour, multiplier)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flood grid failed: {str(e)}")


@router.get("/map/scenario/{scenario_id}/hourly-states")
async def get_scenario_hourly_states(
    scenario_id: int = Path(..., ge=1, description="Scenario ID")
):
    """Get hourly states for a specific scenario."""
    try:
        return await ml_client.get_scenario_hourly_states(scenario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario states failed: {str(e)}")


@router.get("/map/impact-zones/{hour}")
async def get_impact_zones(
    hour: int = Path(..., ge=0, le=24, description="Hour of simulation (0-24)"),
    scenario_id: int = Query(1, ge=1, description="Scenario ID")
):
    """Get impact zones for 3D map visualization."""
    try:
        return await ml_client.get_impact_zones(hour, scenario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impact zones failed: {str(e)}")


# Flood Prediction Endpoints
@router.get("/predict/zones")
async def predict_all_zones(scenario: str = "current"):
    """Get flood predictions for all zones."""
    try:
        return await ml_client.predict_all_zones(scenario=scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Zone predictions failed: {str(e)}")


@router.get("/predict/zone/{zone_id}")
async def predict_zone(
    zone_id: str = Path(..., description="Zone ID"),
    scenario: str = Query("current", description="Scenario type")
):
    """Get prediction for a specific zone."""
    try:
        return await ml_client.predict_zone(zone_id, scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Zone prediction failed: {str(e)}")


@router.post("/alerts/trigger")
async def trigger_zone_alert(
    zone_id: str = Query(..., description="Zone ID"),
    scenario: str = Query("current", description="Scenario type"),
    reservoir_pct: float = Query(None, ge=0, le=100, description="Reservoir percentage")
):
    """Trigger alert for a specific zone."""
    try:
        return await ml_client.trigger_alert(zone_id, scenario, reservoir_pct)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert trigger failed: {str(e)}")


@router.get("/alerts/summary")
async def get_alert_summary(
    scenario: str = Query("current", description="Scenario type")
):
    """Get alert summary for all zones."""
    try:
        return await ml_client.get_alert_summary(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert summary failed: {str(e)}")


@router.get("/lead-times")
async def get_lead_times(
    scenario: str = Query("current", description="Scenario type")
):
    """Get lead time predictions."""
    try:
        return await ml_client.get_lead_times(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead times failed: {str(e)}")
