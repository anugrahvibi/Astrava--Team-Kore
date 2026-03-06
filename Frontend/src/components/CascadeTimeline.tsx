import React from 'react';
import { InfrastructureNode } from '../utils/dataFetcher';

interface TimelineEvent {
  hour: number;
  node: InfrastructureNode;
  reason: string;
}

export function CascadeTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <div className="text-gray-500 font-mono text-xs">NO CASCADE EVENTS DETECTED</div>;
  }

  return (
    <div className="relative pl-4 space-y-4 border-l border-gray-800 my-4">
      {events.map((evt, idx) => {
        const typeColor = 
          evt.node.type === 'substation' ? 'bg-red-500' :
          evt.node.type === 'hospital' ? 'bg-emerald-500' :
          evt.node.type === 'road' ? 'bg-amber-500' :
          'bg-blue-500';

        return (
          <div key={`${evt.node.id}-${idx}`} className="relative">
            {/* Timeline Dot */}
            <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${typeColor} border-2 border-gray-950`} />
            
            <div className="flex bg-gray-900/50 p-2.5 rounded border border-gray-800/50 hover:border-gray-700 transition-colors">
              <div className="w-16 font-mono text-xs font-bold text-gray-400 mt-0.5 whitespace-nowrap">
                T+{evt.hour} hr
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-200 uppercase flex items-center gap-2">
                  {evt.node.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-gray-950 ${typeColor}`}>
                    {evt.node.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{evt.reason}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
