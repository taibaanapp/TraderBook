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
  showEMA20: boolean;
  setShowEMA20: (val: boolean) => void;
  showEMA50: boolean;
  setShowEMA50: (val: boolean) => void;
  isInvertedY: boolean;
  setIsInvertedY: (val: boolean) => void;
  isLogScale: boolean;
  setIsLogScale: (val: boolean) => void;
  isSimulationMode: boolean;
  setIsSimulationMode: (val: boolean) => void;
  isSmartSRMode: boolean;
  setIsSmartSRMode: (val: boolean) => void;
  isScenarioMode: boolean;
  onToggleScenario: () => void;
  onReset: () => void;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

const INTERVALS = [
  { label: '1H', value: '1h', title: 'Hourly' },
  { label: '1D', value: '1d', title: 'Daily' },
  { label: '1W', value: '1wk', title: 'Weekly' },
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
  showEMA20,
  setShowEMA20,
  showEMA50,
  setShowEMA50,
  isInvertedY,
  setIsInvertedY,
  isLogScale,
  setIsLogScale,
  isSimulationMode,
  setIsSimulationMode,
  isSmartSRMode,
  setIsSmartSRMode,
  isScenarioMode,
  onToggleScenario,
  onReset,
  onRefresh,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "flex flex-wrap gap-4 p-4 rounded-xl border transition-colors duration-300 animate-in slide-in-from-top-2 fade-in duration-200",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      
      {/* Timeframe Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Timeframe</span>
        <div className={cn("flex p-1 rounded-lg border", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200", isSmartSRMode && "opacity-50 pointer-events-none")}>
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              disabled={isSmartSRMode}
              onClick={() => setInterval(int.value)}
              title={int.title}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight rounded-md transition-all",
                interval === int.value 
                  ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</span>
        <div className={cn("flex p-1 rounded-lg border", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200", (isSmartSRMode || isScenarioMode) && "opacity-50 pointer-events-none")}>
          <button
            disabled={isSmartSRMode || isScenarioMode}
            onClick={() => setChartType('line')}
            title="Line Chart"
            className={cn(
              "px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight rounded-md transition-all",
              chartType === 'line' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Line
          </button>
          <button
            disabled={isSmartSRMode || isScenarioMode}
            onClick={() => setChartType('candlestick')}
            title="Candlestick Chart"
            className={cn(
              "px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight rounded-md transition-all",
              chartType === 'candlestick' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Candle
          </button>
        </div>
      </div>

      {/* Tools Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tools</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            onClick={() => {
              const nextMode = !isSimulationMode;
              setIsSimulationMode(nextMode);
              if (nextMode) setShowEMAX(true);
            }}
            title="Simulate Death Cross Prediction"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isSimulationMode 
                ? "bg-rose-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <TrendingUp className={cn("w-3.5 h-3.5", isSimulationMode && "animate-pulse")} />
            SIM
          </button>
          <button
            onClick={() => {
              setIsSmartSRMode(!isSmartSRMode);
              if (!isSmartSRMode) setIsSimulationMode(false);
            }}
            title="Smart Support/Resistance Backtest"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isSmartSRMode 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <TrendingUp className={cn("w-3.5 h-3.5", isSmartSRMode && "animate-pulse")} />
            S/R
          </button>
          <button
            onClick={onToggleScenario}
            title="Candlestick Scenario Simulator"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isScenarioMode 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <BarChart3 className={cn("w-3.5 h-3.5", isScenarioMode && "animate-pulse")} />
            GHOST
          </button>
        </div>
      </div>

      {/* Volume Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Volume</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVolume(!showVolume)}
            title="Toggle Volume"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showVolume 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            VOL
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVWAP(!showVWAP)}
            title="Volume Weighted Average Price"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showVWAP 
                ? (isDark ? "bg-amber-900/40 text-amber-400 shadow-sm" : "bg-amber-100 text-amber-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            VWAP
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowOBV(!showOBV)}
            title="On-Balance Volume"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showOBV 
                ? (isDark ? "bg-purple-900/40 text-purple-400 shadow-sm" : "bg-purple-100 text-purple-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            OBV
          </button>
        </div>
      </div>

      {/* Trend Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Trend</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMA20(!showEMA20)}
            title="EMA 20 (Blue)"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMA20 
                ? "bg-blue-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            EMA 20
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMA50(!showEMA50)}
            title="EMA 50 (Pink)"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMA50 
                ? "bg-pink-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            EMA 50
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMAX(!showEMAX)}
            title="Exponential Moving Average (50/135)"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMAX 
                ? (isDark ? "bg-blue-900/40 text-blue-400 shadow-sm" : "bg-blue-100 text-blue-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            EMA+
          </button>
        </div>
      </div>

      {/* View Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">View</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setIsLogScale(!isLogScale)}
            title="Toggle Logarithmic Scale"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isLogScale 
                ? (isDark ? "bg-indigo-900/40 text-indigo-400 shadow-sm" : "bg-indigo-100 text-indigo-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            LOG
          </button>
          <button
            onClick={() => setIsInvertedY(!isInvertedY)}
            title="Invert Y-Axis (Prices)"
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isInvertedY 
                ? "bg-rose-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            INVERT Y
          </button>
        </div>
      </div>

      {/* Actions Group */}
      <div className="flex flex-col gap-1.5 ml-auto">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            onClick={onRefresh}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
            title="Refresh Data"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
            title="Reset View"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
