import React, { useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InfrastructureNode, Prediction } from '../utils/dataFetcher';

// Dummy token for development if no env var exists. 
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapViewProps {
  zonesGeoJson: any | null;
  infrastructureNodes: InfrastructureNode[];
  predictions: Prediction[];
  onZoneClick: (zoneId: string) => void;
  selectedZoneId?: string | null;
}

export function MapView({ zonesGeoJson, infrastructureNodes, predictions, onZoneClick, selectedZoneId }: MapViewProps) {
  
  // Style config for the geojson source
  const paintConfig = useMemo(() => {
    // Generate fill colors based on prediction alerts
    const matchExpr: any[] = ['match', ['get', 'id']];
    predictions.forEach(p => {
      let color = 'rgba(16, 185, 129, 0.2)'; // GREEN
      if (p.alert_level === 'AMBER') color = 'rgba(245, 158, 11, 0.4)';
      if (p.alert_level === 'RED') color = 'rgba(239, 68, 68, 0.5)';
      matchExpr.push(p.zone_id, color);
    });
    matchExpr.push('rgba(100, 116, 139, 0.1)'); // default fallback

    return {
      'fill-color': matchExpr,
      'fill-opacity': 0.8,
    };
  }, [predictions]);

  return (
    <div className="w-full h-full relative bg-gray-950">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 76.3,
          latitude: 9.993,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        interactiveLayerIds={['zones-fill']}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            const zoneId = e.features[0].properties?.id;
            if (zoneId) {
              onZoneClick(zoneId);
            }
          } else {
            onZoneClick('');
          }
        }}
      >
        {zonesGeoJson && (
          <Source id="zones" type="geojson" data={zonesGeoJson}>
            <Layer 
              id="zones-fill" 
              type="fill" 
              paint={paintConfig}
            />
            <Layer
              id="zones-line"
              type="line"
              paint={{
                'line-color': ['case', 
                  ['==', ['get', 'id'], selectedZoneId || ''], '#3b82f6',
                  'rgba(255, 255, 255, 0.2)'
                ],
                'line-width': ['case', ['==', ['get', 'id'], selectedZoneId || ''], 3, 1]
              }}
            />
          </Source>
        )}

        {infrastructureNodes.map((n) => {
          const colors = {
            substation: '#ef4444',
            water_pump: '#3b82f6',
            hospital: '#10b981',
            road: '#f59e0b',
            comm_tower: '#8b5cf6',
          };
          const color = colors[n.type as keyof typeof colors] || '#64748b';
          return (
            <Marker key={n.id} longitude={n.lon} latitude={n.lat} anchor="center">
              <div 
                className="w-3 h-3 rounded-full border border-gray-950 shadow-md cursor-pointer transition-transform hover:scale-150"
                style={{ backgroundColor: color }}
                title={`${n.name} (${n.type})`}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
