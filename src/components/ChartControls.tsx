import React from 'react';
import { RefreshCcw, BarChart3, TrendingUp, HelpCircle, Maximize, Minimize } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.controls;

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
  showRSI: boolean;
  setShowRSI: (val: boolean) => void;
  showMACD: boolean;
  setShowMACD: (val: boolean) => void;
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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSymbolChange?: (symbol: string) => void;
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
  showRSI,
  setShowRSI,
  showMACD,
  setShowMACD,
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
  isFullscreen,
  onToggleFullscreen,
  onSymbolChange,
  theme
}) => {
  const isDark = theme === 'dark';
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSymbolChange) {
      onSymbolChange(searchInput.toUpperCase());
      setSearchInput('');
    }
  };

  return (
    <div className={cn(
      "flex flex-wrap gap-4 p-4 rounded-xl border transition-colors duration-300 animate-in slide-in-from-top-2 fade-in duration-200",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
      isFullscreen && "rounded-none border-b border-x-0 border-t-0"
    )}>
      
      {/* Search Group */}
      {isFullscreen && onSymbolChange && (
        <div className="flex flex-col gap-1.5">
          <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search</span>
          <form onSubmit={handleSearch} className={cn("flex p-1 rounded-lg border", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="SYMBOL"
              className={cn(
                "w-20 px-2 py-1.5 text-[11px] font-bold uppercase tracking-tight bg-transparent outline-none",
                isDark ? "text-zinc-100 placeholder-zinc-600" : "text-zinc-900 placeholder-zinc-400"
              )}
            />
          </form>
        </div>
      )}

      {/* Timeframe Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.timeframe}</span>
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
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.type}</span>
        <div className={cn("flex p-1 rounded-lg border", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200", (isSmartSRMode || isScenarioMode) && "opacity-50 pointer-events-none")}>
          <button
            disabled={isSmartSRMode || isScenarioMode}
            onClick={() => setChartType('line')}
            title={t.line}
            className={cn(
              "px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight rounded-md transition-all",
              chartType === 'line' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            {t.line}
          </button>
          <button
            disabled={isSmartSRMode || isScenarioMode}
            onClick={() => setChartType('candlestick')}
            title={t.candle}
            className={cn(
              "px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight rounded-md transition-all",
              chartType === 'candlestick' 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            {t.candle}
          </button>
        </div>
      </div>

      {/* Tools Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.tools}</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            onClick={() => {
              const nextMode = !isSimulationMode;
              setIsSimulationMode(nextMode);
              if (nextMode) setShowEMAX(true);
            }}
            title={t.sim_title}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isSimulationMode 
                ? "bg-rose-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <TrendingUp className={cn("w-3.5 h-3.5", isSimulationMode && "animate-pulse")} />
            {t.sim}
          </button>
          <button
            onClick={() => {
              setIsSmartSRMode(!isSmartSRMode);
              if (!isSmartSRMode) setIsSimulationMode(false);
            }}
            title={t.sr_title}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isSmartSRMode 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <TrendingUp className={cn("w-3.5 h-3.5", isSmartSRMode && "animate-pulse")} />
            {t.sr}
          </button>
          <button
            onClick={onToggleScenario}
            title={t.ghost_title}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isScenarioMode 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <BarChart3 className={cn("w-3.5 h-3.5", isScenarioMode && "animate-pulse")} />
            {t.ghost}
          </button>
        </div>
      </div>

      {/* Volume Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.volume}</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVolume(!showVolume)}
            title={t.vol_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showVolume 
                ? (isDark ? "bg-zinc-100 text-zinc-900 shadow-sm" : "bg-zinc-900 text-white shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.vol}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowVWAP(!showVWAP)}
            title={t.vwap_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showVWAP 
                ? (isDark ? "bg-amber-900/40 text-amber-400 shadow-sm" : "bg-amber-100 text-amber-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.vwap}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowOBV(!showOBV)}
            title={t.obv_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showOBV 
                ? (isDark ? "bg-purple-900/40 text-purple-400 shadow-sm" : "bg-purple-100 text-purple-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.obv}
          </button>
        </div>
      </div>

      {/* Trend Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.trend}</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMA20(!showEMA20)}
            title={t.ema20_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMA20 
                ? "bg-blue-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.ema20}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMA50(!showEMA50)}
            title={t.ema50_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMA50 
                ? "bg-pink-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.ema50}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowRSI(!showRSI)}
            title={t.rsi_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showRSI 
                ? (isDark ? "bg-emerald-900/40 text-emerald-400 shadow-sm" : "bg-emerald-100 text-emerald-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.rsi}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowMACD(!showMACD)}
            title={t.macd_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showMACD 
                ? (isDark ? "bg-rose-900/40 text-rose-400 shadow-sm" : "bg-rose-100 text-rose-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.macd}
          </button>
          <button
            disabled={isSmartSRMode}
            onClick={() => setShowEMAX(!showEMAX)}
            title={t.emax_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              showEMAX 
                ? (isDark ? "bg-blue-900/40 text-blue-400 shadow-sm" : "bg-blue-100 text-blue-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.emax}
          </button>
        </div>
      </div>

      {/* View Group */}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.view}</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            disabled={isSmartSRMode}
            onClick={() => setIsLogScale(!isLogScale)}
            title={t.log_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isLogScale 
                ? (isDark ? "bg-indigo-900/40 text-indigo-400 shadow-sm" : "bg-indigo-100 text-indigo-700 shadow-sm") 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.log}
          </button>
          <button
            onClick={() => setIsInvertedY(!isInvertedY)}
            title={t.invert_y_title}
            className={cn(
              "px-3 py-1.5 rounded-md font-bold text-[11px] uppercase tracking-tight transition-all",
              isInvertedY 
                ? "bg-rose-500 text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {t.invert_y}
          </button>
        </div>
      </div>

      {/* Actions Group */}
      <div className="flex flex-col gap-1.5 ml-auto">
        <span className="px-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">{t.actions}</span>
        <div className={cn("flex p-1 rounded-lg border gap-1", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
          <button
            onClick={onToggleFullscreen}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            onClick={onRefresh}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
            title={t.refresh}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
            title={t.reset}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
