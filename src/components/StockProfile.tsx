import React from 'react';
import { Info, Globe, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

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
}

export const StockProfile: React.FC<StockProfileProps> = ({ theme, data, loading, symbol, isExpanded, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
      isExpanded ? "p-8" : "p-5"
    )}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105",
            isDark ? "bg-zinc-100" : "bg-zinc-900"
          )}>
            <Info className={cn("w-6 h-6", isDark ? "text-zinc-900" : "text-white")} />
          </div>
          <div className="text-left">
            <h3 className={cn("font-extrabold text-xl tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>Stock Insight</h3>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">{symbol} Profile</p>
          </div>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
        )}>
          <TrendingUp className={cn("w-5 h-5 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {loading ? (
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
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Business Description</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  {data.description}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Revenue & Geography</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  {data.revenue}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Competitors</h4>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {data.competitors.map((comp, idx) => (
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
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Management Outlook</h4>
                </div>
                <p className={cn("text-sm leading-relaxed font-medium italic", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  "{data.outlook}"
                </p>
              </section>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 italic">No profile data available for this symbol.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
