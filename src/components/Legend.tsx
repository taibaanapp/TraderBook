import React from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';

interface LegendProps {
  theme?: 'light' | 'dark';
}

export const Legend: React.FC<LegendProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded-2xl border p-6 transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          isDark ? "bg-zinc-100" : "bg-zinc-900"
        )}>
          <BarChart3 className={cn("w-5 h-5", isDark ? "text-zinc-900" : "text-white")} />
        </div>
        <div>
          <h3 className={cn("font-bold text-base tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>CrossVision Guide</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Color System</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mb-1 border-b pb-1.5",
            isDark ? "text-zinc-500 border-zinc-800" : "text-zinc-400 border-zinc-100"
          )}>Money Flow</p>
          
          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>Strong Inflow</p>
          </div>

          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>Accumulation</p>
          </div>

          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>Neutral</p>
          </div>

          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>Strong Outflow</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mb-1 border-b pb-1.5",
            isDark ? "text-zinc-500 border-zinc-800" : "text-zinc-400 border-zinc-100"
          )}>Moving Averages</p>
          
          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>EMA 50 (Blue)</p>
          </div>

          <div className="flex items-center gap-3 p-1 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
            <p className={cn("text-xs font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>EMA 135 (Pink)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
