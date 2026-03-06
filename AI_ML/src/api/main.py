"""
CascadeNet 2.0 — FastAPI Application
Exposes the full cascade simulation pipeline via HTTP endpoints.
"""

import copy
import json
import os
import sys

# Ensure src is importable when running from AI_ML root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.models.dependency_graph import DependencyGraph
from src.models.hazard_generator import HazardGenerator
from src.models.cascade_propagator import CascadePropagator
from src.models.roi_calculator import ROICalculator

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CascadeNet 2.0 API",
    description="Infrastructure cascade failure prediction for Kochi, Kerala. Asthrava Hackathon.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Singleton pipeline state ────────────────────────────────────────────────

_dep_graph: DependencyGraph | None = None
_hazard_gen: HazardGenerator | None = None
_scenarios: list[dict] | None = None
_baseline_results: list[dict] | None = None
_original_thresholds: dict = {}


def _get_pipeline():
    """Lazy-initialize the pipeline on first request."""
    global _dep_graph, _hazard_gen, _scenarios, _baseline_results, _original_thresholds

    if _dep_graph is None:
        print("[API] Initializing pipeline...")
        _dep_graph = DependencyGraph()
        _dep_graph.build()
        _original_thresholds = _dep_graph.get_node_original_thresholds()

        _hazard_gen = HazardGenerator(n_scenarios=100)
        _scenarios = _hazard_gen.generate_scenarios()

        propagator = CascadePropagator(_dep_graph.graph, _hazard_gen)
        _baseline_results = propagator.run_all_scenarios(_scenarios, use_multiprocessing=False)
        propagator.save_results(_baseline_results)

        print("[API] Pipeline ready.")

    return _dep_graph, _hazard_gen, _scenarios, _baseline_results


# ─── Request/Response Models ──────────────────────────────────────────────────

class HardenRequest(BaseModel):
    cost_rupees: float = 1_000_000  # Default 10 lakh INR


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    """Health check endpoint. Returns system status."""
    return {
        "status": "online",
        "project": "CascadeNet 2.0",
        "description": "Infrastructure cascade failure prediction — Kochi, Kerala",
        "team": "Asthrava Hackathon",
        "endpoints": ["/simulate", "/scenarios", "/graph", "/harden/{node_id}", "/roi/rank"],
    }


@app.post("/simulate", tags=["Simulation"])
def simulate():
    """
    Run the full 100-scenario cascade simulation pipeline.
    Returns aggregate statistics and top 5 worst scenarios.
    """
    dg, gen, scenarios, results = _get_pipeline()
    propagator = CascadePropagator(dg.graph, gen)
    summary = propagator.get_summary(results)

    return {
        "status": "success",
        "summary": summary,
        "top_5_worst_scenarios": results[:5],
        "top_5_best_scenarios": results[-5:],
    }


@app.get("/scenarios", tags=["Simulation"])
def get_scenarios():
    """
    Return all 100 scenario results with failure timelines.
    Sorted by population impact (worst first).
    """
    _, _, _, results = _get_pipeline()
    return {
        "total": len(results),
        "scenarios": results,
    }


@app.get("/graph", tags=["Infrastructure"])
def get_graph():
    """Return the full infrastructure graph (nodes + RF-weighted edges)."""
    dg, _, _, _ = _get_pipeline()
    return dg.to_dict()


@app.get("/node/{node_id}", tags=["Infrastructure"])
def get_node(node_id: str):
    """Get details for a specific infrastructure node."""
    dg, _, _, _ = _get_pipeline()
    if node_id not in dg.graph.nodes:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    attrs = dict(dg.graph.nodes[node_id])
    parents = list(dg.graph.predecessors(node_id))
    children = list(dg.graph.successors(node_id))

    return {
        "node_id": node_id,
        "attributes": attrs,
        "parents": parents,
        "children": children,
    }


@app.post("/harden/{node_id}", tags=["What-If Analysis"])
def harden_node(node_id: str, body: HardenRequest):
    """
    Harden a node (set threshold → ∞), re-run simulation, and compute ROI.

    This is the core What-If ROI endpoint for the hackathon demo.
    Shows how much population impact is reduced by protecting one node.
    """
    dg, gen, scenarios, baseline_results = _get_pipeline()

    if node_id not in dg.graph.nodes:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    # Save original threshold and harden
    original_thresh = _original_thresholds.get(node_id, dg.graph.nodes[node_id]["flood_threshold"])
    dg.harden_node(node_id)

    # Re-simulate with hardened graph
    propagator = CascadePropagator(dg.graph, gen)
    hardened_results = propagator.run_all_scenarios(scenarios, use_multiprocessing=False)

    # Compute ROI
    roi_calc = ROICalculator()
    roi = roi_calc.calculate_roi(
        graph=dg.graph,
        baseline_results=baseline_results,
        hardened_results=hardened_results,
        cost_rupees=body.cost_rupees,
        node_id=node_id,
    )

    hardened_summary = propagator.get_summary(hardened_results)

    # Restore original threshold after analysis
    dg.soften_node(node_id, original_thresh)

    return {
        "status": "success",
        "action": f"Hardened '{node_id}' for What-If analysis",
        "roi": roi,
        "hardened_simulation_summary": hardened_summary,
        "baseline_avg_impact": sum(r["total_population_impact"] for r in baseline_results) // len(baseline_results),
        "hardened_avg_impact": sum(r["total_population_impact"] for r in hardened_results) // len(hardened_results),
    }


@app.get("/roi/rank", tags=["What-If Analysis"])
def rank_roi():
    """
    Rank all infrastructure nodes by ROI of hardening.
    Shows judges the optimal investment strategy.
    Returns top 10 nodes sorted by Lives-Saved-Per-Rupee.
    """
    dg, gen, scenarios, baseline_results = _get_pipeline()
    roi_calc = ROICalculator()
    COST = 1_000_000  # 10 lakh INR per node hardening

    rankings = []
    for node_id in dg.graph.nodes:
        original_thresh = _original_thresholds.get(node_id)
        dg.harden_node(node_id)

        propagator = CascadePropagator(dg.graph, gen)
        hardened_results = propagator.run_all_scenarios(scenarios, use_multiprocessing=False)

        roi = roi_calc.calculate_roi(dg.graph, baseline_results, hardened_results, COST, node_id)
        rankings.append(roi)

        dg.soften_node(node_id, original_thresh)

    rankings.sort(
        key=lambda x: x["lives_saved_per_rupee"] if x["lives_saved_per_rupee"] != float("inf") else 1e18,
        reverse=True,
    )

    return {
        "status": "success",
        "hardening_cost_per_node_inr": COST,
        "total_nodes_ranked": len(rankings),
        "top_10_by_roi": rankings[:10],
    }
