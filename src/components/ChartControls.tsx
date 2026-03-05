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
      "flex items-center gap-3 p-4 rounded-xl border transition-colors duration-300 overflow-x-auto no-scrollbar",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn("flex p-1.5 rounded-lg border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200", isSmartSRMode && "opacity-50 pointer-events-none")}>
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              disabled={isSmartSRMode}
              onClick={() => setInterval(int.value)}
              title={int.title}
              className={cn(
                "px-4 py-2 text-[12px] font-bold uppercase tracking-tight rounded-md transition-all",
                interval === int.value 
                  ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>

        <div className={cn("flex p-1.5 rounded-lg border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200", (isSmartSRMode || isScenarioMode) && "opacity-50 pointer-events-none")}>
          <button
            disabled={isSmartSRMode || isScenarioMode}
            onClick={() => setChartType('line')}
            title="Line Chart"
            className={cn(
              "px-4 py-2 text-[12px] font-bold uppercase tracking-tight rounded-md transition-all",
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
              "px-4 py-2 text-[12px] font-bold uppercase tracking-tight rounded-md transition-all",
              chartType === 'candlestick' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Candle
          </button>
        </div>
      </div>

      <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <div className={cn("flex items-center gap-2", isSmartSRMode && "opacity-50 pointer-events-none")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVolume(!showVolume)}
            title="Toggle Volume"
            className={cn(
              "px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
              showVolume 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
            )}
          >
            VOL
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVWAP(!showVWAP)}
            title="Volume Weighted Average Price"
            className={cn(
              "px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
              showVWAP 
                ? (isDark ? "bg-amber-900/20 border-amber-900/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700 shadow-sm") 
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
            )}
          >
            VWAP
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMAX(!showEMAX)}
            title="Exponential Moving Average (50/135)"
            className={cn(
              "px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
              showEMAX 
                ? (isDark ? "bg-blue-900/20 border-blue-900/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700 shadow-sm") 
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
            )}
          >
            EMA
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowOBV(!showOBV)}
            title="On-Balance Volume"
            className={cn(
              "px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
              showOBV 
                ? (isDark ? "bg-purple-900/20 border-purple-900/30 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700 shadow-sm") 
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
            )}
          >
            OBV
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setIsLogScale(!isLogScale)}
            title="Toggle Logarithmic Scale"
            className={cn(
              "px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
              isLogScale 
                ? (isDark ? "bg-indigo-900/20 border-indigo-900/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm") 
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
            )}
          >
            LOG
          </button>
        </div>

        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <button
          onClick={() => {
            const nextMode = !isSimulationMode;
            setIsSimulationMode(nextMode);
            if (nextMode) setShowEMAX(true);
          }}
          title="Simulate Death Cross Prediction"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
            isSimulationMode 
              ? "bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-900/20" 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          <TrendingUp className={cn("w-4 h-4", isSimulationMode && "animate-pulse")} />
          SIM
        </button>
        <button
          onClick={() => {
            setIsSmartSRMode(!isSmartSRMode);
            if (!isSmartSRMode) setIsSimulationMode(false);
          }}
          title="Smart Support/Resistance Backtest"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
            isSmartSRMode 
              ? "bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-900/20" 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          <TrendingUp className={cn("w-4 h-4", isSmartSRMode && "animate-pulse")} />
          S/R
        </button>
        <button
          onClick={onToggleScenario}
          title="Candlestick Scenario Simulator"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md border font-bold text-[12px] uppercase tracking-tight transition-all",
            isScenarioMode 
              ? "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-900/20" 
              : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")
          )}
        >
          <BarChart3 className={cn("w-4 h-4", isScenarioMode && "animate-pulse")} />
          GHOST
        </button>

        <button
          onClick={onRefresh}
          className={cn(
            "p-1.5 rounded-md border transition-all",
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm"
          )}
          title="Refresh Data"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          className={cn(
            "p-1.5 rounded-md border transition-all",
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm"
          )}
          title="Reset View"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
