import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  ChevronRight,
  Calculator,
  Brain,
  History as HistoryIcon
} from 'lucide-react';
import { StockProfile } from '../StockProfile';
import { FinancialIndicators } from '../FinancialIndicators';
import { ReversalBox } from '../ReversalBox';
import { WhatIfBox } from '../WhatIfBox';
import { cn } from '../../utils/cn';
import { TRANSLATIONS } from '../../constants/translations';
import { getFlag } from '../../utils/formatters';

interface SidebarProps {
  theme: 'light' | 'dark';
  symbol: string;
  stockData: any;
  stockProfile: any;
  profileLoading: boolean;
  isProfileExpanded: boolean;
  setIsProfileExpanded: (expanded: boolean) => void;
  isSimulationExpanded: boolean;
  setIsSimulationExpanded: (expanded: boolean) => void;
  isFinancialsExpanded: boolean;
  setIsFinancialsExpanded: (expanded: boolean) => void;
  isSimulationMode: boolean;
  setIsSimulationMode: (mode: boolean) => void;
  simulationRate: number;
  setSimulationRate: (rate: number) => void;
  handleScenarioToggle: () => void;
  isScenarioMode: boolean;
  isSmartSRMode: boolean;
  setIsSmartSRMode: (mode: boolean) => void;
  isRevealing: boolean;
  setIsRevealing: (revealing: boolean) => void;
  showRecentStocks: boolean;
  recentStocks: any[];
  setSymbol: (symbol: string) => void;
  setSearchInput: (input: string) => void;
  fetchStockProfile: (symbol: string, exchangeName?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  symbol,
  stockData,
  stockProfile,
  profileLoading,
  isProfileExpanded,
  setIsProfileExpanded,
  isSimulationExpanded,
  setIsSimulationExpanded,
  isFinancialsExpanded,
  setIsFinancialsExpanded,
  isSimulationMode,
  setIsSimulationMode,
  simulationRate,
  setSimulationRate,
  handleScenarioToggle,
  isScenarioMode,
  isSmartSRMode,
  setIsSmartSRMode,
  isRevealing,
  setIsRevealing,
  showRecentStocks,
  recentStocks,
  setSymbol,
  setSearchInput,
  fetchStockProfile
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Stock Profile */}
      <div className={cn(
        "rounded-2xl border transition-colors duration-300 overflow-hidden",
        theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
      )}>
        <button 
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          className={cn(
            "w-full px-6 py-4 flex items-center justify-between transition-colors",
            theme === 'dark' ? "hover:bg-zinc-800/50" : "hover:bg-zinc-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
              {TRANSLATIONS.TH.common.stock_profile}
            </h3>
          </div>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isProfileExpanded && "rotate-90", theme === 'dark' ? "text-zinc-500" : "text-zinc-400")} />
        </button>
        
        {isProfileExpanded && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
            <StockProfile 
              symbol={symbol} 
              profile={stockProfile} 
              loading={profileLoading}
              onFetch={() => fetchStockProfile(symbol, stockData?.fullExchangeName)}
            />
          </div>
        )}
      </div>
      
      {showRecentStocks && recentStocks.length > 0 && (
        <div className={cn(
          "rounded-2xl border p-4 transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <HistoryIcon className={cn("w-4 h-4", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")} />
            <h3 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
              Recently Viewed
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentStocks.map((s) => (
              <button
                key={s.symbol}
                onClick={() => {
                  setSymbol(s.symbol);
                  setSearchInput(s.symbol);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2",
                  symbol === s.symbol 
                    ? (theme === 'dark' ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100")
                    : (s.percentChange >= 0 
                      ? (theme === 'dark' ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100")
                      : (theme === 'dark' ? "bg-rose-900/20 border-rose-900/30 text-rose-400 hover:bg-rose-900/40" : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100")
                    )
                )}
              >
                <span>{getFlag(s.symbol)}</span>
                <span>{s.symbol}</span>
                <span className={cn(
                  "text-[10px]",
                  s.percentChange >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {s.percentChange >= 0 ? '+' : ''}{s.percentChange.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Simulation & Analysis */}
      <div className={cn(
        "rounded-2xl border transition-colors duration-300 overflow-hidden",
        theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
      )}>
        <button 
          onClick={() => setIsSimulationExpanded(!isSimulationExpanded)}
          className={cn(
            "w-full px-6 py-4 flex items-center justify-between transition-colors",
            theme === 'dark' ? "hover:bg-zinc-800/50" : "hover:bg-zinc-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calculator className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
              {TRANSLATIONS.TH.common.simulation_analysis}
            </h3>
          </div>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isSimulationExpanded && "rotate-90", theme === 'dark' ? "text-zinc-500" : "text-zinc-400")} />
        </button>

        {isSimulationExpanded && (
          <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2">
            <ReversalBox 
              data={stockData?.data || []} 
              onAnalyze={async () => {}} 
            />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                    Scenario Mode
                  </span>
                </div>
                <button
                  onClick={handleScenarioToggle}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                    isScenarioMode ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    isScenarioMode ? "translate-x-5" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-500" />
                  <span className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                    Smart S/R
                  </span>
                </div>
                <button
                  onClick={() => setIsSmartSRMode(!isSmartSRMode)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                    isSmartSRMode ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    isSmartSRMode ? "translate-x-5" : "translate-x-1"
                  )} />
                </button>
              </div>
              
              {isSmartSRMode && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 animate-in zoom-in-95">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-2">Smart S/R Active</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                    Right-click on any candle to set the analysis anchor point.
                  </p>
                  {isSmartSRMode && (
                    <button
                      onClick={() => setIsRevealing(true)}
                      disabled={isRevealing}
                      className={cn(
                        "mt-3 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        isRevealing 
                          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                          : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                      )}
                    >
                      {isRevealing ? 'Revealing...' : 'Reveal Future'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <WhatIfBox 
              onSimulate={(rate) => {
                setSimulationRate(rate);
                setIsSimulationMode(true);
              }}
              onReset={() => {
                setIsSimulationMode(false);
                setSimulationRate(-1.5);
              }}
              isSimulating={isSimulationMode}
            />
          </div>
        )}
      </div>

      {/* Financial Indicators */}
      <div className={cn(
        "rounded-2xl border transition-colors duration-300 overflow-hidden",
        theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
      )}>
        <button 
          onClick={() => setIsFinancialsExpanded(!isFinancialsExpanded)}
          className={cn(
            "w-full px-6 py-4 flex items-center justify-between transition-colors",
            theme === 'dark' ? "hover:bg-zinc-800/50" : "hover:bg-zinc-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
              {TRANSLATIONS.TH.common.financial_indicators}
            </h3>
          </div>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isFinancialsExpanded && "rotate-90", theme === 'dark' ? "text-zinc-500" : "text-zinc-400")} />
        </button>

        {isFinancialsExpanded && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
            <FinancialIndicators data={stockData} />
          </div>
        )}
      </div>
    </div>
  );
};
