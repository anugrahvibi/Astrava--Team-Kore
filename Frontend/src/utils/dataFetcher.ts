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

const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_RETRIES = 2;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRetry<T>(
  url: string,
  options: { retries?: number; timeoutMs?: number; init?: RequestInit } = {}
): Promise<T | null> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options.init, timeoutMs);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt === retries) {
        console.warn(`Fetch failed for ${url} after ${retries + 1} attempts`, error);
        return null;
      }
      await wait(250 * (attempt + 1));
    }
  }

  return null;
}

export async function fetchZones(): Promise<any> {
  const apiData = await fetchJsonWithRetry<any>('/api/graph');
  if (apiData) return apiData;

  const fallback = await fetchJsonWithRetry<any>('/data/zones.geojson', { retries: 0, timeoutMs: 5000 });
  return fallback ?? { type: 'FeatureCollection', features: [] };
}

export async function fetchPredictions(): Promise<Prediction[]> {
  const data = await fetchJsonWithRetry<{ predictions?: Prediction[] }>('/api/predict/zones');
  if (data?.predictions && Array.isArray(data.predictions)) {
    return data.predictions;
  }
  return [];
}

export async function fetchInfrastructure(): Promise<InfrastructureData> {
  const apiData = await fetchJsonWithRetry<any>('/api/graph');
  if (apiData) {
    return { nodes: Object.values(apiData.nodes || {}), edges: apiData.edges || [] };
  }

  const fallback = await fetchJsonWithRetry<InfrastructureData>('/data/infrastructure_vulnerability.json', {
    retries: 0,
    timeoutMs: 5000,
  });

  return fallback ?? { nodes: [], edges: [] };
}

export async function fetchActiveAlerts(role: string): Promise<Alert[]> {
  const data = await fetchJsonWithRetry<any>(`/api/alerts/summary`);
  if (!data || !Array.isArray(data.zone_summaries)) {
    return [];
  }

  const allPlans: Alert[] = [];
  data.zone_summaries.forEach((zone: any) => {
    if (!Array.isArray(zone?.action_plans)) return;
    zone.action_plans.forEach((plan: any, planIndex: number) => {
      if (plan.department === role) {
        allPlans.push({
          id: Number(`${Date.parse(zone.timestamp || new Date().toISOString())}${planIndex}`),
          zone_id: zone.zone_id,
          alert_level: plan.alert_level,
          target_role: plan.department,
          action_text: plan.action,
          deadline_hrs: plan.time_window_hours,
          is_active: true,
          acknowledged: false,
          created_at: zone.timestamp,
        });
      }
    });
  });

  if (allPlans.length === 0) {
    console.warn(`No active alert plans for role: ${role}`);
  }

  return allPlans;
}

export async function fetchSensorReadings(zoneId: string): Promise<SensorReading[]> {
  const historyData = await fetchJsonWithRetry<SensorReading[]>(`/api/v1/sensors/${zoneId}/history`);
  if (Array.isArray(historyData) && historyData.length > 0) {
    return historyData;
  }

  const latestData = await fetchJsonWithRetry<SensorReading>(`/api/v1/sensors/${zoneId}/latest`, {
    retries: 1,
    timeoutMs: 5000,
  });
  if (latestData) return [latestData];

  return [];
}

export async function fetchCascadeAnalysis(zoneId: string): Promise<any> {
  return await fetchJsonWithRetry<any>(`/api/v1/cascade/${zoneId}`);
}

export async function fetchVulnerabilities(): Promise<VulnerabilityData | null> {
  return await fetchJsonWithRetry<VulnerabilityData>('/api/analytics/vulnerability-map');
}

export async function fetchLeadTimes(): Promise<LeadTimeTicker[]> {
  const data = await fetchJsonWithRetry<{ lead_time_tickers?: LeadTimeTicker[] }>('/api/lead-time');
  if (data?.lead_time_tickers && Array.isArray(data.lead_time_tickers)) {
    return data.lead_time_tickers;
  }
  return [];
}

export async function fetchROIRankings(): Promise<ROIRanking[]> {
  const data = await fetchJsonWithRetry<{ top_10_by_roi?: any[] }>('/api/roi/rank');
  if (!data?.top_10_by_roi || !Array.isArray(data.top_10_by_roi)) {
    return [];
  }

  return data.top_10_by_roi.map((item: any) => ({
    node_id: item.node_id,
    original_impact: item.lives_saved || 0,
    lives_saved: item.approximate_lives_saved || 0,
    lives_saved_per_rupee: item.lives_saved_per_rupee || 0,
  }));
}


// Predictions are now expected exclusively from the backend AI/ML models.
