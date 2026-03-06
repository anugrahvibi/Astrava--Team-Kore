import React, { useState } from 'react';
import { ShieldAlert, Navigation, PhoneCall, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { Prediction, Alert } from '../utils/dataFetcher';

export function PublicPortal() {
  const [pin, setPin] = useState('');
  const [searched, setSearched] = useState(false);
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [matchingZone, setMatchingZone] = useState<Prediction | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 3) return;
    
    const predictions = await fetchPredictions();
    const alerts = await fetchActiveAlerts('public_advisory');
    
    const criticalZone = predictions.find(p => p.alert_level !== 'GREEN');
    
    setMatchingZone(criticalZone || null);
    setIsHighRisk(!!criticalZone);
    setActiveAlerts(alerts);
    setSearched(true);
  };

  return (
    <div className="h-full bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto w-full">
      <div className="w-full max-w-lg mx-auto space-y-6">
        
        <div className="text-center space-y-2 mb-10">
          <ShieldAlert size={48} className="mx-auto text-blue-700 mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">CascadeNet Direct</h1>
          <p className="text-gray-500 text-sm">Official Public Warning System</p>
        </div>

        {!searched ? (
          <form onSubmit={handleSearch} className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl shadow-xl w-full">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Check Your Location Status</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter ZIP / PIN / Area Code"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition-colors"
              >
                CHECK
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isHighRisk ? (
              <>
                <div className="bg-red-600 border border-red-500 text-white p-8 rounded-2xl text-center shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                  <AlertCircle size={48} className="mx-auto mb-4" />
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2">RISK DETECTED in {matchingZone?.zone_name}</h2>
                  <p className="text-red-100 font-medium">POTENTIAL FLOODING DETECTED ({(matchingZone?.flood_probability || 0 * 100).toFixed(0)}%)</p>
                </div>
                
                <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 space-y-4">
                   <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2">Operational Alerts</h3>
                   <div className="space-y-3">
                      {activeAlerts.length > 0 ? (
                        activeAlerts.map((a) => (
                          <div key={a.id} className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-900 font-medium font-sans font-semibold">
                             • {a.action_text}
                          </div>
                        ))
                      ) : (
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                           <li>Prepare emergency kit with 72-hour supplies.</li>
                           <li>Monitor official news for evacuation orders.</li>
                           <li>Avoid travel to low-lying areas in {matchingZone?.zone_name}.</li>
                        </ul>
                      )}
                   </div>
                </div>
              </>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
                <CheckCircle size={48} className="mx-auto text-emerald-600 mb-4" />
                <h2 className="text-2xl font-bold uppercase text-emerald-700 mb-2">NO IMMEDIATE THREAT DETECTED</h2>
                <p className="text-gray-600 text-sm">Your area ({pin}) is currently in a safe zone. Stay tuned for official updates.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSearched(false)}
                className="bg-white shadow-sm border border-gray-200 hover:bg-gray-100 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                CHECK ANOTHER
              </button>
              <button className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 text-blue-600 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2">
                <PhoneCall size={14} /> EMERGENCY 112
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

