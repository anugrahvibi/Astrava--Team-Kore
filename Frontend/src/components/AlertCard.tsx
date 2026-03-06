import React from 'react';
import { AlertTriangle, Clock, ShieldCheck, Activity } from 'lucide-react';
import type { Prediction } from '../utils/dataFetcher';

interface AlertCardProps {
  prediction: Prediction | null;
}

export function AlertCard({ prediction }: AlertCardProps) {
  if (!prediction) {
    return (
      <div className="bg-blue-50/30 border border-blue-100 p-8 rounded-[2.5rem] text-center space-y-4">
        <Activity size={32} className="mx-auto text-blue-200 animate-pulse" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Sector Lock</p>
      </div>
    );
  }

  const { alert_level, flood_probability, zone_name, lead_time_hours } = prediction;
  
  const themes = {
    GREEN: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      pill: 'bg-emerald-600',
      icon: <ShieldCheck size={20} className="text-emerald-700" />
    },
    AMBER: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      pill: 'bg-amber-600',
      icon: <AlertTriangle size={20} className="text-amber-700" />
    },
    RED: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-700',
      pill: 'bg-red-600',
      icon: <AlertTriangle size={20} className="text-red-700" />
    },
  };

  const theme = themes[alert_level] || themes.GREEN;

  return (
    <div className={`p-8 rounded-[2.5rem] border ${theme.bg} ${theme.border} space-y-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-black text-xl text-gray-900 uppercase brand-font tracking-tight">{zone_name}</h3>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${theme.pill} animate-pulse`} />
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>{alert_level} PROTOCOL</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-gray-900 brand-font">{(flood_probability * 100).toFixed(0)}%</div>
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entropy Index</div>
        </div>
      </div>
      
      <div className={`flex items-center gap-3 pt-6 border-t ${theme.border} text-xs font-bold ${theme.text}`}>
        <Clock size={16} className="opacity-60" />
        <span className="uppercase tracking-widest">T-minus {lead_time_hours}:00 Peak Impact</span>
      </div>
    </div>
  );
}
