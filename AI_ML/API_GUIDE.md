# CascadeNet 2.0 — API Integration Guide
> For the Frontend Developer · Base URL: `http://localhost:8000`

## Quick Start
```js
const API = 'http://localhost:8000'; // change to server IP if not localhost
```

---

## Endpoints

### 1. Health Check
```js
// GET /
const res = await fetch(`${API}/`);
const data = await res.json();
// data.status === 'online'
```

---

### 2. Run Full Simulation
```js
// POST /simulate  (~15s on first call, fast after)
const res = await fetch(`${API}/simulate`, { method: 'POST' });
const data = await res.json();
```
**Response shape:**
```json
{
  "summary": {
    "total_scenarios": 100,
    "avg_population_impact": 529280,
    "max_population_impact": 545000,
    "min_population_impact": 510000,
    "avg_failed_nodes": 16.5,
    "worst_scenario": {
      "id": 1, "severity": "EXTREME", "peak_multiplier": 1.19,
      "failed_nodes": 17, "population_impact": 545000
    },
    "most_vulnerable_nodes": [
      { "node_id": "SUB_4", "failure_count": 100, "failure_rate": 1.0 }
    ]
  },
  "top_5_worst_scenarios": [...],
  "top_5_best_scenarios": [...]
}
```

---

### 3. Get All 100 Scenarios
```js
// GET /scenarios
const res = await fetch(`${API}/scenarios`);
const data = await res.json();
// data.scenarios → array of 100 results, sorted worst-first
```
**Each scenario:**
```json
{
  "scenario_id": 1,
  "severity": "HIGH",
  "peak_multiplier": 1.15,
  "failures_timeline": {
    "6": ["SUB_4"],
    "7": ["PUMP_6", "PUMP_7"],
    "8": ["HOSP_3"]
  },
  "failed_nodes": ["SUB_4", "PUMP_6", "PUMP_7", "HOSP_3"],
  "total_failed_nodes": 17,
  "total_population_impact": 545000
}
```

---

### 4. Get Infrastructure Graph
```js
// GET /graph
const res = await fetch(`${API}/graph`);
const data = await res.json();
// data.nodes → array of all 18 nodes
// data.edges → array of all 16 edges with failure_probability
```
**Node fields:** `id, type, name, lat, lon, flood_threshold, population_impact, status`  
**Edge fields:** `source, target, dependency, distance_km, failure_probability`

---

### 5. Get Single Node
```js
// GET /node/{node_id}
const res = await fetch(`${API}/node/SUB_4`);
const data = await res.json();
// data.attributes → full node info
// data.parents → upstream nodes
// data.children → downstream nodes
```

---

### 6. What-If Harden Analysis (Key Demo Feature)
```js
// POST /harden/{node_id}
const res = await fetch(`${API}/harden/SUB_4`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cost_rupees: 1000000 }) // ₹10 lakh
});
const data = await res.json();
```
**Response shape:**
```json
{
  "roi": {
    "node_id": "SUB_4",
    "node_name": "Fort Kochi Substation",
    "hardening_cost_inr": 1000000,
    "approximate_lives_saved": 85000,
    "roi_ratio": 2.4,
    "lives_saved_per_rupee": 0.085,
    "recommendation": "EXCELLENT — Strongly recommended."
  },
  "baseline_avg_impact": 529280,
  "hardened_avg_impact": 220000
}
```

---

### 7. ROI Ranking (All Nodes)
```js
// GET /roi/rank  (~30s, runs 18 hardening simulations)
const res = await fetch(`${API}/roi/rank`);
const data = await res.json();
// data.top_10_by_roi → sorted by lives_saved_per_rupee descending
```

---

## Node Reference

| ID | Type | Population Impact | Flood Risk |
|----|------|-------------------|------------|
| SUB_1 | substation | 50,000 | Medium |
| SUB_2 | substation | 40,000 | Medium |
| SUB_3 | substation | 45,000 | **High** |
| SUB_4 | substation | 30,000 | **Extreme** |
| SUB_5 | substation | 35,000 | Low |
| PUMP_1–10 | water_pump | 12k–28k | Varies |
| HOSP_1 | hospital | 80,000 | Medium |
| HOSP_2 | hospital | 60,000 | High |
| HOSP_3 | hospital | 40,000 | **Extreme** |

## CORS
✅ All origins allowed — no proxy needed for development.

## Tips
- Call `/simulate` once on app load and cache the result
- `/harden` is expensive — debounce UI calls
- Node `lat/lon` are real Kochi coordinates — use directly with Leaflet/Mapbox
