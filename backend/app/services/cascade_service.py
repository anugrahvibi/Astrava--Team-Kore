"""
CascadeNet Backend — Cascade Service
Handles infrastructure cascade impact prediction based on projected water levels.
"""
from typing import List, Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import InfrastructureNode, Zone, Prediction
from app.schemas import CascadeFailureItem, CascadeOut
from app.services.ml_service_client import ml_client


class CascadeService:
    @staticmethod
    async def get_ml_simulation_results() -> Optional[dict]:
        """Get simulation results from AI_ML service."""
        try:
            return await ml_client.run_simulation()
        except Exception as e:
            print(f"ML simulation failed: {e}")
            return None

    @staticmethod
    async def get_ml_scenarios() -> Optional[dict]:
        """Get scenarios from AI_ML service."""
        try:
            return await ml_client.get_scenarios()
        except Exception as e:
            print(f"ML scenarios failed: {e}")
            return None

    @staticmethod
    async def get_ml_graph() -> Optional[dict]:
        """Get infrastructure graph from AI_ML service."""
        try:
            return await ml_client.get_graph()
        except Exception as e:
            print(f"ML graph failed: {e}")
            return None

    @staticmethod
    async def predict_impact(db: AsyncSession, zone_id: str, projected_level: float) -> CascadeOut:
        """Calculate infrastructure failures for a zone's projected water level."""
        stmt = (
            select(InfrastructureNode)
            .where(InfrastructureNode.zone_id == zone_id)
        )
        result = await db.execute(stmt)
        nodes = result.scalars().all()

        # Identify failing nodes based on the threshold (PRD Section 5.2)
        failed_items = []
        total_pop_impact = 0

        for node in nodes:
            if node.flood_depth_threshold_m <= projected_level:
                # Node will fail
                failed_items.append(CascadeFailureItem(
                    node_id=node.id,
                    name=node.name,
                    node_type=node.node_type,
                    failure_time_hrs=node.failure_time_offset_hrs,
                    affected_population=node.affected_population,
                    action=node.action_template,
                    responsible_dept=node.responsible_dept,
                    lat=node.lat,
                    lon=node.lon,
                    source_citation="Infrastructure Vulnerability Map 2024"
                ))
                if node.affected_population:
                    total_pop_impact += node.affected_population

        # Sort failures in chronological sequence (PRD 5.2 Logic)
        failed_items.sort(key=lambda x: x.failure_time_hrs)

        # Get parent prediction/alert data
        stmt = (
            select(Prediction)
            .where(Prediction.zone_id == zone_id)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        prediction = res.scalar_one_or_none()
        
        return CascadeOut(
            zone_id=zone_id,
            projected_water_level_m=projected_level,
            alert_level=prediction.alert_level if prediction else "GREEN",
            total_failures=len(failed_items),
            total_population_at_risk=total_pop_impact,
            failures=failed_items
        )

    @staticmethod
    async def get_node_status(db: AsyncSession, node_id: str) -> Optional[InfrastructureNode]:
        """Fetch status and details for an infrastructure node."""
        stmt = (
            select(InfrastructureNode)
            .where(InfrastructureNode.id == node_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_nodes(db: AsyncSession) -> List[InfrastructureNode]:
        """Fetch all infrastructure nodes."""
        stmt = select(InfrastructureNode)
        result = await db.execute(stmt)
        return result.scalars().all()
