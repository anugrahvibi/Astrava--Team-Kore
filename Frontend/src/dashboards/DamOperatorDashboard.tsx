import React, { useState, useEffect, useRef } from 'react';
import { Activity, Droplets, Target, CheckCircle2, Waves, Settings, AlertTriangle, Zap, Wind, Shield, ArrowRight, MapPin } from 'lucide-react';
import { fetchActiveAlerts, fetchSensorReadings, fetchPredictions } from '../utils/dataFetcher';
import type { Alert, SensorReading, Prediction } from '../utils/dataFetcher';
import { useGsapAnimations } from '../utils/useGsapAnimations';

export function DamOperatorDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sensor, setSensor] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useGsapAnimations(containerRef);

  useEffect(() => {
    async function init() {
      const sData = await fetchSensorReadings('zone_a_godavari_upper');
      const aData = await fetchActiveAlerts('dam_controller');
      const pData = await fetchPredictions();
      
      if (sData.length > 0) setSensor(sData[0]);
      setAlerts(aData);
      setPrediction(pData.find(p => p.zone_id === 'zone_a_godavari_upper') || null);
    }
    init();
    const interval = setInterval(init, 30000);
    return () => clearInterval(interval);
  }, []);

  const reservoirPercentage = sensor?.reservoir_pct || 88.5;
  const systemStatus = prediction?.alert_level === 'RED' ? 'CRITICAL' : prediction?.alert_level === 'AMBER' ? 'WARNING' : 'NORMAL';

  return (
    <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 p-4 sm:p-6 lg:p-8 h-full bg-transparent overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-10 py-4 sm:py-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 border-b border-black/5 pb-8 sm:pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Waves size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 brand-font tracking-tight uppercase leading-none">
                Hydraulic <span className="text-blue-600">Controller</span>
              </h1>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] pl-1 flex items-center gap-2">
               <Activity size={14} className="text-blue-600 animate-pulse" /> Precision Flow & Infrastructure Stability
            </p>
          </div>
          
           <div className="flex items-center gap-3 self-stretch sm:self-auto">
             <div className="glass-card px-4 sm:px-6 py-3 sm:py-4 rounded-[1.8rem] flex items-center gap-4 shadow-xl premium-shadow">
                <div className="text-right">
                   <div className="text-[9px] font-black text-gray-400/50 uppercase tracking-widest leading-none mb-1">Hydraulic Status</div>
                   <div className={`text-sm font-black uppercase ${
                     systemStatus === 'CRITICAL' ? 'text-red-600' : 
                     systemStatus === 'WARNING' ? 'text-orange-600' : 'text-emerald-600'
                   }`}>{systemStatus}</div>
                </div>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                   systemStatus === 'CRITICAL' ? 'bg-red-600' : 
                   systemStatus === 'WARNING' ? 'bg-orange-600' : 'bg-emerald-600'
                }`} />
             </div>
             <button className="w-11 h-11 sm:w-12 sm:h-12 glass-card rounded-2xl flex items-center justify-center text-gray-400/60 hover:text-blue-600 border-white/50 bg-white/30 backdrop-blur-md">
                <Settings size={20} />
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Droplets />} label="Reservoir Level" value={`${reservoirPercentage}%`} subtext="Safety Margin: High" glassType="glass-blue" />
          <StatCard icon={<Zap />} label="Inflow Pulse" value={`${sensor?.reservoir_inflow_m3s || 450} m³/s`} subtext="RISING INTENSITY" glassType="glass-blue" />
          <StatCard icon={<Activity />} label="Sensor Grid Accuracy" value="98.2%" subtext="Network Latency: 4ms" glassType="glass-emerald" />
          <StatCard icon={<Wind />} label="Downstream Impact" value={systemStatus} subtext="Lead Window: Active" glassType={systemStatus === 'NORMAL' ? 'glass-emerald' : systemStatus === 'WARNING' ? 'glass-amber' : 'glass-red'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          
          <section className="lg:col-span-1 glass-card rounded-[3rem] border-white/60 p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center bg-white/70 premium-shadow">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Capacity Saturation</h3>
             <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="96" cy="96" r="80" className="stroke-gray-100 fill-none" strokeWidth="12" />
                   <circle 
                      cx="96" cy="96" r="80" 
                      className={`fill-none transition-all duration-1000 ${reservoirPercentage > 85 ? 'stroke-red-600' : 'stroke-blue-600'}`} 
                      strokeWidth="12" 
                      strokeDasharray={`${(reservoirPercentage / 100) * 502} 502`}
                      strokeLinecap="round"
                   />
                </svg>
                <div className="absolute text-center">
                   <div className="text-4xl font-black text-gray-900 brand-font tracking-tight">{reservoirPercentage}%</div>
                   <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Saturated</div>
                </div>
             </div>
             <p className="mt-8 text-center text-gray-500 text-xs font-bold leading-relaxed italic max-w-[180px]">"Slight vertical margin increase detected by LSTM models."</p>
          </section>

          <section className="glass-card rounded-[3rem] border-white/60 overflow-hidden flex flex-col lg:col-span-2 shadow-xl bg-white/70 premium-shadow">
             <div className="p-5 sm:p-8 border-b border-gray-100 bg-blue-50/30 flex items-center justify-between">
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                   <Shield size={16} className="text-blue-600" /> Administrative Gate Protocols
                </h2>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-tighter border border-blue-200">{alerts.length} ORDERS</div>
             </div>
             <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-6 bg-white border border-gray-100 rounded-3xl relative group hover:border-blue-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-200">Priority Grid Alpha</div>
                           <AlertTriangle size={14} className="text-amber-500 opacity-50" />
                        </div>
                         <p className="text-gray-900 font-bold text-sm leading-relaxed">{alert.action_text}</p>
                         <div className="mt-2 text-[8px] font-black text-blue-500/40 uppercase tracking-widest">Target Sector: {alert.zone_id}</div>
                      </div>
                       <button className="w-full sm:w-auto justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap flex items-center gap-3">
                         Execute Gate <ArrowRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-40 gap-4">
                    <CheckCircle2 size={48} strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Flow Equilibrium Synchronized</p>
                  </div>
                )}
             </div>
          </section>

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
    <div className={`glass-card ${glassType} p-6 rounded-[2.5rem] hover:scale-[1.02] transition-all group`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/20`}>
        {React.cloneElement(icon as any, { size: 20, className: 'text-inherit' })}
      </div>
      <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-black text-gray-900 brand-font tracking-tight mb-2">{value}</div>
      <div className="text-[10px] font-bold opacity-30 uppercase tracking-tighter italic">{subtext}</div>
    </div>
  );
}
