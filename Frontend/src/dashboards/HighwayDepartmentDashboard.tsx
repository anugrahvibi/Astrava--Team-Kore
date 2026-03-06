import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadTimeCounter } from '../components/LeadTimeCounter';
import { Activity, MapPin, AlertTriangle, Hammer, CheckCircle2 } from 'lucide-react';
import { fetchActiveAlerts, fetchPredictions } from '../utils/dataFetcher';
import type { Alert, Prediction } from '../utils/dataFetcher';

export function HighwayDepartmentDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

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
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Hammer className="text-orange-600" />
              Highway Department Operations
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Road Safety & Infrastructure Protection</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl text-sm text-orange-700 font-sans font-semibold flex items-center gap-2">
                <Activity size={16} /> MONITORING ACTIVE
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Closures</div>
             <div className="text-4xl font-black text-gray-900">{criticalRoads}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Avg. Prep Time</div>
             <div className="text-4xl font-black text-gray-900">{avgLeadTime}h</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
             <div className="text-4xl font-black text-emerald-600">READY</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase text-sm tracking-wide">
              <AlertTriangle size={16} className="text-orange-600" /> Deployment Directives
            </h3>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="group p-5 bg-gray-50 border border-gray-200 rounded-2xl hover:border-orange-300 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                         <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">
                            {alert.zone_id.replace('ZONE_', '')} • PRIORITY {alert.alert_level}
                         </div>
                         <div className="text-gray-900 font-bold mb-1">{alert.action_text}</div>
                         <div className="text-xs text-gray-500 italic">Source: {alert.target_role} standard protocol</div>
                      </div>
                      <div className="bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                   <CheckCircle2 size={48} className="mb-4 opacity-20" />
                   <p className="font-medium text-sm">All road sectors currently operational</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <LeadTimeCounter hours={8} />
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Protocols</h3>
               <div className="space-y-3">
                  {[
                    'Deploy portable diesel pumps',
                    'Sandbag low-lying underpasses',
                    'Divert traffic to elevated tracks',
                    'Place patrol on 30-min standby'
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-xs font-medium text-gray-700">
                       <CheckCircle2 size={14} className="text-emerald-600" />
                       {task}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
