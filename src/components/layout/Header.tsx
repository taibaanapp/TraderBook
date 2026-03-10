import React from 'react';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  RefreshCcw,
  Monitor,
  Moon,
  Sun,
  Brain,
  Activity,
  Settings,
  SlidersHorizontal,
  X,
  ChevronRight
} from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../../utils/cn';
import { TRANSLATIONS } from '../../constants/translations';
import { getFlag } from '../../utils/formatters';

interface HeaderProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  symbol: string;
  searchInput: string;
  setSearchInput: (input: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  suggestions: any[];
  setSymbol: (symbol: string) => void;
  marketFilter: 'ALL' | 'TH' | 'US';
  setMarketFilter: (filter: 'ALL' | 'TH' | 'US') => void;
  currentTime: Date;
  setIsSettingsOpen: (open: boolean) => void;
  setIsDashboardOpen: (open: boolean) => void;
  setAdminClickCount: (count: number | ((prev: number) => number)) => void;
  setIsAdminPanelOpen: (open: boolean) => void;
  adminClickCount: number;
  showChartControls: boolean;
  setShowChartControls: (show: boolean) => void;
  isElliottWaveAiEnabled: boolean;
  setIsElliottWaveAiEnabled: (enabled: boolean) => void;
  isAiInsightEnabled: boolean;
  setIsAiInsightEnabled: (enabled: boolean) => void;
  showSimTrade: boolean;
  setShowSimTrade: (show: boolean) => void;
  searchFormRef: React.RefObject<HTMLFormElement>;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  symbol,
  searchInput,
  setSearchInput,
  handleSearch,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  setSymbol,
  marketFilter,
  setMarketFilter,
  currentTime,
  setIsSettingsOpen,
  setIsDashboardOpen,
  setAdminClickCount,
  setIsAdminPanelOpen,
  adminClickCount,
  showChartControls,
  setShowChartControls,
  isElliottWaveAiEnabled,
  setIsElliottWaveAiEnabled,
  isAiInsightEnabled,
  setIsAiInsightEnabled,
  showSimTrade,
  setShowSimTrade,
  searchFormRef
}) => {
  return (
    <header className={cn(
      "border-b sticky top-0 z-50 transition-colors duration-300",
      theme === 'dark' ? "bg-[#030712] border-zinc-700" : "bg-white border-zinc-200"
    )}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            setAdminClickCount(prev => {
              if (prev + 1 >= 7) {
                setIsAdminPanelOpen(true);
                return 0;
              }
              return prev + 1;
            });
          }}
        >
          <Logo className="w-8 h-8" />
          <div className="hidden sm:block">
            <h1 className={cn("text-lg font-black tracking-tighter uppercase italic", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
              Stock<span className="text-rose-500">Terminal</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] -mt-1">Professional Grade</p>
          </div>
        </div>

        <form 
          ref={searchFormRef}
          onSubmit={handleSearch} 
          className="flex-1 max-w-2xl mx-8 relative"
        >
          <div className="relative group">
            <div className={cn(
              "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors",
              theme === 'dark' ? "text-zinc-500 group-focus-within:text-emerald-500" : "text-zinc-400 group-focus-within:text-zinc-900"
            )}>
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={TRANSLATIONS.TH.common.search_placeholder}
              className={cn(
                "w-full pl-11 pr-4 py-2.5 rounded-full text-sm font-bold transition-all border outline-none",
                theme === 'dark' 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:bg-zinc-800 focus:border-zinc-500" 
                  : "bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900"
              )}
            />
          </div>

          {showSuggestions && (
            <div className={cn(
              "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 border",
              theme === 'dark' ? "bg-zinc-900 border-zinc-700 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "bg-white border-zinc-200 shadow-2xl"
            )}>
              <div className={cn(
                "flex p-1 border-b",
                theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-zinc-50 border-zinc-100"
              )}>
                {(['ALL', 'TH', 'US'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarketFilter(m)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                      marketFilter === m 
                        ? (theme === 'dark' ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-zinc-100 border-zinc-300 text-zinc-900")
                        : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")
                    )}
                  >
                    {m === 'ALL' ? TRANSLATIONS.TH.common.all : (m === 'TH' ? TRANSLATIONS.TH.common.th_stocks : TRANSLATIONS.TH.common.us_stocks)}
                  </button>
                ))}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-zinc-400 text-sm italic">
                    {TRANSLATIONS.TH.common.search_not_found}
                  </div>
                ) : suggestions.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(s.symbol);
                      setSearchInput(s.symbol);
                      setShowSuggestions(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 flex items-center justify-between transition-colors border-b last:border-0 text-left",
                      theme === 'dark' 
                        ? "hover:bg-zinc-700 border-zinc-700" 
                        : "hover:bg-zinc-50 border-zinc-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFlag(s.symbol)}</span>
                      <div>
                        <p className={cn("text-base font-bold", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>{s.symbol}</p>
                        <p className="text-sm text-zinc-400 font-medium truncate max-w-[200px]">{s.name}</p>
                        <p className="text-[10px] text-zinc-300 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{s.sector}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">{s.market}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end">
            <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === 'dark' ? "text-zinc-500" : "text-zinc-400")}>
              System Time
            </p>
            <p className={cn("text-sm font-black font-mono tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
              {currentTime.toLocaleString('th-TH', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSimTrade(!showSimTrade)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                showSimTrade 
                  ? (theme === 'dark' ? "bg-rose-900/50 border-rose-700 text-rose-400" : "bg-rose-100 border-rose-300 text-rose-600")
                  : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")
              )}
              title="Sim Trade"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDashboardOpen(true)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-indigo-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-indigo-500 hover:bg-zinc-50"
              )}
              title="Reversal Dashboard"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowChartControls(!showChartControls)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-emerald-500 hover:bg-zinc-50"
              )}
              title="Chart Controls"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsElliottWaveAiEnabled(!isElliottWaveAiEnabled)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                isElliottWaveAiEnabled 
                  ? (theme === 'dark' ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-zinc-100 border-zinc-300 text-zinc-900")
                  : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")
              )}
              title="Elliott Wave AI Analysis"
            >
              <Brain className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAiInsightEnabled(!isAiInsightEnabled)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                isAiInsightEnabled 
                  ? (theme === 'dark' ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-zinc-100 border-zinc-300 text-zinc-900")
                  : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")
              )}
              title="AI Stock Profile"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-xl transition-all border",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
