"""
CascadeNet Backend — Actionability Service
The Rules Engine (PRD Section 6) that routes department-specific alerts.
"""
import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Alert, Prediction, Zone, SensorReading
from app.schemas import DepartmentAction, ActionBundle


# ─── Load Rules Data ─────────────────────────────────────────────────────────
RULES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "truth_tables.json")


class ActionabilityService:
    @staticmethod
    def _load_rules() -> Dict:
        """Load rules from truth_tables.json."""
        with open(RULES_FILE, "r") as f:
            return json.load(f)

    @staticmethod
    async def get_active_alerts(db: AsyncSession, role: str) -> List[Alert]:
        """Fetch active alerts targeting a specific stakeholder role."""
        stmt = (
            select(Alert)
            .where(Alert.target_role == role)
            .where(Alert.is_active == True)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def generate_action_bundle(db: AsyncSession, zone_id: str, prediction: Prediction, reading: SensorReading) -> ActionBundle:
        """
        The Core Actionability Engine (PRD Section 6.4).
        Generates Simultaneous, Multi-Stakeholder Action Directives.
        """
        rules = ActionabilityService._load_rules()
        dept_actions = []

        # ── 1. Dam Operator (Section 6.3) ────────────────────────────────────
        reservoir_pct = reading.reservoir_pct or 0.0
        dam_rules = rules["dam_operations"]["rules"]
        
        # Determine rule by reservoir level
        # CWC OMS 2022 Logic
        match_rule = None
        for rule in dam_rules:
            if rule["reservoir_pct_min"] <= reservoir_pct <= rule["reservoir_pct_max"]:
                match_rule = rule
                break
        
        if match_rule:
            dept_actions.append(DepartmentAction(
                target_dept="water",
                target_role="dam_operator",
                action_text=match_rule["action"],
                source_citation=rules["dam_operations"]["source"],
                deadline_hrs=match_rule.get("deadline_hrs"),
                priority="HIGH" if match_rule["alert_level"] == "RED" else "MEDIUM"
            ))

        # ── 2. NDRF / Rescue (Section 6.4) ────────────────────────────────────
        ndrf_rules = rules["ndrf_staging"]["rules"]
        alert_level = prediction.alert_level

        for rule in ndrf_rules:
            if rule["alert_level"] == alert_level:
                # Specific zone match or general rule
                if "zone_id" not in rule or rule["zone_id"] == zone_id:
                    dept_actions.append(DepartmentAction(
                        target_dept="rescue",
                        target_role="ndrf",
                        action_text=rule["action"],
                        source_citation=rules["ndrf_staging"]["source"],
                        deadline_hrs=rule.get("deadline_hrs"),
                        priority="HIGH" if alert_level == "RED" else "MEDIUM"
                    ))

        # ── 3. District Collector / Evacuation (Section 6.4) ──────────────────
        evac_rules = rules["evacuation"]["rules"]
        for rule in evac_rules:
            if rule["alert_level"] == alert_level:
                if "zone_id" not in rule or rule["zone_id"] == zone_id:
                    dept_actions.append(DepartmentAction(
                        target_dept="administration",
                        target_role="collector",
                        action_text=rule["action"],
                        source_citation=rules["evacuation"]["source"],
                        deadline_hrs=rule.get("deadline_hrs"),
                        priority="HIGH" if alert_level == "RED" else "MEDIUM"
                    ))

        # ── 4. Institutional Departments (Power, Hospital, Highway) ────────────
        # These fire for RED status based on prediction depth
        if alert_level == "RED":
            # Power
            dept_actions.append(DepartmentAction(
                target_dept="energy",
                target_role="power",
                action_text=rules["power"]["rules"][1]["action"],
                source_citation=rules["power"]["source"],
                deadline_hrs=rules["power"]["rules"][1].get("deadline_hrs")
            ))
            # Hospital
            dept_actions.append(DepartmentAction(
                target_dept="health",
                target_role="hospital",
                action_text=rules["hospital"]["rules"][1]["action"],
                source_citation=rules["hospital"]["source"],
                deadline_hrs=rules["hospital"]["rules"][1].get("deadline_hrs")
            ))
            # Highway
            dept_actions.append(DepartmentAction(
                target_dept="transport",
                target_role="highway",
                action_text=rules["highway"]["rules"][1]["action"],
                source_citation=rules["highway"]["source"],
                deadline_hrs=rules["highway"]["rules"][1].get("deadline_hrs")
            ))

        # ── 5. Public Portal (Section 8.5) ────────────────────────────────────
        public_rules = rules["public"]["rules"]
        for rule in public_rules:
            if rule["alert_level"] == alert_level:
                if "zone_id" not in rule or rule["zone_id"] == zone_id:
                    dept_actions.append(DepartmentAction(
                        target_dept="public",
                        target_role="public",
                        action_text=rule["message"],
                        source_citation=rules["public"]["source"],
                        deadline_hrs=rule.get("deadline_hrs")
                    ))

        # ── Persist New Alerts ───────────────────────────────────────────────
        for action in dept_actions:
            alert = Alert(
                zone_id=zone_id,
                prediction_id=prediction.id,
                alert_level=alert_level,
                target_role=action.target_role,
                action_text=action.action_text,
                source_citation=action.source_citation,
                deadline_hrs=action.deadline_hrs,
                is_active=True
            )
            db.add(alert)
        
        await db.commit()

        # Build bundle output
        stmt = select(Zone).where(Zone.id == zone_id)
        res = await db.execute(stmt)
        zone = res.scalar_one_or_none()

        return ActionBundle(
            zone_id=zone_id,
            zone_name=zone.name if zone else "Unknown Zone",
            alert_level=alert_level,
            flood_probability=prediction.flood_probability,
            projected_water_level_m=prediction.projected_water_level_m,
            lead_time_hrs=prediction.lead_time_hrs,
            generated_at=datetime.now(),
            departments=dept_actions
        )
