import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { ZonePanel } from '../components/ZonePanel';
import { fetchZones, fetchInfrastructure, generateMockPredictions } from '../utils/dataFetcher';
import type { Prediction, InfrastructureNode } from '../utils/dataFetcher';
import { AlertTriangle, MapPin } from 'lucide-react';

export function NdrfDashboard() {
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const zData = await fetchZones();
      const iData = await fetchInfrastructure();
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(generateMockPredictions(zData.features || []));
    }
    init();
  }, []);

  const highRiskZones = predictions
    .filter(p => p.alert_level === 'RED')
    .sort((a, b) => a.lead_time_hours - b.lead_time_hours);

  return (
    <div className="flex h-full w-full bg-gray-50">
      <div className="w-80 h-full border-r border-gray-200 bg-white shadow-sm flex flex-col z-10 shadow-lg shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 uppercase tracking-wide text-sm flex items-center gap-2">
            <ShieldIcon /> NDRF Command
          </h2>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-700" /> Critical Red Zones
          </h3>
          <div className="space-y-3">
            {highRiskZones.map(zone => (
              <div 
                key={zone.zone_id}
                onClick={() => setSelectedZone(zone.zone_id)}
                className={`p-3 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedZone === zone.zone_id ? 'border-red-500 bg-gray-100' : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-sm text-gray-900">{zone.zone_name}</div>
                  <div className="text-xs font-sans font-semibold text-gray-700 font-bold text-red-700">
                    T-{zone.lead_time_hours}H
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin size={12} /> {(zone.flood_probability * 100).toFixed(0)}% Probability
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative h-full">
        <MapView 
          zonesGeoJson={zones}
          infrastructureNodes={infra}
          predictions={predictions}
          onZoneClick={setSelectedZone}
          selectedZoneId={selectedZone}
        />
        {selectedZone && (
          <ZonePanel
            zoneId={selectedZone}
            prediction={predictions.find(p => p.zone_id === selectedZone) || null}
            infrastructure={infra.filter(i => true)} // In reality, filter by geo proximity
            onClose={() => setSelectedZone(null)}
          />
        )}
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
