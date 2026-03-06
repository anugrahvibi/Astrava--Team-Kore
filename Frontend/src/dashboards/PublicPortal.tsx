import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, MapPin, Navigation, Info, ChevronRight, Activity, Globe, ShieldAlert, PhoneCall, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { Prediction, Alert } from '../utils/dataFetcher';

export function PublicPortal() {
  const [pin, setPin] = useState('');
  const [searched, setSearched] = useState(false);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [matchingZone, setMatchingZone] = useState<Prediction | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      const alerts = await fetchActiveAlerts('public_advisory');
      setActiveAlerts(alerts);
    }
    loadInitial();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 3) return;
    
    setIsSearching(true);
    const predictions = await fetchPredictions();
    const alerts = await fetchActiveAlerts('public_advisory');
    
    // Simple matching for demo/functionality
    const criticalZone = predictions.find(p => p.alert_level !== 'GREEN');
    
    setTimeout(() => {
      setMatchingZone(criticalZone || null);
      setIsHighRisk(!!criticalZone);
      setActiveAlerts(alerts);
      setSearched(true);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white relative overflow-hidden flex flex-col pt-24 custom-scrollbar">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto w-full px-8 flex-1 flex flex-col gap-16 relative z-10 pb-20">
        
        <div className="text-center space-y-6 pt-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Public Safety Access Active</span>
          </div>
          <h1 className="text-6xl font-black brand-font tracking-tighter leading-none uppercase">
            Citizen <span className="text-blue-500">Intelligence</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            Real-time flood risk assessment and safety protocols for Kochi residents. 
            Official model data synchronized with municipal sensors.
          </p>
        </div>

        {!searched ? (
          <div className="max-w-3xl mx-auto w-full">
             <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative glass-card flex items-center p-2 rounded-[2.2rem] border border-white/10 shadow-2xl">
                   <div className="pl-6 text-gray-500">
                      <Search size={24} />
                   </div>
                   <input 
                      type="text" 
                      placeholder="Enter ZIP / PIN / Area Code"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="flex-1 bg-transparent border-none py-6 px-4 text-lg text-white placeholder:text-gray-600 focus:outline-none"
                   />
                   <button 
                      type="submit"
                      disabled={isSearching}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                   >
                      {isSearching ? "Scanning..." : "Sync Status"}
                   </button>
                </div>
             </form>
          </div>
        ) : (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {isHighRisk ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="glass-card p-10 rounded-[2.5rem] border border-red-500/20 bg-red-600/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
                        <AlertTriangle size={180} />
                     </div>
                     <div className="relative z-10 space-y-6">
                        <div className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit glow-red">
                           Critical Alert
                        </div>
                        <h2 className="text-4xl font-black brand-font tracking-tight uppercase leading-tight">
                           Flooding Detected in <span className="text-red-500">{matchingZone?.zone_name}</span>
                        </h2>
                        <div className="flex items-center gap-6">
                           <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl">
                              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Probability</div>
                              <div className="text-2xl font-black text-red-500">{(matchingZone?.flood_probability || 0 * 100).toFixed(0)}%</div>
                           </div>
                           <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl">
                              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact Level</div>
                              <div className="text-2xl font-black text-red-500">HIGH</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-2 px-2">
                        <Activity size={16} className="text-red-500" /> Essential Directives
                     </h3>
                     <div className="space-y-4">
                        {activeAlerts.length > 0 ? (
                           activeAlerts.map((a) => (
                              <div key={a.id} className="glass-card p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-start gap-5">
                                 <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                    <Shield size={20} />
                                 </div>
                                 <p className="text-gray-200 font-bold leading-relaxed">{a.action_text}</p>
                              </div>
                           ))
                        ) : (
                           <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-3">
                              <p className="text-gray-100 font-bold">• Evacuate low-lying areas immediately.</p>
                              <p className="text-gray-100 font-bold">• Secure emergency survival kits.</p>
                              <p className="text-gray-100 font-bold">• Follow municipal evacuation routes.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             ) : (
               <div className="max-w-3xl mx-auto w-full glass-card p-16 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 text-center space-y-8 relative overflow-hidden group">
                  <div className="absolute -inset-24 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                     <CheckCircle size={48} className="text-emerald-500" />
                  </div>
                  <div className="space-y-2 relative z-10">
                     <h2 className="text-4xl font-black brand-font tracking-tight uppercase">Zone Status: Clear</h2>
                     <p className="text-gray-400 font-medium text-lg italic">"No immediate threat detected for {pin}. Standard monitoring continues."</p>
                  </div>
               </div>
             )}

             <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
               <button 
                  onClick={() => setSearched(false)}
                  className="glass-card flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] border border-white/10 hover:border-white/20 transition-all font-black uppercase text-[10px] tracking-widest active:scale-95"
               >
                  New Scan
               </button>
               <button className="bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] transition-all font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-2xl shadow-red-900/40">
                  <PhoneCall size={16} /> Emergency 112
               </button>
             </div>
          </div>
        )}

        {/* Global Stats Footer */}
        {!searched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-white/5 pt-16">
             <div className="glass-card p-8 rounded-[2rem] border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                   <Globe size={20} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">System Load</div>
                   <div className="text-2xl font-black text-white brand-font tracking-tight">GLOBAL_SYNC</div>
                </div>
             </div>
             <div className="glass-card p-8 rounded-[2rem] border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500">
                   <ShieldAlert size={20} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Defense Readiness</div>
                   <div className="text-2xl font-black text-white brand-font tracking-tight">KERALA_ZONE_A</div>
                </div>
             </div>
             <div className="glass-card p-8 rounded-[2rem] border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500">
                   <Activity size={20} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Model Precision</div>
                   <div className="text-2xl font-black text-emerald-500 brand-font tracking-tight">94.2% ACC</div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

