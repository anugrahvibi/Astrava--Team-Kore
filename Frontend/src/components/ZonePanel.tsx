import React from 'react';
import type { Prediction, InfrastructureNode } from '../utils/dataFetcher';
import { AlertCard } from './AlertCard';
import { CascadeTimeline } from './CascadeTimeline';
import { X, Activity, Shield } from 'lucide-react';

interface ZonePanelProps {
  zoneId: string | null;
  prediction: Prediction | null;
  infrastructure: InfrastructureNode[];
  onClose: () => void;
}

export function ZonePanel({ zoneId, prediction, infrastructure, onClose }: ZonePanelProps) {
  if (!zoneId) return null;

  // Mock cascade events for the panel
  const events = infrastructure
    .slice(0, 3)
    .map((node, i) => ({
      hour: (i + 1) * 2.5,
      node,
      reason: `Hydraulic pressure exceeding ${node.flood_threshold}m threshold at T+${(i+1)*2}h`
    }));

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-white/95 backdrop-blur-xl border-l border-gray-100 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-500">
      <div className="pt-32 flex items-center justify-between p-8 border-b border-gray-100 bg-white/50">
        <div className="space-y-1">
          <h2 className="font-black text-sm tracking-widest flex items-center gap-2 text-gray-900 uppercase">
            <Activity size={18} className="text-blue-600" />
            Sector Intelligence
          </h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-6">Live Prediction Matrix</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-90">
          <X size={20} />
        </button>
      </div>

      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-10">
        <div>
          <AlertCard prediction={prediction} />
        </div>

        {prediction && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-2">
              <div className="text-2xl font-black text-blue-600 brand-font">
                {prediction.projected_water_level.toFixed(1)}m
              </div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Peak Stage
              </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-2">
              <div className="text-2xl font-black text-gray-900 brand-font">
                {infrastructure.length}
              </div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Asset Count
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield size={14} className="text-blue-600" /> Automated Response Directives
          </h3>
          <CascadeTimeline events={events} />
        </div>
      </div>
      
      <div className="p-8 border-t border-gray-100 bg-gray-50/50">
         <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
            System Synchronization: Online
         </div>
      </div>
    </div>
  );
}
