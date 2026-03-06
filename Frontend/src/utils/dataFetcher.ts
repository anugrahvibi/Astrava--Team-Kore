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

export async function fetchZones(): Promise<any> {
  const res = await fetch('/data/zones.geojson');
  return res.json();
}

export async function fetchInfrastructure(): Promise<InfrastructureData> {
  const res = await fetch('/data/infrastructure_vulnerability.json');
  return res.json();
}

// Mock prediction data since it might not be fully present in the real static files yet
export function generateMockPredictions(zonesList: any[]): Prediction[] {
  return zonesList.map((z, i) => {
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
      zone_id: z.properties.id,
      zone_name: z.properties.name,
      flood_probability: prob,
      projected_water_level: waterLevel,
      lead_time_hours: leadTime,
      alert_level
    };
  });
}
