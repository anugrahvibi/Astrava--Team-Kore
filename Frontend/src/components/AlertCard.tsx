import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Prediction } from '../utils/dataFetcher';

interface AlertCardProps {
  prediction: Prediction | null;
}

export function AlertCard({ prediction }: AlertCardProps) {
  if (!prediction) {
    return (
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg text-center text-gray-500">
        <AlertTriangle size={32} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm font-medium">Select a zone to view alert details</p>
      </div>
    );
  }

  const { alert_level, flood_probability, zone_name, lead_time_hours } = prediction;
  
  const colors = {
    GREEN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    AMBER: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    RED: 'border-red-500/30 bg-red-500/10 text-red-500',
  };

  const currentConfig = colors[alert_level] || colors.GREEN;

  return (
    <div className={`p-5 rounded-lg border ${currentConfig}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg uppercase tracking-wider text-gray-100">{zone_name}</h3>
          <span className="text-xs font-mono font-bold tracking-widest">{alert_level} ALERT</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold">{(flood_probability * 100).toFixed(0)}%</div>
          <div className="text-[10px] uppercase opacity-80">Flood Prob</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-current/20 text-sm font-mono opacity-90">
        <Clock size={16} />
        <span>T-{lead_time_hours}:00 PEAK</span>
      </div>
    </div>
  );
}
