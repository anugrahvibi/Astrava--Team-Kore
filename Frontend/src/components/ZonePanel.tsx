import React from 'react';
import { Prediction, InfrastructureNode } from '../utils/dataFetcher';
import { AlertCard } from './AlertCard';
import { CascadeTimeline } from './CascadeTimeline';
import { X, Activity } from 'lucide-react';

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
      reason: `Water level exceeding ${node.flood_threshold}m threshold`
    }));

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-gray-950/95 backdrop-blur-md border-l border-gray-800 shadow-2xl flex flex-col z-40 transform transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
        <h2 className="font-bold text-lg tracking-tight flex items-center gap-2 text-gray-100">
          <Activity size={18} className="text-blue-500" />
          ZONE INTELLIGENCE
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="mb-6">
          <AlertCard prediction={prediction} />
        </div>

        {prediction && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded text-center">
              <div className="text-2xl font-mono text-blue-400 font-bold mb-1">
                {prediction.projected_water_level.toFixed(1)}m
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Proj Water Lvl
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded text-center">
              <div className="text-2xl font-mono text-gray-100 font-bold mb-1">
                {infrastructure.length}
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Vulnerable Assets
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Predicted Cascade Timeline
          </h3>
          <CascadeTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
