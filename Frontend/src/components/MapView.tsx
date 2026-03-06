import React, { useEffect, useRef } from 'react';
import type { InfrastructureNode, Prediction } from '../utils/dataFetcher';

// ─── Zone IDs exactly match ZONE_FLOOD_THRESHOLDS in lstm_predictor.py ────────
const ZONE_COORDS: Record<string, [number, number]> = {
  "ZONE_FORT_KOCHI": [9.963, 76.243],
  "ZONE_VYTTILA": [9.972, 76.303],
  "ZONE_ERNAKULAM": [9.983, 76.290],
  "ZONE_KALAMASSERY": [10.054, 76.320],
  "ZONE_ALUVA": [10.098, 76.356],
  "ZONE_KAKKANAD": [10.021, 76.341],
};

function getZoneCoords(zoneId: string): [number, number] {
  return ZONE_COORDS[zoneId] ?? [9.983, 76.290]; // fallback: Ernakulam center
}

interface MapViewProps {
  zonesGeoJson: any | null;
  infrastructureNodes: InfrastructureNode[];
  predictions: Prediction[];
  onZoneClick: (zoneId: string) => void;
  selectedZoneId?: string | null;
}

export function MapView({ infrastructureNodes, predictions, onZoneClick, selectedZoneId }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const circleLayersRef = useRef<any[]>([]);
  const nodeLayersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);

  // ── Init map once ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      LRef.current = L;

      // Fix Leaflet's default icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [9.993, 76.295],
        zoom: 12,
        zoomControl: true,
      });
      mapRef.current = map;

      // Free OpenStreetMap tiles — no API key required
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Re-draw zone circles when predictions update ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !predictions || predictions.length === 0) return;

    // Clear old circles safely
    circleLayersRef.current.forEach(c => {
      try { c.remove(); } catch (e) { }
    });
    circleLayersRef.current = [];

    predictions.forEach((p) => {
      if (!p || !p.zone_id) return;
      const coords = getZoneCoords(p.zone_id);
      const color =
        p.alert_level === 'RED' ? '#ef4444' :
          (p.alert_level === 'AMBER' || p.alert_level === 'ORANGE') ? '#f59e0b' : '#10b981';
      const pct = Math.round((p.flood_probability ?? 0) * 100);
      const isSelected = p.zone_id === selectedZoneId;
      const name = (p as any).zone_name || p.zone_id.replace('ZONE_', '').replace(/_/g, ' ');

      try {
        const circle = L.circle(coords, {
          radius: 1400,          // ~1.4km radius — clearly visible at zoom 12
          color,
          fillColor: color,
          fillOpacity: p.alert_level === 'RED' ? 0.40 : (p.alert_level === 'AMBER' || p.alert_level === 'ORANGE' ? 0.28 : 0.12),
          weight: isSelected ? 4 : 2,
          opacity: 0.9,
        }).addTo(map);

        // Permanent, high-fidelity card for RED/AMBER zones
        if (p.alert_level !== 'GREEN') {
          circle.bindTooltip(
            `<div class="map-tooltip-card">
              <div class="tooltip-header">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full animate-pulse" style="background: ${color}"></div>
                  <span class="tooltip-title">${name}</span>
                </div>
                <span class="tooltip-badge" style="background:${color}20; color:${color}; border: 1px solid ${color}30">${p.alert_level}</span>
              </div>
              <div class="tooltip-body">
                <div class="tooltip-metric">
                  <span class="metric-value"><span class="metric-icon">🌊</span>${pct}%</span>
                  <span class="metric-label">Risk Index</span>
                </div>
                <div class="tooltip-metric">
                  <span class="metric-value"><span class="metric-icon">⏱</span>${(p as any).lead_time_hours?.toFixed(1) ?? '?'}h</span>
                  <span class="metric-label">Window</span>
                </div>
              </div>
            </div>`,
            { permanent: true, direction: 'top', className: 'cascade-tooltip', offset: [0, -8] }
          );
        } else {
          circle.bindTooltip(`<span><b>${name}</b> · ${pct}% · <span style="opacity:0.6">STABLE</span></span>`, { direction: 'top', className: 'cascade-tooltip-simple' });
        }

        circle.on('click', () => onZoneClick(p.zone_id));
        circleLayersRef.current.push(circle);
      } catch (err) {
        console.warn("Map Circle Error:", err);
      }
    });
  }, [predictions, selectedZoneId]);

  // ── Draw infrastructure nodes once they arrive ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !infrastructureNodes || infrastructureNodes.length === 0) return;

    // Clear old node markers safely
    nodeLayersRef.current.forEach(m => {
      try { m.remove(); } catch (e) { }
    });
    nodeLayersRef.current = [];


    const cfg: Record<string, { color: string; emoji: string }> = {
      substation: { color: '#ef4444', emoji: '⚡' },
      water_pump: { color: '#3b82f6', emoji: '💧' },
      hospital: { color: '#10b981', emoji: '🏥' },
      road: { color: '#f59e0b', emoji: '🛣️' },
      comm_tower: { color: '#8b5cf6', emoji: '📡' },
    };

    infrastructureNodes.forEach((node) => {
      if (!node.lat || !node.lon) return;
      const c = cfg[node.type] ?? { color: '#64748b', emoji: '📍' };
      const icon = L.divIcon({
        html: `<div style="
          width:22px;height:22px;border-radius:50%;
          background:${c.color};border:2px solid white;
          box-shadow:0 2px 8px ${c.color}99;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;cursor:pointer;">${c.emoji}</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([node.lat, node.lon], { icon }).addTo(map);
      marker.bindTooltip(
        `<b>${node.name}</b><br/>${node.type.replace(/_/g, ' ')}<br/>Threshold: ${node.flood_threshold}m`,
        { direction: 'top' }
      );
      nodeLayersRef.current.push(marker);
    });
  }, [infrastructureNodes]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Risk Legend */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderRadius: 12, padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.08)',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 6 }}>
          Risk Level
        </div>
        {([['#ef4444', 'RED – Critical'], ['#f59e0b', 'AMBER – Elevated'], ['#10b981', 'GREEN – Stable']] as const).map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#374151' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Loading overlay while predictions not yet arrived */}
      {predictions.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13, color: '#64748b' }}>
            ⏳ Loading live AI data...
          </div>
        </div>
      )}
    </div>
  );
}
