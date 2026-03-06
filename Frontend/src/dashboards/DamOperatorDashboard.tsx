import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadTimeCounter } from '../components/LeadTimeCounter';
import { Activity, Droplets, Target } from 'lucide-react';

const mockData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  inflow: 1500 + Math.random() * 800 * (i < 12 ? i / 12 : (24 - i) / 12),
  outflow: 1200 + (i > 8 ? 600 : 0)
}));

export function DamOperatorDashboard() {
  const reservoirPercentage = 88.5;

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-3">
            <Droplets className="text-blue-700" />
            Idukki Dam Operations
          </h1>
          <div className="flex gap-4">
            <div className="bg-white shadow-sm border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 font-sans font-semibold text-gray-700 flex items-center gap-2">
              <Activity size={16} /> SYSTEM NORMAL
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 border border-gray-200 bg-white shadow-sm p-6 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-4">Reservoir Level</h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" className="stroke-gray-800 fill-none min-w-full" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r="70" 
                  className={`fill-none transition-all duration-1000 ${reservoirPercentage > 85 ? 'stroke-amber-500' : 'stroke-blue-500'}`} 
                  strokeWidth="12" 
                  strokeDasharray={`${(reservoirPercentage / 100) * 440} 440`}
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-black font-sans font-semibold text-gray-700">{reservoirPercentage}%</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Capacity</div>
              </div>
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-6">
            <LeadTimeCounter hours={8} />
            <div className="border border-gray-200 bg-white shadow-sm p-6 rounded-2xl flex-1">
              <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-4">Gate Status</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((gate) => (
                  <div key={gate} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200/50">
                    <div className="text-sm font-sans font-semibold text-gray-700 text-gray-700">Gate {gate}</div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-xl uppercase ${gate <= 2 ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-100 text-gray-500'}`}>
                      {gate <= 2 ? 'OPEN 0.5m' : 'CLOSED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-1 border border-gray-200 bg-white shadow-sm p-6 rounded-2xl">
            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-4 flex items-center gap-2">
              <Target size={14} /> Threshold Triggers
            </h3>
            <div className="space-y-4 font-sans font-semibold text-gray-700 text-sm">
              <div className="border-l-2 border-red-500 pl-3">
                <div className="text-red-700 font-bold">2403 ft (Full Res Lvl)</div>
                <div className="text-gray-500 text-xs mt-1">Evacuation required downstream</div>
              </div>
              <div className="border-l-2 border-amber-500 pl-3">
                <div className="text-amber-500 font-bold">2395 ft (Rule Curve)</div>
                <div className="text-gray-500 text-xs mt-1">Red alert to districts</div>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <div className="text-blue-700 font-bold">2390 ft (Blue Alert)</div>
                <div className="text-gray-500 text-xs mt-1">Initial warnings</div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1 tracking-wider">CURRENT ELEVATION</div>
                <div className="text-xl font-bold text-gray-800">2396.4 ft</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white shadow-sm p-6 rounded-2xl mt-6 h-80">
          <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-4">Inflow vs Outflow Projection (24h)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
                itemStyle={{ fontSize: 12, fontFamily: 'monospace' }} 
              />
              <Line type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="stepAfter" dataKey="outflow" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
