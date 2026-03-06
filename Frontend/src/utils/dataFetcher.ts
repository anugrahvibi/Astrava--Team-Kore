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
    const res = await fetch('/api/v1/zones');
    if (res.ok) {
      const data = await res.json();
      // Format backend response to match expected geojson-ish or list structure
      return data;
    }
  } catch (e) {
    console.warn("Backend not available, falling back to static zones", e);
  }
  const res = await fetch('/data/zones.geojson');
  return res.json();
}

export async function fetchPredictions(): Promise<Prediction[]> {
  try {
    const res = await fetch('/api/v1/zones');
    if (res.ok) {
      const data = await res.json();
      return data.map((z: any) => ({
        zone_id: z.id,
        zone_name: z.name,
        flood_probability: z.flood_probability,
        projected_water_level: z.projected_water_level_m,
        lead_time_hours: z.lead_time_hrs,
        alert_level: z.current_alert_level as 'GREEN' | 'AMBER' | 'RED'
      }));
    }
  } catch (e) {
    console.warn("Backend predictions not available", e);
  }
  return [];
}

export async function fetchInfrastructure(): Promise<InfrastructureData> {
  const res = await fetch('/data/infrastructure_vulnerability.json');
  return res.json();
}

export async function fetchActiveAlerts(role: string): Promise<Alert[]> {
  try {
    const res = await fetch(`/api/v1/alerts/active?role=${encodeURIComponent(role)}`);
    if (res.ok) return await res.json();
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

// Mock prediction data since it might not be fully present in the real static files yet
export function generateMockPredictions(zonesList: any[]): Prediction[] {
  // If we have real predictions from backend, we might not need this, 
  // but let's keep it as fallback if zonesList is geojson
  if (!zonesList || zonesList.length === 0) return [];
  
  return zonesList.map((z, i) => {
    // Handle both GeoJSON features and flat backend objects
    const props = z.properties || z;
    const isHighRisk = i % 3 === 0;
    const isMedium = i % 3 === 1;
    let alert_level: 'GREEN'|'AMBER'|'RED' = 'GREEN';
    let prob = Math.random() * 0.3;
    let waterLevel = Math.random() * 0.5;
    let leadTime = 24 + Math.floor(Math.random() * 48);

    if (isHighRisk) {
      alert_level = 'RED';
      prob = 0.8 + Math.random() * 0.2;
      waterLevel = 1.0 + Math.random() * 2.0;
      leadTime = 2 + Math.floor(Math.random() * 10);
    } else if (isMedium) {
      alert_level = 'AMBER';
      prob = 0.4 + Math.random() * 0.3;
      waterLevel = 0.5 + Math.random() * 0.5;
      leadTime = 12 + Math.floor(Math.random() * 24);
    }

    return {
      zone_id: props.id,
      zone_name: props.name,
      flood_probability: props.flood_probability || prob,
      projected_water_level: props.projected_water_level_m || waterLevel,
      lead_time_hours: props.lead_time_hrs || leadTime,
      alert_level: (props.current_alert_level as any) || alert_level
    };
  });
}
