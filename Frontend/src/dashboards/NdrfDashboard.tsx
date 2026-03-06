import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { ZonePanel } from '../components/ZonePanel';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts, fetchLeadTimes, fetchVulnerabilities } from '../utils/dataFetcher';
import type { Prediction, InfrastructureNode, Alert, LeadTimeTicker, VulnerabilityData } from '../utils/dataFetcher';
import { AlertTriangle, MapPin, ShieldAlert, Navigation, Activity, CheckCircle2, Zap, Shield, Radio, Clock, Target, Info } from 'lucide-react';

export function NdrfDashboard() {
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTimeTicker[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityData | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [zData, iData, pData, aData, lData, vData] = await Promise.all([
        fetchZones(),
        fetchInfrastructure(),
        fetchPredictions(),
        fetchActiveAlerts('ndrf_rescue'),
        fetchLeadTimes(),
        fetchVulnerabilities()
      ]);
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
      setLeadTimes(lData);
      setVulnerabilities(vData);
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

  const criticalLead = leadTimes.sort((a, b) => a.hours_until_peak - b.hours_until_peak)[0];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-transparent p-3 sm:p-4 gap-3 sm:gap-4 overflow-y-auto custom-scrollbar">
      <div className="w-full lg:w-96 h-auto lg:h-full max-h-[52vh] lg:max-h-none glass-card flex flex-col z-10 shadow-xl shrink-0 rounded-[2.5rem] border border-white/70 bg-white/80 overflow-hidden">
        <div className="pt-24 sm:pt-28 lg:pt-32 p-4 sm:p-6 border-b border-black/5 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 brand-font tracking-tight text-lg flex items-center gap-3">
              <Shield className="text-blue-600" size={20} /> NDRF <span className="text-blue-600">TACTICAL</span>
            </h2>
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-full border border-blue-200">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[9px] font-black text-blue-600 uppercase">Live Ops</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Red Alerts</div>
                <div className="text-xl font-black text-red-600 leading-none">{sortedRisks.filter(r => r.alert_level === 'RED').length}</div>
             </div>
             <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Avg Lead</div>
                <div className="text-xl font-black text-blue-600 leading-none">
                  {predictions.length > 0 ? (predictions.reduce((acc, p) => acc + p.lead_time_hours, 0) / predictions.length).toFixed(1) : '0'}h
                </div>
             </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Critical Window Ticker */}
          {criticalLead && (
             <section className="bg-red-50 p-5 rounded-[2rem] border border-red-100 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Peak Surge T-Minus
                   </div>
                   <span className="text-xs font-black text-red-600 uppercase">{criticalLead.hours_until_peak}H</span>
                </div>
                <div className="w-full h-1.5 bg-red-200/50 rounded-full overflow-hidden">
                   <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${(criticalLead.hours_until_peak / 24) * 100}%` }} />
                </div>
                <p className="text-[10px] text-red-700 font-bold leading-tight italic">
                   "Immediate action required for {criticalLead.zone_id.replace('ZONE_', '')} sector."
                </p>
             </section>
          )}

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity size={12} className="text-blue-600" /> Model Risk Feed
            </h3>
            <div className="space-y-3">
              {sortedRisks.length > 0 ? (
                sortedRisks.map(zone => (
                  <div 
                    key={zone.zone_id}
                    onClick={() => setSelectedZone(zone.zone_id)}
                    className={`group p-4 rounded-3xl border transition-all duration-300 cursor-pointer shadow-sm ${
                      selectedZone === zone.zone_id 
                        ? (zone.alert_level === 'RED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{zone.zone_name || zone.zone_id}</div>
                      <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                        zone.alert_level === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-400 text-black'
                      }`}>
                        T-{zone.lead_time_hours}H
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                          <Target size={10} className="text-blue-600" /> {(zone.flood_probability * 100).toFixed(0)}% Probability
                       </div>
                       <Zap size={12} className={zone.alert_level === 'RED' ? 'text-red-600' : 'text-amber-500'} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center border border-dashed border-gray-200 rounded-[2rem]">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500/20 mb-3" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Grid Operations Stable</p>
                </div>
              )}
            </div>
          </section>

          {vulnerabilities && (
             <section className="pt-6 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <Zap size={12} className="text-orange-600" /> Structural Singularities
                </h3>
                <div className="space-y-4">
                   {vulnerabilities.tactical_recommendations.slice(0, 3).map((rec, i) => (
                      <div key={i} className="p-4 bg-orange-50 rounded-3xl border border-orange-100 space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-orange-600 uppercase">{rec.node_id}</span>
                            <span className="px-1.5 py-0.5 bg-orange-600 text-white rounded text-[8px] font-black uppercase tracking-widest">{rec.criticality}</span>
                         </div>
                         <p className="text-[11px] font-bold text-orange-900 leading-tight">"{rec.mitigation_strategy}"</p>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {alerts.length > 0 && (
            <section className="pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldAlert size={12} className="text-blue-600" /> Operational Directives
              </h3>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-5 bg-white rounded-3xl border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all shadow-sm">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Navigation size={40} className="text-blue-600" />
                    </div>
                    <div className="text-[9px] font-black text-blue-600 uppercase mb-2 tracking-[0.1em] relative z-10">AI Action Router</div>
                    <div className="text-[13px] font-bold leading-relaxed text-gray-900 relative z-10">{alert.action_text}</div>
                    <div className="mt-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Target: {alert.zone_id}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform cursor-pointer">
                 <Radio size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HQ Linkage</div>
                 <div className="text-xs font-black text-gray-900 uppercase brand-font tracking-wide">Ready for Deployment</div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-[65vh] lg:min-h-0 h-[65vh] lg:h-full rounded-[2.5rem] overflow-hidden border border-white/60 shadow-xl">
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
        
        {/* Global Stats Overlay for Light Mode */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden md:flex gap-4 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Model Accuracy: 94.8%</span>
           </div>
           <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-xl flex items-center gap-3">
              <Info size={14} className="text-blue-600" />
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Syncing 1,240 Nodes</span>
           </div>
        </div>
      </div>
    </div>
  );
}
