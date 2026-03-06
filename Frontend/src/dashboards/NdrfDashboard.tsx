import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { ZonePanel } from '../components/ZonePanel';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { Prediction, InfrastructureNode, Alert } from '../utils/dataFetcher';
import { AlertTriangle, MapPin, ShieldAlert, Navigation, Activity, CheckCircle2 } from 'lucide-react';

export function NdrfDashboard() {
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const zData = await fetchZones();
      const iData = await fetchInfrastructure();
      let pData = await fetchPredictions();
      const aData = await fetchActiveAlerts('ndrf_rescue');
      
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
    }
    init();
    const interval = setInterval(init, 30000);
    return () => clearInterval(interval);
  }, []);

  const sortedRisks = [...predictions]
    .filter(p => p.alert_level !== 'GREEN')
    .sort((a, b) => {
      if (a.alert_level === 'RED' && b.alert_level !== 'RED') return -1;
      if (a.alert_level !== 'RED' && b.alert_level === 'RED') return 1;
      return a.lead_time_hours - b.lead_time_hours;
    });

  return (
    <div className="flex h-full w-full bg-gray-50 uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="w-80 h-full border-r border-gray-200 bg-white shadow-sm flex flex-col z-10 shadow-lg shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50/50">
          <h2 className="font-black text-blue-900 tracking-tight text-sm flex items-center gap-2">
            <ShieldIcon /> NDRF RESCUE COMMAND
          </h2>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12} /> Live Risk Feed
            </h3>
            <div className="space-y-3">
              {sortedRisks.length > 0 ? (
                sortedRisks.map(zone => (
                  <div 
                    key={zone.zone_id}
                    onClick={() => setSelectedZone(zone.zone_id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedZone === zone.zone_id 
                        ? (zone.alert_level === 'RED' ? 'border-red-600 bg-red-50' : 'border-amber-500 bg-amber-50')
                        : 'border-gray-100 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-xs text-gray-900">{zone.zone_name}</div>
                      <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        zone.alert_level === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-400 text-gray-900'
                      }`}>
                        T-{zone.lead_time_hours}H
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                      <MapPin size={10} /> {(zone.flood_probability * 100).toFixed(0)}% PROBABILITY
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-50" />
                  <p className="text-[10px] font-bold text-gray-400">NO ACTIVE RISKS DETECTED</p>
                </div>
              )}
            </div>
          </section>

          {alerts.length > 0 && (
            <section className="pt-4 border-t border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={12} className="text-blue-700" /> Operational Directives
              </h3>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-blue-900 text-white rounded-xl shadow-md border border-blue-800">
                    <div className="text-[9px] font-black text-blue-300 uppercase mb-1 tracking-tighter">HQ IMMEDIATE ORDER</div>
                    <div className="text-xs font-bold leading-tight">{alert.action_text}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Navigation size={20} />
              </div>
              <div>
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Status</div>
                 <div className="text-xs font-black text-blue-900">READY FOR DEPLOYMENT</div>
              </div>
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
            infrastructure={infra.filter(i => true)} 
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
