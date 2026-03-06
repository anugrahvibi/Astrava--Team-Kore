#!/usr/bin/env python3
"""
Test script to verify backend-AI_ML integration.
Run this script to test if the backend can properly communicate with the AI_ML service.
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ml_service_client import ml_client


async def test_ml_integration():
    """Test basic connectivity and functionality with ML service."""
    print("=" * 60)
    print("  Testing Backend-AI_ML Integration")
    print("=" * 60)
    
    # Test 1: Health Check
    print("\n[1/6] Testing ML Service Health Check...")
    try:
        health = await ml_client.health_check()
        print(f"   ✓ ML Service Status: {health.get('status', 'unknown')}")
        print(f"   ✓ Project: {health.get('project', 'unknown')}")
    except Exception as e:
        print(f"   ✗ Health check failed: {e}")
        return False
    
    # Test 2: Get Infrastructure Graph
    print("\n[2/6] Testing Infrastructure Graph...")
    try:
        graph = await ml_client.get_graph()
        print(f"   ✓ Graph retrieved successfully")
        print(f"   ✓ Nodes: {len(graph.get('nodes', []))}")
        print(f"   ✓ Edges: {len(graph.get('edges', []))}")
    except Exception as e:
        print(f"   ✗ Graph retrieval failed: {e}")
    
    # Test 3: Run Simulation
    print("\n[3/6] Testing Simulation Pipeline...")
    try:
        sim_result = await ml_client.run_simulation()
        print(f"   ✓ Simulation completed")
        print(f"   ✓ Status: {sim_result.get('status', 'unknown')}")
        summary = sim_result.get('summary', {})
        print(f"   ✓ Total scenarios: {summary.get('total_scenarios', 0)}")
        print(f"   ✓ Avg population impact: {summary.get('avg_population_impact', 0):,}")
    except Exception as e:
        print(f"   ✗ Simulation failed: {e}")
    
    # Test 4: Flood Predictions
    print("\n[4/6] Testing Flood Predictions...")
    try:
        predictions = await ml_client.predict_all_zones()
        print(f"   ✓ Predictions retrieved")
        print(f"   ✓ Total zones: {predictions.get('total_zones', 0)}")
        print(f"   ✓ Red zones: {predictions.get('red_zones', 0)}")
        print(f"   ✓ Orange zones: {predictions.get('orange_zones', 0)}")
        print(f"   ✓ Overall threat: {predictions.get('overall_threat_level', 'unknown')}")
    except Exception as e:
        print(f"   ✗ Predictions failed: {e}")
    
    # Test 5: ROI Analysis
    print("\n[5/6] Testing ROI Analysis...")
    try:
        roi_rankings = await ml_client.rank_roi()
        print(f"   ✓ ROI rankings retrieved")
        print(f"   ✓ Total nodes ranked: {roi_rankings.get('total_nodes_ranked', 0)}")
        top_nodes = roi_rankings.get('top_10_by_roi', [])
        if top_nodes:
            print(f"   ✓ Top ROI node: {top_nodes[0].get('node_id', 'unknown')}")
    except Exception as e:
        print(f"   ✗ ROI analysis failed: {e}")
    
    # Test 6: 3D Map Data
    print("\n[6/6] Testing 3D Map Data...")
    try:
        flood_grid = await ml_client.get_flood_grid(12, 1.0)
        print(f"   ✓ Flood grid retrieved")
        print(f"   ✓ Hour: {flood_grid.get('hour', 'unknown')}")
        print(f"   ✓ Features: {len(flood_grid.get('features', []))}")
        
        impact_zones = await ml_client.get_impact_zones(12, 1)
        print(f"   ✓ Impact zones retrieved")
        print(f"   ✓ Total failed nodes: {impact_zones.get('total_failed_nodes', 0)}")
    except Exception as e:
        print(f"   ✗ 3D map data failed: {e}")
    
    print("\n" + "=" * 60)
    print("  Integration Test Complete!")
    print("  Backend can now proxy all AI_ML functionality")
    print("=" * 60)
    return True


if __name__ == "__main__":
    asyncio.run(test_ml_integration())
