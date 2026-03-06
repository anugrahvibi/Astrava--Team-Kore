export interface Zone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  population: number;
  description: string;
}

export interface ZoneFeature {
  type: string;
  properties: Zone;
  geometry: any;
}

export interface InfrastructureNode {
  id: string;
  type: string; // substation, water_pump, hospital, road, comm_tower
  name: string;
  lat: number;
  lon: number;
  flood_threshold: number;
  description: string;
}

export interface InfrastructureData {
  nodes: InfrastructureNode[];
  edges: any[];
}

export interface Prediction {
  zone_id: string;
  zone_name?: string;
  flood_probability: number;
  projected_water_level: number;
  lead_time_hours: number;
  alert_level: 'GREEN' | 'AMBER' | 'RED';
}

export interface Alert {
  id: number;
  zone_id: string;
  alert_level: string;
  target_role: string;
  action_text: string;
  deadline_hrs?: number;
  is_active: boolean;
  acknowledged: boolean;
  created_at: string;
}

export interface SensorReading {
  zone_id: string;
  timestamp: string;
  rainfall_mmhr: number;
  river_level_m: number;
  reservoir_pct: number;
  reservoir_inflow_m3s: number;
  reservoir_outflow_m3s: number;
}

export interface VulnerabilityData {
  singularity_analysis: Record<string, {
    betweenness: number;
    pagerank: number;
    failure_potential: number;
    recovery_difficulty: number;
  }>;
  tactical_recommendations: Array<{
    node_id: string;
    criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    mitigation_strategy: string;
    impact_description: string;
  }>;
}

export interface LeadTimeTicker {
  zone_id: string;
  alert_level: string;
  flood_probability_pct: number;
  hours_until_peak: number;
  stakeholder_action_windows: Record<string, number>;
  status: 'CRITICAL' | 'URGENT' | 'MONITORING';
}

export interface ROIRanking {
  node_id: string;
  original_impact: number;
  lives_saved: number;
  lives_saved_per_rupee: number;
  status?: string;
}

export async function fetchZones(): Promise<any> {
  try {
    const res = await fetch('/api/graph'); // Infrastructure graph for map
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend graph fetch failed", e);
  }
  const res = await fetch('/data/zones.geojson');
  return res.json();
}

export async function fetchPredictions(): Promise<Prediction[]> {
  try {
    const res = await fetch('/api/predict/zones');
    if (res.ok) {
      const data = await res.json();
      return data.predictions;
    }
  } catch (e) {
    console.warn("Backend predictions not available", e);
  }
  return [];
}

export async function fetchInfrastructure(): Promise<InfrastructureData> {
  try {
    const res = await fetch('/api/graph');
    if (res.ok) {
       const data = await res.json();
       return { nodes: Object.values(data.nodes || {}), edges: data.edges || [] };
    }
  } catch (e) {}
  const res = await fetch('/data/infrastructure_vulnerability.json');
  return res.json();
}

export async function fetchActiveAlerts(role: string): Promise<Alert[]> {
  try {
    const res = await fetch(`/api/alerts/summary`);
    if (res.ok) {
       const data = await res.json();
       // Filter zone summaries for the specific department "role"
       const allPlans: Alert[] = [];
       data.zone_summaries.forEach((zone: any) => {
         zone.action_plans.forEach((plan: any) => {
           if (plan.department === role) {
              allPlans.push({
                id: Math.random(), // transient ID
                zone_id: zone.zone_id,
                alert_level: plan.alert_level,
                target_role: plan.department,
                action_text: plan.action,
                deadline_hrs: plan.time_window_hours,
                is_active: true,
                acknowledged: false,
                created_at: zone.timestamp
              });
           }
         });
       });
       return allPlans;
    }
  } catch (e) {
    console.warn("Backend alerts not available", e);
  }
  return [];
}

export async function fetchSensorReadings(zoneId: string): Promise<SensorReading[]> {
  try {
    const res = await fetch(`/api/v1/sensors/${zoneId}/history`); // Assuming history exists or using latest
    if (res.ok) return await res.json();
  } catch (e) {
    // try latest if history fails
    try {
      const resLatest = await fetch(`/api/v1/sensors/${zoneId}/latest`);
      if (resLatest.ok) return [await resLatest.json()];
    } catch (err) {}
  }
  return [];
}

export async function fetchCascadeAnalysis(zoneId: string): Promise<any> {
  try {
    const res = await fetch(`/api/v1/cascade/${zoneId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Cascade analysis fetch failed", e);
  }
  return null;
}

export async function fetchVulnerabilities(): Promise<VulnerabilityData | null> {
  try {
    const res = await fetch('/api/analytics/vulnerability-map');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Vulnerability map fetch failed", e);
  }
  return null;
}

export async function fetchLeadTimes(): Promise<LeadTimeTicker[]> {
  try {
    const res = await fetch('/api/lead-time');
    if (res.ok) {
      const data = await res.json();
      return data.lead_time_tickers;
    }
  } catch (e) {
    console.warn("Lead time fetch failed", e);
  }
  return [];
}

export async function fetchROIRankings(): Promise<ROIRanking[]> {
  try {
    const res = await fetch('/api/roi/rank');
    if (res.ok) {
      const data = await res.json();
      return data.top_10_by_roi.map((item: any) => ({
        node_id: item.node_id,
        original_impact: item.lives_saved || 0,
        lives_saved: item.approximate_lives_saved || 0,
        lives_saved_per_rupee: item.lives_saved_per_rupee || 0
      }));
    }
  } catch (e) {
    console.warn("ROI rankings fetch failed", e);
  }
  return [];
}


// Predictions are now expected exclusively from the backend AI/ML models.
