# CascadeNet Backend

AI-Powered Flood Prediction & Infrastructure Cascade Analysis — Backend Service

## Stack
- **FastAPI** (Python 3.11+) — REST API + WebSocket
- **PostgreSQL + PostGIS** — Geospatial data storage
- **Redis** — Real-time alert state & caching
- **Docker Compose** — Service orchestration

## Quick Start (Docker)

```bash
cd backend
docker compose up --build
```

API available at: `http://localhost:8000`
Docs at: `http://localhost:8000/docs`

## Quick Start (Local Dev — no Docker)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> Note: Local dev uses SQLite + in-memory cache as fallback (no Docker required)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/zones` | All zones with risk level |
| GET | `/api/v1/zones/{zone_id}/prediction` | Flood prediction for a zone |
| GET | `/api/v1/zones/{zone_id}/cascade` | Infrastructure cascade for a zone |
| GET | `/api/v1/alerts/active` | Active alerts (role-based) |
| POST | `/api/v1/simulate` | Run historical scenario replay |
| GET | `/api/v1/sensors/{zone_id}` | Live sensor readings for a zone |
| GET | `/api/v1/stakeholders/{role}/actions` | Dept-specific action items |
| GET | `/api/v1/infrastructure/nodes` | All infrastructure nodes |
| GET | `/api/v1/infrastructure/nodes/{node_id}` | Single node detail |
| POST | `/api/v1/admin/seed` | Seed database with demo data |
| WS | `/ws/live-updates` | WebSocket for live zone updates |

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app entry point
    config.py            # Settings (env vars, DB URL)
    database.py          # SQLAlchemy setup
    models/              # Database ORM models
    schemas/             # Pydantic request/response schemas
    routers/             # API route handlers
    services/            # Business logic layer
    data/                # Static data (zones, infra, truth tables)
  docker-compose.yml
  Dockerfile
  requirements.txt
  .env.example
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | sqlite (fallback) | PostgreSQL connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `ML_SERVICE_URL` | http://localhost:8002 | ML inference service URL |
| `PREDICTION_CYCLE_MINUTES` | 30 | How often to refresh predictions |
| `SECRET_KEY` | changeme | JWT secret for auth |
