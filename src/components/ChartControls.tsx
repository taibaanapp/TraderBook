import React from 'react';
import { RefreshCcw, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChartControlsProps {
  interval: string;
  setInterval: (val: string) => void;
  chartType: 'line' | 'candlestick';
  setChartType: (val: 'line' | 'candlestick') => void;
  showVWAP: boolean;
  setShowVWAP: (val: boolean) => void;
  showOBV: boolean;
  setShowOBV: (val: boolean) => void;
  showVolume: boolean;
  setShowVolume: (val: boolean) => void;
  onReset: () => void;
}

const INTERVALS = [
  { label: 'Hourly', value: '1h' },
  { label: 'Daily', value: '1d' },
  { label: 'Weekly', value: '1wk' },
];

export const ChartControls: React.FC<ChartControlsProps> = ({
  interval,
  setInterval,
  chartType,
  setChartType,
  showVWAP,
  setShowVWAP,
  showOBV,
  setShowOBV,
  showVolume,
  setShowVolume,
  onReset
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              onClick={() => setInterval(int.value)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                interval === int.value ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={() => setChartType('line')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              chartType === 'line' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              chartType === 'candlestick' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Candle
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowVWAP(!showVWAP)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
            showVWAP ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" : "bg-white border-zinc-200 text-zinc-400"
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" /> VWAP
        </button>
        <button
          onClick={() => setShowOBV(!showOBV)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
            showOBV ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm" : "bg-white border-zinc-200 text-zinc-400"
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" /> OBV
        </button>
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
            showVolume ? "bg-zinc-900 border-zinc-900 text-white shadow-md" : "bg-white border-zinc-200 text-zinc-400"
          )}
        >
          Volume
        </button>
        <div className="w-px h-6 bg-zinc-200 mx-1" />
        <button
          onClick={onReset}
          className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
          title="Reset View"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
