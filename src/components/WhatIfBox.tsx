import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Calendar, ArrowUpRight, Info } from 'lucide-react';
import { SimulationResult, ScenarioResult } from '../services/simulationService';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.whatif;

interface WhatIfBoxProps {
  result: SimulationResult;
  currency?: string;
  interval: string;
  theme?: 'light' | 'dark';
  layout?: 'vertical' | 'horizontal';
  isExpanded?: boolean;
  onToggle?: () => void;
}

const ScenarioCard = ({ 
  title, 
  description, 
  result, 
  currency,
  isDark,
  layout = 'vertical'
}: { 
  title: string; 
  description: string; 
  result: ScenarioResult; 
  currency?: string;
  isDark: boolean;
  layout?: 'vertical' | 'horizontal';
}) => {
  if (!result.found) return null;
  const isProfit = result.profitPercent >= 0;

  return (
    <div className={cn("space-y-4", layout === 'horizontal' && "flex-1 min-w-[300px]")}>
      <div className="flex flex-col gap-1.5">
        <h4 className={cn("text-base font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>{title}</h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium italic">{description}</p>
      </div>

      <div className={cn(
        "p-5 rounded-2xl border transition-all",
        isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-100"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-zinc-500">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">{t.entry_date}</span>
          </div>
          <span className={cn("text-base font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {format(new Date(result.entryDate), 'dd MMM yyyy')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{t.entry_price}</span>
          <span className={cn("text-base font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {formatCurrency(result.entryPrice, currency)}
          </span>
        </div>
      </div>

      <div className={cn(
        "p-6 rounded-2xl border flex flex-col items-center justify-center text-center shadow-sm",
        isProfit 
          ? (isDark ? "bg-emerald-900/20 border-emerald-900/30" : "bg-emerald-50 border-emerald-100") 
          : (isDark ? "bg-rose-900/20 border-rose-900/30" : "bg-rose-50 border-rose-100")
      )}>
        <p className={cn(
          "text-[11px] font-black uppercase tracking-[0.2em] mb-2",
          isProfit ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-rose-400" : "text-rose-600")
        )}>
          {t.current_result}
        </p>
        <div className="flex items-center gap-3 mb-2">
          {isProfit ? <TrendingUp className={cn("w-6 h-6", isDark ? "text-emerald-400" : "text-emerald-600")} /> : <TrendingDown className={cn("w-6 h-6", isDark ? "text-rose-400" : "text-rose-600")} />}
          <span className={cn(
            "text-5xl font-black tracking-tighter",
            isProfit ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-rose-400" : "text-rose-700")
          )}>
            {isProfit ? '+' : ''}{result.profitPercent.toFixed(2)}%
          </span>
        </div>
        <p className={cn(
          "text-[11px] font-black uppercase tracking-widest",
          isProfit ? (isDark ? "text-emerald-500" : "text-emerald-500") : (isDark ? "text-rose-500" : "text-rose-500")
        )}>
          {result.daysHeld} {t.days_held}
        </p>
      </div>
    </div>
  );
};

export const WhatIfBox: React.FC<WhatIfBoxProps> = ({ 
  result, 
  currency, 
  interval, 
  theme, 
  layout = 'vertical',
  isExpanded = true,
  onToggle
}) => {
  const isDark = theme === 'dark';

  if (interval !== '1d' && interval !== '1wk') {
    return (
      <div className={cn(
        "rounded-3xl border p-8 transition-colors duration-300 shadow-sm",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
      )}>
        <div className="flex items-center gap-3 text-zinc-400 mb-3">
          <HelpCircle className="w-5 h-5" />
          <h3 className="text-xs font-black uppercase tracking-widest">{t.title}</h3>
        </div>
        <p className="text-xs text-zinc-400 font-bold italic leading-relaxed">
          {t.not_available}
        </p>
      </div>
    );
  }

  if (!result.found) {
    return (
      <div className={cn(
        "rounded-3xl border p-8 transition-colors duration-300 shadow-sm",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
      )}>
        <div className={cn("flex items-center gap-3 mb-4", isDark ? "text-zinc-100" : "text-zinc-900")}>
          <HelpCircle className="w-5 h-5" />
          <h3 className="text-xs font-black uppercase tracking-widest">{t.title}</h3>
        </div>
        <p className="text-xs text-zinc-500 font-bold leading-relaxed">
          {t.no_cross}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-3xl border shadow-sm overflow-hidden relative transition-all duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
      isExpanded ? "p-8" : "p-5"
    )}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between group relative z-20"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105",
            isDark ? "bg-zinc-100" : "bg-zinc-900"
          )}>
            <ArrowUpRight className={cn("w-6 h-6", isDark ? "text-zinc-900" : "text-white")} />
          </div>
          <div className="text-left">
            <h3 className={cn("font-extrabold text-xl tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>{t.title}</h3>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">{t.comparison}</p>
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
        <div className="mt-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <HelpCircle className={cn("w-32 h-32", isDark ? "text-zinc-100" : "text-zinc-900")} />
          </div>

          <div className={cn(
            "flex flex-col gap-10",
            layout === 'horizontal' ? "lg:flex-row" : ""
          )}>
            <ScenarioCard 
              title={t.strategy_a}
              description={t.strategy_a_desc}
              result={result.scenario1}
              currency={currency}
              isDark={isDark}
              layout={layout}
            />

            {layout === 'vertical' && <div className={cn("h-px", isDark ? "bg-zinc-800" : "bg-zinc-100")} />}
            {layout === 'horizontal' && <div className={cn("hidden lg:block w-px", isDark ? "bg-zinc-800" : "bg-zinc-100")} />}

            <ScenarioCard 
              title={t.strategy_b}
              description={t.strategy_b_desc}
              result={result.scenario2}
              currency={currency}
              isDark={isDark}
              layout={layout}
            />

            <div className={cn(
              "rounded-2xl p-6 self-start", 
              isDark ? "bg-zinc-800" : "bg-zinc-900",
              layout === 'horizontal' ? "lg:w-1/3 min-w-[250px]" : "w-full"
            )}>
              <div className="flex items-center gap-3 mb-3 text-zinc-400">
                <Info className="w-4 h-4" />
                <p className="text-xs font-black uppercase tracking-widest">{t.methodology}</p>
              </div>
              <div className="space-y-4 text-xs leading-relaxed">
                <p className="text-zinc-300 font-medium">
                  <span className="font-black text-rose-500">Golden Cross:</span> {t.golden_cross_desc}
                </p>
                <p className="text-zinc-300 border-t border-white/10 pt-4 font-medium">
                  <span className="font-black text-rose-500">Death Cross Simulation:</span> {t.death_cross_desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
