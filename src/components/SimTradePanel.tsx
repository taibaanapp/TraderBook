import React, { useState } from 'react';
import { StockData } from '../types';
import { runSimulation, SimParams, SimResult } from '../lib/engine';
import { KPICard } from './KPICard';
import { EquityChart } from './EquityChart';
import { AIAnalysis } from './AIAnalysis';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { TradeTable } from './TradeTable';
import { Play, TrendingUp, Target, RefreshCw, X, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.simtrade;

interface SimTradePanelProps {
  symbol: string;
  interval: string;
  data: StockData[];
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
  theme: 'light' | 'dark';
  isStandalone?: boolean;
}

export function SimTradePanel({ symbol, interval, data, loading: dataLoading, error: dataError, onClose, theme, isStandalone = false }: SimTradePanelProps) {
  const [initialCapital, setInitialCapital] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const isSupportedInterval = interval === '1d' || interval === '1wk';

  const baseParams: SimParams = {
    initialCapital,
    fastEmaPeriod: 20,
    slowEmaPeriod: 50,
    atrPeriod: 14,
    atrMultiplierSL: 2,
    riskPerTradePercent: 2,
  };

  const handleRunSimulation = () => {
    if (!isSupportedInterval || !data || data.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      const simResult = runSimulation(data, baseParams);
      setResult(simResult);
      setLoading(false);
    }, 500);
  };

  const containerClasses = isStandalone 
    ? cn("min-h-screen flex flex-col w-full", theme === 'dark' ? "bg-zinc-950 text-zinc-100" : "bg-gray-50 text-gray-900")
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";

  const panelClasses = isStandalone
    ? "flex-1 flex flex-col"
    : cn(
        "rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col",
        theme === 'dark' ? "bg-zinc-900 text-zinc-100" : "bg-white text-gray-900"
      );

  return (
    <div className={containerClasses}>
      <div className={panelClasses}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          theme === 'dark' ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"
        )}>
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <RefreshCw className={cn("w-6 h-6 text-indigo-500", (loading || dataLoading) && "animate-spin")} />
              {t.title} <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 ml-2 uppercase tracking-widest">{t.performance_tuned}</span>
            </h2>
            <p className={cn("text-sm", theme === 'dark' ? "text-zinc-400" : "text-gray-500")}>
              {t.subtitle.replace('{symbol}', symbol).replace('{interval}', interval)}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className={cn(
              "p-2 rounded-full transition-colors",
              theme === 'dark' ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500"
            )}>
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto p-6",
          theme === 'dark' ? "bg-zinc-950" : "bg-gray-50"
        )}>
          {dataError ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-lg font-bold text-red-500">{t.error_loading}</p>
                <p className="text-sm opacity-60">{dataError}</p>
             </div>
          ) : (dataLoading || !data || data.length === 0) ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <RefreshCw className="w-12 h-12 text-zinc-700 animate-spin mb-4" />
                <p className="text-lg font-medium">{t.loading_data}</p>
                <p className="text-sm opacity-60">{t.loading_desc}</p>
             </div>
          ) : !isSupportedInterval ? (
            <div className={cn(
              "p-4 rounded-lg flex flex-col items-center justify-center h-48 border",
              theme === 'dark' ? "bg-amber-900/20 border-amber-900/50 text-amber-500" : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              <p className="font-medium text-lg mb-2">{t.unsupported_timeframe}</p>
              <p>{t.unsupported_desc}</p>
              <p className="text-sm mt-2 opacity-80">{t.change_interval}</p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className={cn(
                "p-6 rounded-xl border shadow-sm mb-8 flex flex-wrap items-end gap-6",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
              )}>
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    theme === 'dark' ? "text-zinc-300" : "text-gray-700"
                  )}>{t.initial_capital}</label>
                  <input 
                    type="number" 
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className={cn(
                      "w-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-gray-300"
                    )}
                    min="1000"
                    step="1000"
                  />
                </div>
                <button 
                  onClick={handleRunSimulation}
                  disabled={loading}
                  className="h-[42px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {loading ? t.simulating : t.run_sim}
                </button>
              </div>

              {/* Results */}
              {result && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* KPI Grid */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-500" />
                      {t.performance_metrics}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <KPICard 
                        title={t.net_profit} 
                        value={`${result.kpis.netProfitPercent > 0 ? '+' : ''}${result.kpis.netProfitPercent.toFixed(2)}%`} 
                        description={`$${result.kpis.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        trend={result.kpis.netProfitPercent > 0 ? 'up' : 'down'}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.win_rate} 
                        value={`${result.kpis.winRate.toFixed(1)}%`} 
                        description={t.wins_total.replace('{wins}', result.trades.filter(t => t.pnl! > 0).length.toString()).replace('{total}', result.trades.filter(t => t.status === 'CLOSED').length.toString())}
                        trend={result.kpis.winRate > 40 ? 'up' : 'neutral'}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.max_drawdown} 
                        value={`${result.kpis.maxDrawdown.toFixed(2)}%`} 
                        description={t.peak_to_trough}
                        trend="down"
                        theme={theme}
                      />
                      <KPICard 
                        title={t.profit_factor} 
                        value={result.kpis.profitFactor.toFixed(2)} 
                        description={t.gross_profit_loss}
                        trend={result.kpis.profitFactor > 1.5 ? 'up' : 'neutral'}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.risk_reward} 
                        value={result.kpis.riskRewardRatio.toFixed(2)} 
                        description={t.avg_win_loss}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.expectancy} 
                        value={`$${result.kpis.expectancy.toFixed(2)}`} 
                        description={t.expected_return}
                        trend={result.kpis.expectancy > 0 ? 'up' : 'down'}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.recovery_factor} 
                        value={result.kpis.recoveryFactor.toFixed(2)} 
                        description={t.profit_drawdown}
                        theme={theme}
                      />
                      <KPICard 
                        title={t.ulcer_index} 
                        value={result.kpis.ulcerIndex.toFixed(2)} 
                        description={t.drawdown_depth}
                        theme={theme}
                      />
                    </div>
                  </div>

                  {/* Equity Curve */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      {t.equity_curve}
                    </h3>
                    <EquityChart data={result.equityCurve} theme={theme} />
                  </div>

                  {/* AI Analysis */}
                  <AIAnalysis symbol={symbol} timeframe={interval} kpis={result.kpis} theme={theme} />

                  {/* Sensitivity Analysis */}
                  <SensitivityAnalysis candles={data} baseParams={baseParams} theme={theme} />

                  {/* Trade History */}
                  <TradeTable trades={result.trades} theme={theme} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
