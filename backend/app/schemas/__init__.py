"""
CascadeNet Backend — Pydantic Schemas
Request/response models for all API endpoints.
Refactored for dual Pydantic V1/V2 compatibility.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Determine Pydantic version and define a common Config
import pydantic
PYDANTIC_V2 = pydantic.VERSION.startswith("2.")

class SchemaConfig:
    if PYDANTIC_V2:
        from_attributes = True
    else:
        orm_mode = True

# ─── Common ───────────────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    status: str = "success"
    message: str = ""

# ─── Sensor Data ──────────────────────────────────────────────────────────────

class SensorSignals(BaseModel):
    """Per-sensor signal state — are these readings elevated?"""
    rainfall: bool = False
    river_level: bool = False
    reservoir_pct: bool = False

class SensorReadingOut(BaseModel):
    zone_id: str
    timestamp: datetime
    rainfall_mmhr: Optional[float] = None
    river_level_m: Optional[float] = None
    reservoir_pct: Optional[float] = None
    reservoir_inflow_m3s: Optional[float] = None
    reservoir_outflow_m3s: Optional[float] = None
    data_quality: str
    rainfall_stale: bool
    river_stale: bool
    reservoir_stale: bool
    rainfall_source: str
    river_source: str
    reservoir_source: str

    Config = SchemaConfig

class SensorReadingCreate(BaseModel):
    zone_id: str
    rainfall_mmhr: Optional[float] = None
    river_level_m: Optional[float] = None
    reservoir_pct: Optional[float] = None
    reservoir_inflow_m3s: Optional[float] = None
    reservoir_outflow_m3s: Optional[float] = None

# ─── Zone ─────────────────────────────────────────────────────────────────────

class ZoneSummary(BaseModel):
    id: str
    name: str
    region: str
    current_alert_level: str
    population: Optional[int] = None
    elevation_avg_m: Optional[float] = None
    last_updated: Optional[datetime] = None
    flood_probability: Optional[float] = None
    projected_water_level_m: Optional[float] = None
    lead_time_hrs: Optional[float] = None

    Config = SchemaConfig

# ─── Predictions ──────────────────────────────────────────────────────────────

class PredictionOut(BaseModel):
    zone_id: str
    predicted_at: datetime
    flood_probability: float = Field(..., ge=0, le=1)
    projected_water_level_m: float
    lead_time_hrs: float
    alert_level: str  # RED | AMBER | GREEN
    confidence_score: float = Field(default=1.0, ge=0, le=1)
    signals: SensorSignals
    two_signal_confirmed: bool
    model_version: str

    Config = SchemaConfig

# ─── Cascade Infrastructure ───────────────────────────────────────────────────

class CascadeFailureItem(BaseModel):
    node_id: str
    name: str
    node_type: str
    failure_time_hrs: float
    affected_population: Optional[int] = None
    action: str
    responsible_dept: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    source_citation: Optional[str] = None

class CascadeOut(BaseModel):
    zone_id: str
    projected_water_level_m: float
    alert_level: str
    total_failures: int
    total_population_at_risk: int
    failures: List[CascadeFailureItem]

# ─── Alerts ───────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    zone_id: str
    alert_level: str
    target_role: str
    action_text: str
    source_citation: Optional[str] = None
    deadline_hrs: Optional[float] = None
    is_active: bool
    acknowledged: bool
    created_at: datetime

    Config = SchemaConfig

class AcknowledgeRequest(BaseModel):
    acknowledged_by: str

# ─── Multi-Stakeholder Action Bundle (PRD Section 6.4) ────────────────────────

class DepartmentAction(BaseModel):
    """A single action directive for one department."""
    target_dept: str
    target_role: str  # dam_operator | ndrf | collector | hospital | highway | power | public
    action_text: str
    source_citation: str
    deadline_hrs: Optional[float] = None
    priority: str = "HIGH"  # HIGH | MEDIUM | LOW

class ActionBundle(BaseModel):
    """Full multi-department action bundle for a zone event."""
    zone_id: str
    zone_name: str
    alert_level: str
    flood_probability: float
    projected_water_level_m: float
    lead_time_hrs: float
    generated_at: datetime
    departments: List[DepartmentAction]

# ─── Infrastructure Nodes ─────────────────────────────────────────────────────

class InfrastructureNodeOut(BaseModel):
    id: str
    zone_id: str
    node_type: str
    name: str
    description: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    flood_depth_threshold_m: float
    failure_time_offset_hrs: float
    affected_population: Optional[int] = None
    action_template: Optional[str] = None
    responsible_dept: str
    current_status: str

    Config = SchemaConfig

# ─── Simulation ───────────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    scenario: str = Field(
        default="2022_godavari_flood",
        description="Scenario to replay. Options: 2022_godavari_flood | 2018_kochi_flood | custom"
    )
    zone_id: Optional[str] = None   # If None, run simulation for all zones

class SimulateHourState(BaseModel):
    hour: int
    zone_id: str
    flood_probability: float
    projected_water_level_m: float
    alert_level: str
    failed_infrastructure: List[CascadeFailureItem]
    sensor_snapshot: Dict[str, Any]

class SimulateResult(BaseModel):
    scenario: str
    zone_id: Optional[str]
    total_hours: int
    peak_hour: int
    peak_water_level_m: float
    peak_probability: float
    total_infrastructure_failures: int
    total_population_impact: int
    hourly_states: List[SimulateHourState]
    department_actions: List[DepartmentAction]

# ─── WebSocket ────────────────────────────────────────────────────────────────

class WSZoneUpdate(BaseModel):
    event: str = "zone_update"
    timestamp: datetime
    zones: List[ZoneSummary]

class WSAlertEvent(BaseModel):
    event: str = "new_alert"
    timestamp: datetime
    alert: AlertOut

# ─── Admin / Seeding ─────────────────────────────────────────────────────────

class SeedResponse(BaseModel):
    status: str
    zones_created: int
    nodes_created: int
    readings_created: int
    predictions_created: int
    message: str
