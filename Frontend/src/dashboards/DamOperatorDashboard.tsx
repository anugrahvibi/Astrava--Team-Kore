import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadTimeCounter } from '../components/LeadTimeCounter';
import { Activity, Droplets, Target, CheckCircle2 } from 'lucide-react';
import { fetchActiveAlerts, fetchSensorReadings, fetchPredictions } from '../utils/dataFetcher';
import type { Alert, SensorReading, Prediction } from '../utils/dataFetcher';


export function DamOperatorDashboard() {
  const [sensor, setSensor] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

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
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-3">
            <Droplets className="text-blue-700" />
            Dam Controller Operations
          </h1>
          <div className="flex gap-4">
            <div className={`shadow-sm border px-4 py-2 rounded-xl text-sm font-sans font-semibold flex items-center gap-2 ${
              systemStatus === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' :
              systemStatus === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-600' :
              'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Activity size={16} /> SYSTEM {systemStatus}
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
            <LeadTimeCounter hours={prediction?.lead_time_hours || 8} />
            <div className="border border-gray-200 bg-white shadow-sm p-6 rounded-2xl flex-1">
              <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-4">Urgent Directives</h3>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="text-xs font-bold text-red-700 uppercase mb-1">ACTION REQUIRED</div>
                      <div className="text-sm text-red-900 font-medium">{alert.action_text}</div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                    <CheckCircle2 size={24} className="mb-2" />
                    <p className="text-xs">No pending directives</p>
                  </div>
                )}
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
                <div className="text-xs text-gray-500 mb-1 tracking-wider">CURRENT ELEVATION (FT)</div>
                <div className="text-xl font-bold text-gray-800">
                  {sensor?.river_level_m ? (sensor.river_level_m * 3.28084 + 2300).toFixed(1) : '2396.4'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white shadow-sm p-6 rounded-2xl mt-6 h-80 flex items-center justify-center text-gray-400">
           <div className="text-center">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold uppercase">Real-time projection data unavailable</p>
           </div>
        </div>
      </div>
    </div>
  );
}
