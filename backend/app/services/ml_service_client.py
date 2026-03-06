"""
CascadeNet Backend — ML Service Client
Handles communication with the AI_ML FastAPI service.
"""
import httpx
import logging
from typing import Dict, List, Optional, Any
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MLServiceClient:
    """Client for communicating with the AI_ML FastAPI service."""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.ml_service_url
        self.timeout = 30.0
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if ML service is healthy."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"ML service health check failed: {e}")
            raise
    
    # Simulation endpoints
    async def run_simulation(self) -> Dict[str, Any]:
        """Run the full cascade simulation pipeline."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/simulate")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Simulation request failed: {e}")
            raise
    
    async def get_scenarios(self) -> Dict[str, Any]:
        """Get all simulation scenarios."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/scenarios")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get scenarios failed: {e}")
            raise
    
    async def get_graph(self) -> Dict[str, Any]:
        """Get infrastructure graph."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/graph")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get graph failed: {e}")
            raise
    
    async def get_node(self, node_id: str) -> Dict[str, Any]:
        """Get specific node details."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/node/{node_id}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get node failed: {e}")
            raise
    
    # ROI and What-If analysis endpoints
    async def harden_node(self, node_id: str, cost_rupees: float = 1_000_000) -> Dict[str, Any]:
        """Run hardening analysis for a node."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/harden/{node_id}",
                    json={"cost_rupees": cost_rupees}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Harden node failed: {e}")
            raise
    
    async def rank_roi(self) -> Dict[str, Any]:
        """Get ROI rankings for all nodes."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/roi/rank")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"ROI ranking failed: {e}")
            raise
    
    async def allocate_budget(self, budget_inr: float = 5_000_000) -> Dict[str, Any]:
        """Run budget allocation optimization."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/roi/allocate",
                    params={"budget_inr": budget_inr}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Budget allocation failed: {e}")
            raise
    
    # Network analytics endpoints
    async def get_vulnerability_map(self) -> Dict[str, Any]:
        """Get structural vulnerability analysis."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/analytics/vulnerability-map")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Vulnerability map failed: {e}")
            raise
    
    # 3D Map endpoints
    async def get_flood_grid(self, hour: int, multiplier: float = 1.0) -> Dict[str, Any]:
        """Get flood grid for 3D map."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/flood-grid/{hour}",
                    params={"multiplier": multiplier}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Flood grid failed: {e}")
            raise
    
    async def get_scenario_hourly_states(self, scenario_id: int) -> Dict[str, Any]:
        """Get hourly states for a scenario."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/scenario/{scenario_id}/hourly-states")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Scenario hourly states failed: {e}")
            raise
    
    async def get_impact_zones(self, hour: int, scenario_id: int = 1) -> Dict[str, Any]:
        """Get impact zones for 3D map."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/impact-zones/{hour}",
                    params={"scenario_id": scenario_id}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Impact zones failed: {e}")
            raise
    
    # Flood prediction endpoints
    async def predict_all_zones(self) -> Dict[str, Any]:
        """Get flood predictions for all zones."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/predict/zones")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Predict all zones failed: {e}")
            raise
    
    async def predict_zone(self, zone_id: str, scenario: str = 'current') -> Dict[str, Any]:
        """Get prediction for a specific zone."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/predict/zone/{zone_id}",
                    params={"scenario": scenario}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Predict zone failed: {e}")
            raise
    
    async def trigger_alert(self, zone_id: str, scenario: str = 'current', reservoir_pct: float = None) -> Dict[str, Any]:
        """Trigger alert for a zone."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {"scenario": scenario}
                if reservoir_pct is not None:
                    params["reservoir_pct"] = reservoir_pct
                response = await client.post(
                    f"{self.base_url}/alerts/trigger",
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Trigger alert failed: {e}")
            raise
    
    async def get_alert_summary(self, scenario: str = 'current') -> Dict[str, Any]:
        """Get alert summary for all zones."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/alerts/summary",
                    params={"scenario": scenario}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Alert summary failed: {e}")
            raise
    
    async def get_lead_times(self, scenario: str = 'current') -> Dict[str, Any]:
        """Get lead time predictions."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/lead-time",
                    params={"scenario": scenario}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Lead times failed: {e}")
            raise


# Singleton instance
ml_client = MLServiceClient()
