import React, { useState, useEffect, useRef } from 'react';
import { Activity, MapPin, AlertTriangle, Hammer, CheckCircle2, Truck, ArrowRightLeft, ShieldCheck, TrendingDown, Radio, Navigation, Clock, Route, ArrowRight, Shield } from 'lucide-react';
import { fetchActiveAlerts, fetchPredictions } from '../utils/dataFetcher';
import type { Alert, Prediction } from '../utils/dataFetcher';
import { useGsapAnimations } from '../utils/useGsapAnimations';

export function HighwayDepartmentDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapAnimations(containerRef);

  useEffect(() => {
    async function init() {
      const aData = await fetchActiveAlerts('highway_department');
      const pData = await fetchPredictions();
      setAlerts(aData);
      setPredictions(pData);
    }
    init();
    const interval = setInterval(init, 30000);
    return () => clearInterval(interval);
  }, []);

  const criticalRoads = alerts.length;
  const avgLeadTime = predictions.length > 0 
    ? (predictions.reduce((acc, p) => acc + p.lead_time_hours, 0) / predictions.length).toFixed(1)
    : '8.0';

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-4 sm:p-6 lg:p-8 h-full bg-transparent overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-10 py-4 sm:py-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Truck size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 brand-font tracking-tight uppercase leading-none">
                Logistics <span className="text-blue-600">Command</span> <Route size={28} className="text-blue-600 inline-block ml-2" />
              </h1>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] pl-1 flex items-center gap-2">
               <Activity size={14} className="text-blue-600 animate-pulse" /> Grid Network & Transit Stability Hub
            </p>
          </div>
          
           <div className="flex items-center gap-3 self-stretch sm:self-auto">
             <div className="glass-card px-4 sm:px-6 py-3 sm:py-4 rounded-[1.8rem] border-white/60 bg-white/50 flex items-center gap-4 shadow-xl premium-shadow">
                <div className="text-right">
                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Network Status</div>
                   <div className="text-sm font-black text-emerald-600 uppercase tracking-widest">Connected</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Hammer />} label="Active Closures" value={criticalRoads.toString()} subtext="System Logged" glassType="glass-blue" />
          <StatCard icon={<TrendingDown />} label="Avg. Response" value={`${avgLeadTime}h`} subtext="Lead Projection" glassType="glass-blue" />
          <StatCard icon={<Shield />} label="Assets Ready" value="ALPHA_08" subtext="Standby Protocols" glassType="glass-blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <section className="lg:col-span-2 glass-blue rounded-[3rem] border-white/50 bg-white/50 overflow-hidden flex flex-col h-[500px] sm:h-[600px] shadow-xl premium-shadow">
             <div className="p-5 sm:p-8 border-b border-gray-100 bg-blue-50/30 flex items-center justify-between">
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                   <Navigation size={16} className="text-blue-600" /> Operational Deployment Field
                </h2>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-tighter border border-blue-200">{alerts.length} ORDERS</div>
             </div>
             <div className="overflow-y-auto flex-1 p-5 sm:p-8 space-y-6 custom-scrollbar">
                {alerts.length > 0 ? (
                   alerts.map((alert) => (
                     <div key={alert.id} className="p-5 sm:p-6 glass-blue rounded-3xl relative group transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
                       <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-200">
                               {alert.zone_id.replace('ZONE_', '')}
                            </div>
                            <AlertTriangle size={14} className="text-amber-500 opacity-50" />
                         </div>
                         <p className="text-gray-900 font-bold text-sm leading-relaxed mb-1">{alert.action_text}</p>
                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Source: AI-ML Structural Router</div>
                       </div>
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm self-end sm:self-auto">
                          <MapPin size={24} />
                       </div>
                     </div>
                   ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-40 gap-6">
                    <CheckCircle2 size={64} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Operations Synchronized</p>
                  </div>
                )}
             </div>
          </section>

          <div className="space-y-6 flex flex-col">
            <div className="glass-blue p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-4">
               <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Global Critical Window</span>
               </div>
               <div className="text-3xl sm:text-4xl font-black brand-font text-gray-900">{avgLeadTime}H</div>
               <p className="text-blue-700/60 text-[11px] font-medium leading-relaxed italic">"Model suggests logistics deployment before T-minus 4h for optimal resource retention."</p>
            </div>
            
            <section className="glass-card rounded-[3rem] border-white/60 bg-white/70 overflow-hidden flex flex-col flex-1 shadow-xl premium-shadow">
               <div className="p-5 sm:p-8 border-b border-gray-100 bg-white/50">
                  <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                     <ArrowRightLeft size={16} className="text-blue-600" /> Rapid Directives
                  </h2>
               </div>
               <div className="p-5 sm:p-8 space-y-4">
                  {[
                    'Deploy portable pumps',
                    'Sandbag critical underpasses',
                    'Coordinate arterial diversions',
                    'Strategic asset retrieval'
                  ].map((task, i) => (
                       <div key={i} className="flex items-center gap-3 sm:gap-4 p-4 glass-blue rounded-3xl text-[10px] sm:text-[11px] font-bold text-gray-700 group transition-all cursor-default shadow-sm-blue">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                         <span className="uppercase tracking-wide leading-tight">{task}</span>
                     </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  glassType: string;
}

function StatCard({ icon, label, value, subtext, glassType }: StatCardProps) {
  return (
    <div className={`glass-card ${glassType} p-6 rounded-[2.5rem] transition-all group`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/20`}>
        {React.cloneElement(icon as any, { size: 20, className: 'text-inherit' })}
      </div>
      <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-black text-gray-900 brand-font tracking-tight mb-2">{value}</div>
      <div className="text-[10px] font-bold opacity-40 uppercase tracking-tighter italic">{subtext}</div>
    </div>
  );
}
