"""
CascadeNet 2.0 — 5-Stakeholder Action Router
When a zone hits RED / ORANGE, automatically generates
department-specific action items grounded in CWC and NDMA documentation.
"""

import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
ACTIONS_FILE = os.path.join(DATA_DIR, "stakeholder_actions.json")
ZONES_FILE   = os.path.join(DATA_DIR, "kochi_zones.json")

STAKEHOLDERS = ["dam_operator", "ndrf", "district_collector", "highway_department", "public"]


class ActionRouter:
    """
    Routes department-specific action items to 5 stakeholders based on zone alert level.

    Stakeholders:
        1. Dam Operator (CWC)
        2. NDRF
        3. District Collector
        4. Highway Department (PWD)
        5. Public

    Each action includes: priority, action text, deadline_hours, and official source.
    """

    def __init__(self):
        self._actions = self._load_actions()
        self._zones   = {z["id"]: z for z in self._load_zones()}

    def _load_actions(self) -> dict:
        with open(ACTIONS_FILE) as f:
            return json.load(f)["stakeholder_actions"]

    def _load_zones(self) -> list:
        with open(ZONES_FILE) as f:
            return json.load(f)["zones"]

    def route_alert(self, zone_id: str, alert_level: str,
                    flood_probability: float, lead_time_hours: int,
                    projected_water_level_m: float) -> dict:
        """
        Generate the full 5-stakeholder action plan for a given zone alert.

        Args:
            zone_id: e.g. 'ZONE_FORT_KOCHI'
            alert_level: 'RED', 'ORANGE', or 'GREEN'
            flood_probability: 0.0-1.0
            lead_time_hours: hours before peak (6-24)
            projected_water_level_m: projected river/flood depth

        Returns:
            Full action plan with per-stakeholder action items.
        """
        if alert_level not in ("RED", "ORANGE", "GREEN"):
            raise ValueError(f"alert_level must be RED/ORANGE/GREEN, got: {alert_level}")

        zone_info = self._zones.get(zone_id, {"name": zone_id, "population": 0})
        triggered_at = datetime.now().isoformat()

        stakeholder_plans = {}
        for stakeholder in STAKEHOLDERS:
            raw_actions = self._actions[stakeholder].get(alert_level, [])
            actions_with_window = []
            for act in raw_actions:
                # Compute absolute deadline: lead_time - stakeholder deadline
                absolute_deadline_h = max(lead_time_hours - act["deadline_hours"], 0)
                actions_with_window.append({
                    **act,
                    "absolute_action_window_hours": absolute_deadline_h,
                    "urgency": "IMMEDIATE" if act["deadline_hours"] <= 2 else (
                        "URGENT" if act["deadline_hours"] <= 6 else "PLANNED"
                    )
                })
            stakeholder_plans[stakeholder] = {
                "role": self._actions[stakeholder]["role"],
                "authority": self._actions[stakeholder]["authority"],
                "alert_level": alert_level,
                "actions": actions_with_window,
                "total_actions": len(actions_with_window),
            }

        return {
            "alert_id": f"ALERT-{zone_id}-{alert_level}-{datetime.now().strftime('%Y%m%d%H%M')}",
            "triggered_at": triggered_at,
            "zone_id": zone_id,
            "zone_name": zone_info.get("name", zone_id),
            "alert_level": alert_level,
            "flood_probability_pct": round(flood_probability * 100, 1),
            "projected_water_level_m": projected_water_level_m,
            "lead_time_hours": lead_time_hours,
            "estimated_population_at_risk": zone_info.get("population", 0),
            "stakeholders_notified": len(STAKEHOLDERS),
            "action_plans": stakeholder_plans,
            "data_sources": ["CWC FFWS", "NDMA SOP 2020", "Kerala DDMP 2022", "NHAI Flood Contingency Plan 2019"],
        }

    def get_stakeholder_summary(self, zone_id: str, alert_level: str) -> dict:
        """
        Lightweight summary: what each stakeholder must do, in plain language.
        Useful for the dashboard's alert panel.
        """
        summary = {}
        for stakeholder in STAKEHOLDERS:
            actions = self._actions[stakeholder].get(alert_level, [])
            if actions:
                top_action = sorted(actions, key=lambda a: a["priority"])[0]
                summary[stakeholder] = {
                    "role": self._actions[stakeholder]["role"],
                    "top_action": top_action["action"],
                    "deadline_hours": top_action["deadline_hours"],
                    "source": top_action["source"],
                }
            else:
                summary[stakeholder] = {
                    "role": self._actions[stakeholder]["role"],
                    "top_action": "No immediate action required.",
                    "deadline_hours": 48,
                    "source": "Standard Operating Procedure",
                }
        return {
            "zone_id": zone_id,
            "alert_level": alert_level,
            "quick_summary": summary,
        }

    def get_all_zone_summaries(self, zone_predictions: list[dict]) -> list[dict]:
        """
        Given a list of zone predictions (from LSTMFloodPredictor),
        generate action summaries for all non-GREEN zones.
        """
        summaries = []
        for pred in zone_predictions:
            if pred["alert_level"] != "GREEN":
                full_plan = self.route_alert(
                    zone_id=pred["zone_id"],
                    alert_level=pred["alert_level"],
                    flood_probability=pred["flood_probability"],
                    lead_time_hours=pred["lead_time_hours"],
                    projected_water_level_m=pred["projected_water_level_m"],
                )
                summaries.append(full_plan)
        return summaries
