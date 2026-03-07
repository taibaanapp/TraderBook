import React from 'react';
import { Info, Globe, Users, MessageSquare, TrendingUp, Brain, Power } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.profile;

interface StockProfileData {
  description: string;
  revenue: string;
  competitors: string[];
  outlook: string;
}

interface StockProfileProps {
  theme?: 'light' | 'dark';
  data: StockProfileData | null;
  loading: boolean;
  symbol: string;
  isExpanded: boolean;
  onToggle: () => void;
  isAiEnabled: boolean;
  onToggleAi: () => void;
}

export const StockProfile: React.FC<StockProfileProps> = ({ 
  theme, 
  data, 
  loading, 
  symbol, 
  isExpanded, 
  onToggle,
  isAiEnabled,
  onToggleAi
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
      isExpanded ? "p-8" : "p-5"
    )}>
      <div className="w-full flex items-center justify-between group">
        <button 
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105",
            isDark ? "bg-zinc-100" : "bg-zinc-900"
          )}>
            <Info className={cn("w-6 h-6", isDark ? "text-zinc-900" : "text-white")} />
          </div>
          <div>
            <h3 className={cn("font-extrabold text-xl tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>{t.insight}</h3>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">{symbol} Profile</p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAi}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest",
              isAiEnabled 
                ? (isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600")
                : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-zinc-100 border-zinc-200 text-zinc-400")
            )}
            title={isAiEnabled ? "Disable AI Insight" : "Enable AI Insight"}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI {isAiEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={onToggle}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
            )}
          >
            <TrendingUp className={cn("w-5 h-5 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {!isAiEnabled ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t.ai_disabled}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{t.ai_disabled_desc}</p>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          ) : data ? (
            <>
              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <Globe className="w-4 h-4 text-rose-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.description}</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  {data.description}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.revenue}</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  {data.revenue}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.competitors}</h4>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(Array.isArray(data.competitors) ? data.competitors : []).map((comp, idx) => (
                    <span key={idx} className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors",
                      isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}>
                      {comp}
                    </span>
                  ))}
                </div>
              </section>

              <section className={cn(
                "p-5 rounded-2xl border-l-4 shadow-sm",
                isDark ? "bg-zinc-800/30 border-amber-500/50" : "bg-amber-50/30 border-amber-500/50"
              )}>
                <div className="flex items-center gap-2.5 mb-3">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.outlook}</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium italic", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  "{data.outlook}"
                </p>
              </section>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 italic">{t.no_data}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
