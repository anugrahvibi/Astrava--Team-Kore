import React, { useEffect, useState } from 'react';
import { fetchZones, fetchInfrastructure, generateMockPredictions } from '../utils/dataFetcher';
import type { Prediction, InfrastructureNode } from '../utils/dataFetcher';
import { Users, FileText, CheckCircle2 } from 'lucide-react';

export function DistrictAdminDashboard() {
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    async function init() {
      const zData = await fetchZones();
      const iData = await fetchInfrastructure();
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(generateMockPredictions(zData.features || []));
    }
    init();
  }, []);

  const totalExposed = predictions
    .filter(p => ['RED', 'AMBER'].includes(p.alert_level))
    .reduce((acc, curr) => acc + (Math.random() * 50000 + 10000), 0);

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-700" size={28} />
              DISTRICT ADMINISTRATION COMMAND
            </h1>
            <p className="text-gray-500 font-sans font-semibold text-gray-700 text-sm mt-2">Executive Summary & Multi-Department Response Tracker</p>
          </div>
          <div className="text-right border border-red-500/30 bg-red-500/10 p-4 rounded-2xl">
            <h3 className="text-red-700 font-bold uppercase tracking-wide text-xs mb-1">Total Population Exposed (Est)</h3>
            <div className="text-3xl font-black font-sans font-semibold text-gray-700 text-red-700 flex items-center justify-end gap-2">
              {Math.round(totalExposed).toLocaleString()} <Users size={20} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 bg-white shadow-sm border-b border-gray-200">
              <h2 className="font-bold text-gray-700 uppercase tracking-wide text-xs">Ward-Level Risk Analysis</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white shadow-sm text-gray-500 uppercase font-bold text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Zone / Ward</th>
                    <th className="p-3">Risk Level</th>
                    <th className="p-3">Lead Time</th>
                    <th className="p-3 text-right">Proj Water Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 border-t border-gray-200">
                  {predictions.map(p => (
                    <tr key={p.zone_id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-semibold text-gray-800">{p.zone_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 uppercase text-[10px] font-bold rounded-xl ${
                          p.alert_level === 'RED' ? 'bg-red-500/20 text-red-700' :
                          p.alert_level === 'AMBER' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-emerald-500/20 text-emerald-700'
                        }`}>
                          {p.alert_level}
                        </span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-gray-700 text-gray-600">{p.lead_time_hours} hrs</td>
                      <td className="p-3 text-right font-sans font-semibold text-gray-700 text-blue-600 font-bold">{p.projected_water_level.toFixed(2)}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 bg-white shadow-sm border-b border-gray-200">
                <h2 className="font-bold text-gray-700 uppercase tracking-wide text-xs flex items-center justify-between">
                   Department Action Tracker
                   <span className="text-blue-700 font-sans font-semibold text-gray-700">4 ACTIVE TICKETS</span>
                </h2>
             </div>
             <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {[
                  { dept: 'HIGHWAYS', action: 'Close NH-66 Edapally Exit', time: '1H', status: 'PENDING', color: 'text-amber-500', border: 'border-amber-500/50' },
                  { dept: 'KSEB (POWER)', action: 'Isolate Kalamassery Substation', time: 'ACTIVE', status: 'IN PROGRESS', color: 'text-blue-700', border: 'border-blue-500/50' },
                  { dept: 'POLICE', action: 'Initiate Aluva Evacuation Protocol', time: '4H', status: 'PENDING', color: 'text-red-700', border: 'border-red-500/50' },
                  { dept: 'HEALTH', action: 'Evacuate General Hospital Ground Floor', time: 'DONE', status: 'COMPLETED', color: 'text-emerald-700', border: 'border-emerald-500/50' }
                ].map((act, i) => (
                  <div key={i} className={`p-4 border rounded-xl bg-gray-50 flex justify-between items-center ${act.border}`}>
                     <div>
                       <div className={`text-[10px] uppercase font-bold tracking-wide mb-1 ${act.color}`}>
                         {act.dept} • {act.status}
                       </div>
                       <div className="text-gray-800 font-medium text-sm">
                         {act.action}
                       </div>
                     </div>
                     <div className="font-sans font-semibold text-gray-700 font-bold text-2xl text-gray-600">
                        {act.status === 'COMPLETED' ? <CheckCircle2 className="text-emerald-700" /> : `T-${act.time}`}
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
