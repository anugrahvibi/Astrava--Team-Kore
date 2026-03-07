// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  type: string;
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
  alert_level: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED';
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

// ─── Fetch Robustness ─────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30000;  // 30s for normal endpoints
const SLOW_TIMEOUT_MS = 120000;   // 120s for heavy ML computation endpoints
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
      await wait(300 * (attempt + 1));
    }
  }

  return null;
}

// ─── Client-side in-memory cache (30s TTL) ────────────────────────────────────
const _cache: Map<string, { data: any; expiry: number }> = new Map();
const CACHE_TTL_MS = 30_000;

function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  return null;
}

function cacheSet(key: string, data: any) {
  _cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function fetchZones(): Promise<any> {
  const cacheKey = 'zones';
  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<any>('/api/v1/ml/graph', { timeoutMs: SLOW_TIMEOUT_MS });
  if (data) {
    cacheSet(cacheKey, data);
    return data;
  }

  // Fallback to local file
  const fallback = await fetchJsonWithRetry<any>('/data/zones.geojson', { retries: 0, timeoutMs: 5000 });
  return fallback ?? { type: 'FeatureCollection', features: [] };
}

export async function fetchPredictions(scenario: string = 'current'): Promise<Prediction[]> {
  const cacheKey = `predictions_${scenario}`;
  const cached = cacheGet<Prediction[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<{ predictions?: Prediction[] }>(`/api/v1/ml/predict/zones?scenario=${scenario}`);
  const predictions = data?.predictions ?? [];
  if (predictions.length > 0) {
    cacheSet(cacheKey, predictions);
  }
  return predictions;
}

export async function fetchInfrastructure(): Promise<InfrastructureData> {
  const cacheKey = 'infrastructure';
  const cached = cacheGet<InfrastructureData>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<any>('/api/v1/ml/graph', { timeoutMs: SLOW_TIMEOUT_MS });
  if (data) {
    const result = { nodes: Object.values(data.nodes || {}), edges: data.edges || [] } as InfrastructureData;
    cacheSet(cacheKey, result);
    return result;
  }

  const fallback = await fetchJsonWithRetry<InfrastructureData>('/data/infrastructure_vulnerability.json', {
    retries: 0,
    timeoutMs: 5000,
  });
  return fallback ?? { nodes: [], edges: [] };
}

export async function fetchActiveAlerts(role: string, scenario: string = '2018_peak'): Promise<Alert[]> {
  const cacheKey = `alerts_${role}_${scenario}`;
  const cached = cacheGet<Alert[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<any>(`/api/v1/ml/alerts/summary?scenario=${scenario}`);
  if (data && Array.isArray(data.zone_summaries)) {
    const allPlans: Alert[] = [];
    data.zone_summaries.forEach((zone: any) => {
      if (!Array.isArray(zone?.action_plans)) return;
      zone.action_plans.forEach((plan: any, planIndex: number) => {
        if (!role || plan.department === role) {
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
    cacheSet(cacheKey, allPlans);
    return allPlans;
  }
  return [];
}

export async function fetchSensorReadings(zoneId: string): Promise<SensorReading[]> {
  const latestData = await fetchJsonWithRetry<SensorReading>(`/api/v1/sensors/${zoneId}/latest`, {
    retries: 1,
    timeoutMs: 5000,
  });
  return latestData ? [latestData] : [];
}

export async function fetchCascadeAnalysis(zoneId: string): Promise<any> {
  return await fetchJsonWithRetry<any>(`/api/v1/cascade/${zoneId}`);
}

export async function fetchVulnerabilities(): Promise<VulnerabilityData | null> {
  const cacheKey = 'vulnerabilities';
  const cached = cacheGet<VulnerabilityData>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<VulnerabilityData>('/api/v1/ml/analytics/vulnerability-map', { timeoutMs: SLOW_TIMEOUT_MS });
  if (data) {
    cacheSet(cacheKey, data);
    return data;
  }
  return null;
}

export async function fetchLeadTimes(scenario: string = '2018_peak'): Promise<LeadTimeTicker[]> {
  const cacheKey = `lead_times_${scenario}`;
  const cached = cacheGet<LeadTimeTicker[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<{ lead_time_tickers?: LeadTimeTicker[] }>(`/api/v1/ml/lead-times?scenario=${scenario}`);
  const tickers = data?.lead_time_tickers ?? [];
  if (tickers.length > 0) {
    cacheSet(cacheKey, tickers);
  }
  return tickers;
}

export async function fetchROIRankings(): Promise<ROIRanking[]> {
  const cacheKey = 'roi_rankings';
  const cached = cacheGet<ROIRanking[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<{ top_10_by_roi?: any[] }>('/api/v1/ml/roi/rank', { timeoutMs: SLOW_TIMEOUT_MS });
  if (data?.top_10_by_roi && Array.isArray(data.top_10_by_roi)) {
    const rankings = data.top_10_by_roi.map((item: any) => ({
      node_id: item.node_id,
      original_impact: item.lives_saved || 0,
      lives_saved: item.approximate_lives_saved || 0,
      lives_saved_per_rupee: item.lives_saved_per_rupee || 0,
    }));
    cacheSet(cacheKey, rankings);
    return rankings;
  }
  return [];
}
