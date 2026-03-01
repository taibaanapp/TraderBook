import React from 'react';
import { RefreshCcw, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
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
  showEMAX: boolean;
  setShowEMAX: (val: boolean) => void;
  isSimulationMode: boolean;
  setIsSimulationMode: (val: boolean) => void;
  onReset: () => void;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
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
  showEMAX,
  setShowEMAX,
  isSimulationMode,
  setIsSimulationMode,
  onReset,
  onRefresh,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl border transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn("flex p-1 rounded-xl border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              onClick={() => setInterval(int.value)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                interval === int.value 
                  ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>

        <div className={cn("flex p-1 rounded-xl border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
          <button
            onClick={() => setChartType('line')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              chartType === 'line' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              chartType === 'candlestick' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Candle
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all",
            showVolume 
              ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          Volume
        </button>
        <button
          onClick={() => setShowVWAP(!showVWAP)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all",
            showVWAP 
              ? (isDark ? "bg-amber-900/20 border-amber-900/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700 shadow-sm") 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          VWAP
        </button>
        <button
          onClick={() => setShowEMAX(!showEMAX)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all",
            showEMAX 
              ? (isDark ? "bg-blue-900/20 border-blue-900/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700 shadow-sm") 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          EMA
        </button>
        <button
          onClick={() => setShowOBV(!showOBV)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all",
            showOBV 
              ? (isDark ? "bg-purple-900/20 border-purple-900/30 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700 shadow-sm") 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          OBV
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
        <button
          onClick={() => {
            const nextMode = !isSimulationMode;
            setIsSimulationMode(nextMode);
            if (nextMode) setShowEMAX(true);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all",
            isSimulationMode 
              ? "bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-900/20" 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          <TrendingUp className={cn("w-3 h-3", isSimulationMode && "animate-pulse")} />
          Sim Death Cross
        </button>
        <div className="relative group/info">
          <button
            className={cn(
              "p-1.5 rounded-lg border transition-all",
              isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <div className={cn(
            "absolute bottom-full right-0 mb-2 w-64 p-4 rounded-xl border shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50",
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-600"
          )}>
            <h4 className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", isDark ? "text-zinc-100" : "text-zinc-900")}>Simulation Methodology</h4>
            <div className="space-y-2 text-[10px] leading-relaxed">
              <p><span className="font-bold text-rose-500">Weighted Volatility:</span> 70% weight on recent 30 days (Recency) + 30% weight on 90 days (Character).</p>
              <p><span className="font-bold text-rose-500">Price Projection:</span> 20-day forecast using Box-Muller transform for statistical randomness.</p>
              <p><span className="font-bold text-rose-500">Death Cross Logic:</span> Pure mathematical simulation of EMA 50 crossing below EMA 135.</p>
              <p className="italic opacity-70 border-t pt-2 mt-2">No AI estimation used. All calculations are hard-coded statistical functions.</p>
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className={cn(
            "p-1.5 rounded-lg border transition-all",
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm"
          )}
          title="Refresh Data"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onReset}
          className={cn(
            "p-1.5 rounded-lg border transition-all",
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm"
          )}
          title="Reset View"
        >
          <BarChart3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
