import React, { useState } from 'react';
import { ShieldAlert, Navigation, PhoneCall, AlertCircle } from 'lucide-react';

export function PublicPortal() {
  const [pin, setPin] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length > 3) setSearched(true);
  };

  const isHighRisk = pin.startsWith('682'); // simple mock logic for dummy pins

  return (
    <div className="h-full bg-black text-gray-100 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto w-full">
      <div className="w-full max-w-lg mx-auto space-y-6">
        
        <div className="text-center space-y-2 mb-10">
          <ShieldAlert size={48} className="mx-auto text-blue-500 mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">CascadeNet Direct</h1>
          <p className="text-gray-500 text-sm">Official Public Warning System</p>
        </div>

        {!searched ? (
          <form onSubmit={handleSearch} className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-xl w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Check Your Location Status</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter ZIP / PIN / Area Code"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-800 rounded px-4 py-3 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wider transition-colors"
              >
                CHECK
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isHighRisk ? (
              <>
                <div className="bg-red-600 border border-red-500 text-white p-8 rounded-lg text-center shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                  <AlertCircle size={48} className="mx-auto mb-4" />
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2">YOUR AREA IS AT HIGH RISK</h2>
                  <p className="text-red-100 font-medium">IMMEDIATE EVACUATION REQUIRED</p>
                </div>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-gray-800 pb-2">Evacuation Instructions</h3>
                   <ul className="list-disc pl-5 space-y-2 text-sm text-gray-200">
                     <li>Proceed to the nearest elevated shelter immediately.</li>
                     <li>Do not attempt to drive through flooded roads (NH-66 is closed).</li>
                     <li>Follow precise routing instructions from local authorities.</li>
                   </ul>
                   <div className="bg-gray-950 p-4 rounded border border-gray-800 mt-4 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Nearest Safe Route & Shelter</div>
                        <div className="font-bold text-emerald-500 text-lg mt-1">Kalamassery Relief Camp (3km)</div>
                      </div>
                      <Navigation className="text-emerald-500" size={24} />
                   </div>
                </div>
              </>
            ) : (
              <div className="bg-emerald-900/30 border border-emerald-500/50 p-8 rounded-lg text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h2 className="text-2xl font-bold uppercase text-emerald-500 mb-2">NO IMMEDIATE THREAT DETECTED</h2>
                <p className="text-gray-400 text-sm">Your area ({pin}) is currently in a safe zone. Stay tuned for official updates.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSearched(false)}
                className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white px-4 py-3 rounded font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                CHECK ANOTHER
              </button>
              <button className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 text-blue-400 px-4 py-3 rounded font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2">
                <PhoneCall size={14} /> EMERGENCY 112
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
  );
}
