import React, { useMemo, useState } from 'react';
import { Trade } from '../lib/engine';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t_tr = TRANSLATIONS.TH.trading;
const common = TRANSLATIONS.TH.common;

interface TradeTableProps {
  trades: Trade[];
  theme?: 'light' | 'dark';
}

export function TradeTable({ trades, theme = 'light' }: TradeTableProps) {
  const [showAll, setShowAll] = useState(false);
  
  const reversedTrades = useMemo(() => {
    if (!trades) return [];
    return [...trades].reverse();
  }, [trades]);

  const displayedTrades = showAll ? reversedTrades : reversedTrades.slice(0, 20);

  const translateReason = (reason: string | null) => {
    if (!reason) return '-';
    const translations: Record<string, string> = {
      'Trend (EMA) + Breakout (High)': t_tr.reasons.trend_breakout,
      'Stop Loss Hit (ATR)': t_tr.reasons.stop_loss_hit,
      'Trend Reversal (EMA Cross)': t_tr.reasons.trend_reversal,
      'Simulation Ended': t_tr.reasons.sim_ended,
      'Golden Cross': t_tr.golden_cross,
      'Death Cross Simulation': t_tr.death_cross_sim
    };
    return translations[reason] || reason;
  };

  if (!trades || trades.length === 0) return null;

  return (
    <div className={cn(
      "p-6 rounded-xl border shadow-sm mt-6",
      theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-zinc-100" : "text-gray-900")}>{t_tr.history}</h2>
        <span className={cn("text-sm px-3 py-1 rounded-full font-medium", theme === 'dark' ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
          {t_tr.total_trades.replace('{count}', trades.length.toString())}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className={cn("w-full text-base text-left", theme === 'dark' ? "text-zinc-400" : "text-gray-500")}>
          <thead className={cn("text-xs uppercase tracking-wider", theme === 'dark' ? "text-zinc-300 bg-zinc-800/50" : "text-gray-700 bg-gray-50")}>
            <tr>
              <th className="px-4 py-4">{t_tr.date}</th>
              <th className="px-4 py-4">{t_tr.decision_reason}</th>
              <th className="px-4 py-4">{t_tr.price}</th>
              <th className="px-4 py-4">{t_tr.size_risk}</th>
              <th className="px-4 py-4">{t_tr.profit_loss}</th>
              <th className="px-4 py-4">{t_tr.profit_percent}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/10">
            {displayedTrades.map((t, i) => (
              <tr key={i} className={cn("transition-colors", theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50" : "bg-white border-gray-200 hover:bg-gray-50")}>
                <td className="px-4 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={cn("font-bold", theme === 'dark' ? "text-zinc-100" : "text-gray-900")}>{t.entryDate}</span>
                    <span className="text-xs opacity-50">{t_tr.exit} {t.exitDate || t_tr.not_closed}</span>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-xs font-black">BUY</span>
                      <span className="text-sm font-medium">{translateReason(t.entryReason)}</span>
                    </div>
                    {t.exitReason && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-xs font-black">SELL</span>
                        <span className="text-sm opacity-80">{translateReason(t.exitReason)}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{t_tr.entry}: ${t.entryPrice.toFixed(2)}</span>
                    {t.exitPrice && <span className="text-sm opacity-60">{t_tr.exit}: ${t.exitPrice.toFixed(2)}</span>}
                  </div>
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col gap-2">
                    <div className="font-bold text-sm">{t.shares.toLocaleString()} {t_tr.shares}</div>
                    <div className={cn(
                      "text-xs p-3 rounded-lg border leading-relaxed",
                      theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-zinc-400" : "bg-gray-50 border-gray-100 text-gray-500"
                    )}>
                      <div className="flex justify-between mb-1">
                        <span>{t_tr.risk_label}:</span>
                        <span className="font-bold text-zinc-200">${t.riskAmount.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>{t_tr.stop_label}:</span>
                        <span className="font-bold text-zinc-200">${t.stopDistance.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-800/50 text-[10px] italic opacity-60">
                        {t_tr.calculation_note.replace('{percent}', ((t.riskAmount / (t.entryPrice * t.shares + t.riskAmount)) * 100).toFixed(1))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-5">
                  {t.pnl !== null ? (
                    <span className={cn(
                      "text-lg font-black flex items-center gap-1",
                      t.pnl > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {t.pnl > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      ${Math.abs(t.pnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-5">
                  {t.pnlPercent !== null ? (
                    <span className={cn(
                      "text-lg font-black",
                      t.pnlPercent > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reversedTrades.length > 20 && !showAll && (
        <button 
          onClick={() => setShowAll(true)}
          className={cn(
            "w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors rounded-lg",
            theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          )}
        >
          <ChevronDown className="w-4 h-4" />
          {t_tr.show_all.replace('{count}', trades.length.toString())}
        </button>
      )}
    </div>
  );
}
