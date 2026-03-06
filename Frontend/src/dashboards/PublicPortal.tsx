import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, Shield, CheckCircle2, Navigation, Activity, ChevronRight, Info, InfoIcon } from 'lucide-react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { Prediction, Alert } from '../utils/dataFetcher';

export function PublicPortal() {
  const [pin, setPin] = useState('');
  const [searchResult, setSearchResult] = useState<Prediction | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [globalRisks, setGlobalRisks] = useState<Prediction[]>([]);
  const [advisories, setAdvisories] = useState<Alert[]>([]);

  useEffect(() => {
    async function loadPublicData() {
      const [preds, alerts] = await Promise.all([
        fetchPredictions(),
        fetchActiveAlerts('Public')
      ]);
      setGlobalRisks(preds);
      setAdvisories(alerts);
    }
    loadPublicData();
  }, []);

  const handleSearch = () => {
    if (!pin) return;
    setIsSearching(true);
    setTimeout(() => {
      const found = globalRisks.find(p => p.zone_id.toLowerCase().includes(pin.toLowerCase()));
      setSearchResult(found || null);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="pt-32 h-full w-full bg-transparent overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-16">
        
        {/* Cinematic Header */}
        <div className="text-center space-y-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full -z-10" />
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600">
             <Shield size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Defense Network</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 brand-font tracking-tight leading-[0.9]">
             Kochi Flood <span className="text-blue-600 ending-serif">Intelligence</span>
          </h1>
          <p className="max-w-xl mx-auto text-gray-500 font-bold text-lg leading-relaxed">
             Access real-time predictive data for your sector. Powered by high-resolution LSTM models.
          </p>
        </div>

        {/* Intelligence Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-2 rounded-[2.5rem] flex items-center shadow-2xl border-white/60 bg-white/70 shadow-blue-600/5 premium-shadow">
            <input 
              type="text" 
              placeholder="Enter your Ward / Sector ID (e.g. ZONE_A)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="flex-1 bg-transparent px-8 h-16 outline-none text-lg font-bold text-gray-800 placeholder:text-gray-400 brand-font"
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-16 rounded-[2rem] font-black text-sm uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
            >
              {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={22} />}
              Search Sector
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Search Result Window */}
          <div className="space-y-6">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 pl-2">
                <MapPin size={16} className="text-blue-600" /> Sector Analysis
             </h2>
             
             {searchResult ? (
                <div className="glass-card p-10 rounded-[3rem] border-white/60 bg-white shadow-xl premium-shadow space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-3xl font-black text-gray-900 brand-font uppercase leading-none">{searchResult.zone_name || searchResult.zone_id}</h3>
                         <div className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Prediction Coordinates Verified</div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                        searchResult.alert_level === 'RED' ? 'bg-red-50 text-red-600 border-red-200' :
                        searchResult.alert_level === 'AMBER' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {searchResult.alert_level}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-[#f8fafc] p-6 rounded-3xl border border-gray-100 shadow-sm">
                         <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flood Prob.</div>
                         <div className="text-4xl font-black text-gray-900 brand-font">{(searchResult.flood_probability * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-[#f8fafc] p-6 rounded-3xl border border-gray-100 shadow-sm">
                         <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lead Time</div>
                         <div className="text-4xl font-black text-blue-600 brand-font">{searchResult.lead_time_hours}H</div>
                      </div>
                   </div>

                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-3">
                      <div className="flex items-center gap-3 text-blue-600">
                         <Info size={18} />
                         <span className="text-xs font-black uppercase tracking-widest">Model Safety Bulletin</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed italic">
                        {searchResult.alert_level === 'RED' 
                          ? "Severe risk detected. Evacuation of ground-level structures is prioritized via government channels." 
                          : "Monitoring phase active. No immediate evacuation is recommended for this sector."}
                      </p>
                   </div>
                </div>
             ) : !isSearching && pin ? (
                <div className="glass-card p-20 rounded-[3rem] border-white/60 bg-white text-center space-y-4 opacity-50 shadow-sm">
                   <AlertTriangle className="mx-auto text-gray-300" size={48} />
                   <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Sector ID Not Recognized</div>
                </div>
             ) : (
                <div className="glass-card p-20 rounded-[3rem] border-white/60 bg-white text-center space-y-4 shadow-sm opacity-60">
                   <Activity className="mx-auto text-blue-100" size={48} />
                   <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Awaiting Parameter Input</div>
                </div>
             )}
          </div>

          {/* Active Risks & Advisories Feed */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                   <Navigation size={16} className="text-blue-600" /> Active Advisories
                </h2>
                <div className="px-3 py-1 bg-amber-100 rounded-full text-[9px] font-black text-amber-600 uppercase border border-amber-200">Broadcast On</div>
             </div>

             <div className="space-y-4">
                {advisories.length > 0 ? (
                  advisories.map((alert) => (
                    <div key={alert.id} className="glass-card p-6 rounded-[2.2rem] border-white/60 bg-white/70 shadow-xl premium-shadow flex items-start gap-6 group hover:translate-x-1 transition-transform">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Activity size={24} />
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{alert.zone_id} BROADCAST</span>
                             <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">T-{alert.deadline_hrs}H</div>
                          </div>
                          <p className="text-gray-900 font-bold text-sm leading-relaxed">{alert.action_text}</p>
                       </div>
                       <ChevronRight size={18} className="text-gray-300 mt-2" />
                    </div>
                  ))
                ) : (
                  <div className="glass-card p-12 rounded-[2.2rem] border-white/60 bg-white/70 text-center space-y-4 shadow-sm opacity-40">
                     <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
                     <div className="text-xs font-black text-gray-500 uppercase tracking-widest">All Public Systems Normalized</div>
                  </div>
                )}
             </div>
          </div>

        </div>

        {/* Global Stats Footer */}
        <div className="pt-20 border-t border-black/5 grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Ver.</div>
              <div className="text-xl font-black text-gray-900">LSTM_CASCADE_V3</div>
           </div>
           <div className="space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Sync</div>
              <div className="text-xl font-black text-emerald-600 px-3 bg-emerald-50 rounded-lg inline-block">SECURE</div>
           </div>
           <div className="space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zones Online</div>
              <div className="text-xl font-black text-gray-900">{globalRisks.length} Municipal</div>
           </div>
           <div className="space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Update</div>
              <div className="text-xl font-black text-gray-900">Just Now</div>
           </div>
        </div>

      </div>
    </div>
  );
}
