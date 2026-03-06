import React, { useEffect, useState, useRef } from 'react';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts, fetchROIRankings } from '../utils/dataFetcher';
import type { Prediction, InfrastructureNode, Alert, ROIRanking } from '../utils/dataFetcher';
import { Users, FileText, CheckCircle2, AlertCircle, Shield, ArrowUpRight, BarChart3, Activity, Zap, TrendingUp, Info, Clock } from 'lucide-react';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useRef } from 'react';

export function DistrictAdminDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [roiRankings, setRoiRankings] = useState<ROIRanking[]>([]);

  useGsapAnimations(containerRef);

  useEffect(() => {
    async function init() {
      const [zData, pData, aData, rData] = await Promise.all([
        fetchZones(),
        fetchPredictions(),
        fetchActiveAlerts('district_collector'),
        fetchROIRankings()
      ]);
      
      setZones(Array.isArray(zData) ? zData : []);
      setPredictions(pData);
      setAlerts(aData);
      setRoiRankings(rData);
    }
    init();
    const interval = setInterval(init, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalExposed = predictions.reduce((acc, p) => {
    if (['RED', 'AMBER'].includes(p.alert_level)) {
      const zone = zones.find(z => z.id === p.zone_id);
      return acc + (zone?.population || 0);
    }
    return acc;
  }, 0);

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-4 sm:p-6 lg:p-8 h-full bg-transparent overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-10 py-4 sm:py-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 brand-font tracking-tight uppercase leading-none">
                District <span className="text-blue-600">Collectorate</span>
              </h1>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] pl-1 flex items-center gap-2">
               <Activity size={14} className="text-blue-600 animate-pulse" /> Executive Intelligence Command
            </p>
          </div>
          
          <div className="glass-blue p-4 sm:p-6 rounded-[2.2rem] flex items-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform w-full md:w-auto">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users size={80} />
            </div>
            <div>
               <h3 className="text-gray-400 font-black uppercase tracking-widest text-[9px] mb-2">Population Exposure Index</h3>
               <div className="text-3xl sm:text-4xl font-black text-red-600 flex items-center gap-3 brand-font break-all">
                 {Math.round(totalExposed).toLocaleString()} <Users size={24} className="text-red-500 opacity-20" />
               </div>
            </div>
            <ArrowUpRight className="text-gray-300" size={24} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          <section className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col h-[500px] sm:h-[600px] shadow-xl premium-shadow">
            <div className="p-5 sm:p-8 border-b border-gray-100 bg-blue-50/30 flex items-center justify-between">
              <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                 <BarChart3 size={16} className="text-blue-600" /> Administrative Risk Distribution
              </h2>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-100 px-3 py-1 rounded-full border border-blue-200">{predictions.length} SECTORS</span>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full min-w-[540px] text-left border-collapse">
                <thead className="text-gray-400 uppercase font-black text-[9px] tracking-[0.2em] sticky top-0 z-10 border-b border-gray-100 glass-blue backdrop-blur-md">
                  <tr>
                    <th className="p-6">Sector Identity</th>
                    <th className="p-6">Risk Assessment</th>
                    <th className="p-6 text-right">Lead (H)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {predictions.map(p => (
                    <tr key={p.zone_id} className="hover:bg-blue-50/10 transition-colors group cursor-default">
                      <td className="p-6">
                         <div className="font-black text-sm text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{p.zone_name || p.zone_id}</div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">System ID: {p.zone_id}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 uppercase text-[9px] font-black rounded-full shadow-sm border ${
                          p.alert_level === 'RED' ? 'glass-red text-red-600 border-red-200' :
                          p.alert_level === 'AMBER' ? 'glass-amber text-amber-600 border-amber-200' :
                          'glass-emerald text-emerald-600 border-emerald-200'
                        }`}>
                          {p.alert_level}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-sm text-gray-900 tracking-tighter">{p.lead_time_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

           <section className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col h-[500px] sm:h-[600px] shadow-xl premium-shadow">
             <div className="p-5 sm:p-8 border-b border-gray-100 bg-orange-50/30 flex items-center justify-between">
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                   <Zap size={16} className="text-orange-600" /> Operational Directive Queue
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                   <span className="text-[10px] font-black text-orange-600 uppercase">{alerts.length} Directives</span>
                </div>
             </div>
             <div className="overflow-y-auto flex-1 p-5 sm:p-8 space-y-6 custom-scrollbar">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                      <div key={alert.id} className="p-5 sm:p-6 glass-blue rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 transition-all hover:border-blue-400/50 hover:shadow-lg group">
                       <div className="flex-1">
                          <div className={`text-[10px] uppercase font-black tracking-[0.15em] mb-2 ${
                            alert.alert_level === 'RED' ? 'text-red-600' : 
                            alert.alert_level === 'AMBER' ? 'text-amber-600' : 'text-blue-600'
                          }`}>
                            Target Sector: {alert.zone_id.replace('ZONE_', '').toUpperCase()}
                          </div>
                          <div className="text-gray-900 font-bold text-[13px] leading-relaxed max-w-sm">
                            {alert.action_text}
                          </div>
                          <div className="mt-4 text-[10px] font-black text-blue-500/60 uppercase tracking-widest flex items-center gap-2">
                             <Clock size={12} className="opacity-60" /> Window: {alert.deadline_hrs}H
                          </div>
                       </div>
                        <div className="sm:ml-6 flex items-center gap-4 self-end sm:self-auto">
                           <button className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-transform flex items-center justify-center">
                              <ArrowUpRight size={18} />
                           </button>
                       </div>
                    </div>
                  ))
                 ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-30">
                    <CheckCircle2 size={48} strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Readiness Secured</p>
                  </div>
                 )}
             </div>
          </section>

        </div>

        {/* ROI Strategy Section */}
        <section className="glass-card p-6 sm:p-10 rounded-[3rem] border-white/60 bg-white/70 shadow-xl premium-shadow space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                 <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <TrendingUp size={20} className="text-blue-600" /> Tactical Budget Optimization (ROI)
                 </h2>
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">Algorithmic allocation for maximum life-saving potential</p>
              </div>
              <div className="px-6 py-3 bg-blue-600 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30">
                 Optimizer Active
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {roiRankings.slice(0, 4).map((rank, i) => (
                  <div key={rank.node_id} className="glass-blue p-6 rounded-[2rem] space-y-4 hover:border-blue-400/50 transition-colors group">
                     <div className="flex justify-between items-start">
                        <div className="w-10 h-10 glass-blue rounded-xl flex items-center justify-center text-blue-600 transition-all">
                           <Shield size={20} />
                        </div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase">Rank #{i+1}</div>
                     </div>
                    <div>
                       <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{rank.node_id.replace(/_/g, ' ')}</div>
                       <div className="text-lg font-black text-gray-900 brand-font uppercase truncate">{rank.node_id.split('_').slice(1).join(' ')}</div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                       <div className="space-y-1">
                          <div className="text-[8px] font-black text-gray-400 uppercase">ROI (Lives/₹L)</div>
                          <div className="text-lg font-black text-gray-900">{(rank.lives_saved_per_rupee * 100000).toFixed(2)}</div>
                       </div>
                       <div className="text-right space-y-1">
                          <div className="text-[8px] font-black text-gray-400 uppercase">Lives Saved</div>
                          <div className="text-lg font-black text-emerald-600">+{rank.lives_saved}</div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}
