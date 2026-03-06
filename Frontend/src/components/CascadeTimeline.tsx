import React from 'react';
import type { InfrastructureNode } from '../utils/dataFetcher';

interface TimelineEvent {
  hour: number;
  node: InfrastructureNode;
  reason: string;
}

export function CascadeTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest text-center py-10 italic">Operational Vacuum: No Cascades Detected</div>;
  }

  return (
    <div className="relative pl-6 space-y-6 border-l-2 border-gray-100 my-6">
      {events.map((evt, idx) => {
        const colors = {
          substation: 'bg-red-600 shadow-red-500/20',
          hospital: 'bg-emerald-600 shadow-emerald-500/20',
          road: 'bg-amber-500 shadow-amber-500/20',
          default: 'bg-blue-600 shadow-blue-500/20'
        };
        const activeColor = colors[evt.node.type as keyof typeof colors] || colors.default;

        return (
          <div key={`${evt.node.id}-${idx}`} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full ${activeColor} border-4 border-white shadow-lg ring-1 ring-gray-100 transition-transform group-hover:scale-125`} />
            
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group-hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{evt.hour}H PULSE</span>
                   <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black text-white ${activeColor}`}>
                      {evt.node.type}
                   </span>
                </div>
              </div>
              
              <div className="space-y-1">
                 <div className="text-[13px] font-bold text-gray-900 uppercase">
                   {evt.node.name}
                 </div>
                 <div className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
                    {evt.reason}
                 </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
