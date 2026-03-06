"""
CascadeNet Backend — Admin Router
Endpoints for initialization and data seeding. (Synchronous version)
"""
import json
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.database import get_db
from app.models import Zone, InfrastructureNode, SensorReading, Prediction, Alert
from app.schemas import SeedResponse
from app.services.sensor_service import SensorService
from app.services.prediction_service import PredictionService
from app.services.actionability_service import ActionabilityService


router = APIRouter(prefix="/admin", tags=["Admin"])

# ── Paths ─────────────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
ZONES_FILE = os.path.join(DATA_DIR, "zones.json")
INFRA_FILE = os.path.join(DATA_DIR, "infrastructure_vulnerability.json")


@router.post("/seed", response_model=SeedResponse)
def seed_database(db: Session = Depends(get_db)):
    """Initialize the database with PRD-compliant demo data (Godavari Basin)."""
    try:
        # 1. Clean up existing data
        db.execute(delete(Alert))
        db.execute(delete(Prediction))
        db.execute(delete(SensorReading))
        db.execute(delete(InfrastructureNode))
        db.execute(delete(Zone))
        db.commit()

        # 2. Seed Zones
        with open(ZONES_FILE, "r") as f:
            zone_data = json.load(f)["zones"]
            
        zones = []
        for zd in zone_data:
            zone = Zone(
                id=zd["id"],
                name=zd["name"],
                region=zd["region"],
                elevation_avg_m=zd.get("elevation_avg_m"),
                population=zd.get("population"),
                geometry_geojson=json.dumps(zd.get("geometry")),
                upstream_zone_ids=",".join(zd.get("upstream_zone_ids", [])),
                downstream_zone_ids=",".join(zd.get("downstream_zone_ids", []))
            )
            db.add(zone)
            zones.append(zone)
        
        db.commit()

        # 3. Seed Infrastructure Nodes
        with open(INFRA_FILE, "r") as f:
            infra_data = json.load(f)
            
        nodes_count = 0
        for zid, zd in infra_data.items():
            for nd in zd["nodes"]:
                node = InfrastructureNode(
                    id=nd["id"],
                    zone_id=zid,
                    node_type=nd["type"],
                    name=nd["name"],
                    description=nd.get("description"),
                    lat=nd.get("lat"),
                    lon=nd.get("lon"),
                    flood_depth_threshold_m=nd["flood_depth_threshold_m"],
                    failure_time_offset_hrs=nd["failure_time_offset_hrs"],
                    affected_population=nd.get("affected_population"),
                    action_template=nd.get("action_template"),
                    responsible_dept=nd["responsible_dept"],
                    dependency_ids=",".join(nd.get("dependency_ids", []))
                )
                db.add(node)
                nodes_count += 1
        
        db.commit()

        # 4. Generate Initial Sensors & Predictions
        readings_count = 0
        preds_count = 0
        for zone in zones:
            scenario = "flood_imminent" if zone.id == "zone_b_godavari_mid" else "normal"
            mock_reading_data = SensorService.generate_mock_reading(zone.id, scenario)
            
            reading = SensorService.create_reading(db, mock_reading_data)
            readings_count += 1
            
            prediction = PredictionService.generate_prediction(db, zone.id, reading)
            preds_count += 1
            
            ActionabilityService.generate_action_bundle(db, zone.id, prediction, reading)

        return SeedResponse(
            status="success",
            zones_created=len(zones),
            nodes_created=nodes_count,
            readings_created=readings_count,
            predictions_created=preds_count,
            message="CascadeNet demo database seeded successfully with Godavari Basin data."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")
