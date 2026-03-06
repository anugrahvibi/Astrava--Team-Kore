"""
CascadeNet Backend — ORM Models
SQLAlchemy table definitions matching the PRD schema (Section 7.3).
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String, Float, Integer, Boolean, DateTime, Text,
    ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


# ─── Zone ─────────────────────────────────────────────────────────────────────

class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, default="Godavari Basin")
    # GeoJSON polygon as string (PostGIS geometry in prod, JSON string in SQLite)
    geometry_geojson: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    elevation_avg_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Comma-separated upstream/downstream zone IDs
    upstream_zone_ids: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    downstream_zone_ids: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Current alert level (cached)
    current_alert_level: Mapped[str] = mapped_column(String, default="GREEN")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    sensor_readings: Mapped[List["SensorReading"]] = relationship(back_populates="zone")
    predictions: Mapped[List["Prediction"]] = relationship(back_populates="zone")
    infrastructure_nodes: Mapped[List["InfrastructureNode"]] = relationship(back_populates="zone")


# ─── Sensor Readings ──────────────────────────────────────────────────────────

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Sensor channels (from PRD Section 4.3)
    rainfall_mmhr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    river_level_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reservoir_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reservoir_inflow_m3s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reservoir_outflow_m3s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Data quality flags
    rainfall_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    river_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    reservoir_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    data_quality: Mapped[str] = mapped_column(String, default="good")  # good | degraded | insufficient

    # Source metadata
    rainfall_source: Mapped[str] = mapped_column(String, default="NASA GPM IMERG")
    river_source: Mapped[str] = mapped_column(String, default="CWC RTDAS")
    reservoir_source: Mapped[str] = mapped_column(String, default="CWC Portal")

    zone: Mapped["Zone"] = relationship(back_populates="sensor_readings")


# ─── Predictions ──────────────────────────────────────────────────────────────

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # ML output (PRD Section 5.1)
    flood_probability: Mapped[float] = mapped_column(Float, nullable=False)
    projected_water_level_m: Mapped[float] = mapped_column(Float, nullable=False)
    lead_time_hrs: Mapped[float] = mapped_column(Float, nullable=False)
    alert_level: Mapped[str] = mapped_column(String, nullable=False)  # RED | AMBER | GREEN

    # Confidence and signal state
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    rainfall_signal: Mapped[bool] = mapped_column(Boolean, default=False)
    river_signal: Mapped[bool] = mapped_column(Boolean, default=False)
    reservoir_signal: Mapped[bool] = mapped_column(Boolean, default=False)
    two_signal_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    model_version: Mapped[str] = mapped_column(String, default="cascade_v1")
    is_simulation: Mapped[bool] = mapped_column(Boolean, default=False)

    zone: Mapped["Zone"] = relationship(back_populates="predictions")


# ─── Infrastructure Nodes ─────────────────────────────────────────────────────

class InfrastructureNode(Base):
    __tablename__ = "infrastructure_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False)

    # Node attributes
    node_type: Mapped[str] = mapped_column(String, nullable=False)  # road | power | hospital | water_pump
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Location
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Cascade thresholds (PRD Section 5.2)
    flood_depth_threshold_m: Mapped[float] = mapped_column(Float, nullable=False)
    failure_time_offset_hrs: Mapped[float] = mapped_column(Float, nullable=False)
    affected_population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Action routing (PRD Section 6.3/6.4)
    action_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responsible_dept: Mapped[str] = mapped_column(String, nullable=False)

    # Dependency graph (comma-separated node IDs this node depends on)
    dependency_ids: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Current operational status
    current_status: Mapped[str] = mapped_column(String, default="OPERATIONAL")

    zone: Mapped["Zone"] = relationship(back_populates="infrastructure_nodes")


# ─── Alerts ───────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False)
    prediction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("predictions.id"), nullable=True)

    alert_level: Mapped[str] = mapped_column(String, nullable=False)  # RED | AMBER | GREEN
    target_role: Mapped[str] = mapped_column(String, nullable=False)  # dam_operator | ndrf | collector | hospital | highway | power | public

    # The generated action text (from rules engine)
    action_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_citation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deadline_hrs: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Status tracking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    acknowledged_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


# ─── Simulation Events ────────────────────────────────────────────────────────

class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_name: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="running")  # running | complete | failed
    result_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON blob
