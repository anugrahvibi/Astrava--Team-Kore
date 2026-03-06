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


// Predictions are now expected exclusively from the backend AI/ML models.
