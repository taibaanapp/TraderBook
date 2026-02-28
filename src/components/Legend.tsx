import React from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';

export const Legend: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight text-zinc-900">Indicator Guide</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Color System</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-1.5">Money Flow</p>
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              วิเคราะห์ <span className="text-zinc-900 font-bold">Volume</span> + <span className="text-zinc-900 font-bold">Momentum</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1 border-b border-zinc-100 pb-1.5">Interpretation</p>
          
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <div className="w-3 h-3 rounded-full bg-[#15803d] shadow-sm shadow-emerald-200" />
            <p className="text-xs font-bold text-zinc-900">Strong Inflow</p>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-sm shadow-emerald-100" />
            <p className="text-xs font-bold text-zinc-900">Accumulation</p>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <div className="w-3 h-3 rounded-full bg-[#94a3b8] shadow-sm shadow-zinc-100" />
            <p className="text-xs font-bold text-zinc-900">Neutral</p>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <div className="w-3 h-3 rounded-full bg-[#f97316] shadow-sm shadow-orange-100" />
            <p className="text-xs font-bold text-zinc-900">Distribution</p>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all">
            <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm shadow-red-100" />
            <p className="text-xs font-bold text-zinc-900">Strong Outflow</p>
          </div>
        </div>
      </div>
    </div>
  );
};
