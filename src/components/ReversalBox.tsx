import React, { useEffect, useState } from 'react';
import { Activity, Target, ShieldAlert, CheckCircle2, XCircle, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { ReversalAnalysis } from '../services/reversalService';
import { formatCurrency } from '../utils/formatters';

interface ReversalBoxProps {
  symbol: string;
  analysis: ReversalAnalysis | null;
  currentPrice: number;
  currency?: string;
  theme?: 'light' | 'dark';
}

export const ReversalBox: React.FC<ReversalBoxProps> = ({ symbol, analysis, currentPrice, currency, theme }) => {
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const lastSavedRef = React.useRef<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (analysis && analysis.score >= 60) {
      const todayId = `${symbol}-${new Date().toISOString().split('T')[0]}`;
      if (lastSavedRef.current !== todayId) {
        savePrediction();
        lastSavedRef.current = todayId;
      }
    }
  }, [analysis?.score, symbol]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reversal/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const savePrediction = async () => {
    try {
      const response = await fetch('/api/reversal/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `${symbol}-${new Date().toISOString().split('T')[0]}`,
          symbol,
          date: new Date().toISOString().split('T')[0],
          price: currentPrice,
          score: analysis?.score,
          reasons: analysis?.reasons,
          stopLoss: analysis?.stopLoss
        })
      });
      if (response.ok) {
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to save prediction', error);
    }
  };

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (score >= 60) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-zinc-400' : 'text-zinc-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return isDark ? 'bg-emerald-900/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100';
    if (score >= 60) return isDark ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100';
    return isDark ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100';
  };

  return (
    <div className={cn(
      "rounded-3xl border shadow-sm overflow-hidden transition-all duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
      isExpanded ? "p-8" : "p-5"
    )}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group relative z-20"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105",
            isDark ? "bg-zinc-100" : "bg-zinc-900"
          )}>
            <Activity className={cn("w-6 h-6", isDark ? "text-zinc-900" : "text-white")} />
          </div>
          <div className="text-left">
            <h3 className={cn("font-extrabold text-xl tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>Reversal Analysis</h3>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">EOD Signal</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Card */}
            <div className={cn("p-6 rounded-2xl border flex flex-col items-center justify-center text-center", getScoreBg(analysis.score))}>
              <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-2", getScoreColor(analysis.score))}>
                Reversal Probability
              </p>
              <div className="flex items-center gap-3 mb-2">
                <Target className={cn("w-8 h-8", getScoreColor(analysis.score))} />
                <span className={cn("text-6xl font-black tracking-tighter", getScoreColor(analysis.score))}>
                  {analysis.score}%
                </span>
              </div>
              {analysis.score >= 60 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">
                  Signal Logged to Database
                </p>
              )}
            </div>

            {/* Stop Loss Card */}
            <div className={cn(
              "p-6 rounded-2xl border flex flex-col justify-center",
              isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h4 className={cn("text-sm font-black uppercase tracking-widest", isDark ? "text-zinc-300" : "text-zinc-700")}>Technical Stop Loss</h4>
              </div>
              <p className={cn("text-4xl font-black tracking-tighter mb-2", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {formatCurrency(analysis.stopLoss, currency)}
              </p>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Based on recent local low (-1%)
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-400" : "text-zinc-500")}>
                Reversal Indicators ({analysis.conditions?.filter(c => c.passed).length || 0}/{analysis.conditions?.length || 0})
              </h4>
            </div>
            <div className="space-y-3">
              {analysis.conditions && analysis.conditions.length > 0 ? (
                analysis.conditions.map((condition, idx) => (
                  <div key={idx} className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                    condition.passed 
                      ? (isDark ? "bg-emerald-900/10 border-emerald-900/30" : "bg-emerald-50/50 border-emerald-100")
                      : (isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100")
                  )}>
                    {condition.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-bold", 
                          condition.passed 
                            ? (isDark ? "text-emerald-400" : "text-emerald-700")
                            : (isDark ? "text-zinc-400" : "text-zinc-600")
                        )}>
                          {condition.name}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                          condition.passed
                            ? (isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600")
                            : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
                        )}>
                          {condition.score} PTS
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs mt-1",
                        condition.passed
                          ? (isDark ? "text-emerald-500/80" : "text-emerald-600/80")
                          : (isDark ? "text-zinc-500" : "text-zinc-500")
                      )}>
                        {condition.reason}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border",
                  isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
                )}>
                  <XCircle className="w-5 h-5 text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium text-zinc-500">No conditions data available.</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Dashboard */}
          {stats.length > 0 && (
            <div className={cn(
              "p-6 rounded-2xl border mt-8",
              isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-200"
            )}>
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h4 className={cn("text-sm font-black uppercase tracking-widest", isDark ? "text-zinc-300" : "text-zinc-700")}>System Accuracy Tracker</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="pb-3 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Score Group</th>
                      <th className="pb-3 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Signals</th>
                      <th className="pb-3 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">5 Days</th>
                      <th className="pb-3 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">10 Days</th>
                      <th className="pb-3 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">20 Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {stats.map((stat, idx) => (
                      <tr key={idx}>
                        <td className={cn("py-3 font-black", isDark ? "text-zinc-300" : "text-zinc-700")}>{stat.scoreGroup}</td>
                        <td className="py-3 font-medium text-zinc-500">{stat.total}</td>
                        <td className="py-3">
                          <span className={cn("font-bold", stat.hits5 / stat.total > 0.5 ? "text-emerald-500" : "text-zinc-500")}>
                            {((stat.hits5 / stat.total) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={cn("font-bold", stat.hits10 / stat.total > 0.5 ? "text-emerald-500" : "text-zinc-500")}>
                            {((stat.hits10 / stat.total) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={cn("font-bold", stat.hits20 / stat.total > 0.5 ? "text-emerald-500" : "text-zinc-500")}>
                            {((stat.hits20 / stat.total) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-zinc-500 mt-4 italic flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Accuracy is calculated based on whether the price was higher than the entry price after X days.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
