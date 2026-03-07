import React, { useState } from 'react';
import { runSimulation, SimParams, SimResult } from '../lib/engine';
import { StockData } from '../types';
import { Settings2, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.sensitivity;

interface SensitivityAnalysisProps {
  candles: StockData[];
  baseParams: SimParams;
  theme?: 'light' | 'dark';
}

export function SensitivityAnalysis({ candles, baseParams, theme = 'light' }: SensitivityAnalysisProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRun = () => {
    setLoading(true);
    setTimeout(() => {
      const variations = [
        { fast: 10, slow: 50 },
        { fast: 20, slow: 50 },
        { fast: 20, slow: 60 },
        { fast: 10, slow: 60 },
        { fast: 50, slow: 200 },
      ];

      const newResults = variations.map(v => {
        const params = { ...baseParams, fastEmaPeriod: v.fast, slowEmaPeriod: v.slow };
        const sim = runSimulation(candles, params);
        return {
          fast: v.fast,
          slow: v.slow,
          netProfit: sim.kpis.netProfitPercent,
          winRate: sim.kpis.winRate,
          mdd: sim.kpis.maxDrawdown
        };
      });

      setResults(newResults);
      setLoading(false);
    }, 500);
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border shadow-sm mt-6",
      theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className={cn("w-5 h-5", theme === 'dark' ? "text-zinc-400" : "text-gray-600")} />
          <h2 className={cn("text-lg font-semibold", theme === 'dark' ? "text-zinc-100" : "text-gray-900")}>{t.title}</h2>
        </div>
        {!results.length && !loading && (
          <button
            onClick={handleRun}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              theme === 'dark' ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {t.test_variations}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className={cn("w-6 h-6 animate-spin", theme === 'dark' ? "text-zinc-500" : "text-gray-400")} />
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className={cn("w-full text-sm text-left", theme === 'dark' ? "text-zinc-400" : "text-gray-500")}>
            <thead className={cn("text-xs uppercase", theme === 'dark' ? "text-zinc-300 bg-zinc-800/50" : "text-gray-700 bg-gray-50")}>
              <tr>
                <th className="px-4 py-3">{t.fast_ema}</th>
                <th className="px-4 py-3">{t.slow_ema}</th>
                <th className="px-4 py-3">{t.net_profit}</th>
                <th className="px-4 py-3">{t.win_rate}</th>
                <th className="px-4 py-3">{t.max_drawdown}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={cn("border-b", theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50" : "bg-white border-gray-200 hover:bg-gray-50")}>
                  <td className={cn("px-4 py-3 font-medium", theme === 'dark' ? "text-zinc-100" : "text-gray-900")}>{r.fast}</td>
                  <td className="px-4 py-3">{r.slow}</td>
                  <td className={cn("px-4 py-3 font-medium", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>{r.netProfit.toFixed(2)}%</td>
                  <td className="px-4 py-3">{r.winRate.toFixed(2)}%</td>
                  <td className={cn("px-4 py-3", theme === 'dark' ? "text-red-400" : "text-red-600")}>{r.mdd.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
