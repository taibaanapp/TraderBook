import React, { useEffect, useState } from 'react';
import { X, Activity, TrendingUp, Calendar, Target } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatters';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.reversal_dashboard;

interface ReversalDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const ReversalDashboard: React.FC<ReversalDashboardProps> = ({ isOpen, onClose, theme }) => {
  const isDark = theme === 'dark';
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPredictions();
    }
  }, [isOpen]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reversal/predictions');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-4xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            )}>
              <Activity className={cn("w-5 h-5", isDark ? "text-zinc-300" : "text-zinc-700")} />
            </div>
            <div>
              <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {t.title}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t.subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((pred, idx) => (
                <div key={idx} className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-4",
                  isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className={cn("text-xl font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                        {pred.symbol}
                      </h3>
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        pred.score >= 80 
                          ? (isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600")
                          : (isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600")
                      )}>
                        {pred.score} PTS
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {pred.date}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t.entry_price}</p>
                      <p className={cn("text-lg font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>
                        {formatCurrency(pred.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t.stop_loss}</p>
                      <p className={cn("text-lg font-bold text-rose-500")}>
                        {formatCurrency(pred.stopLoss)}
                      </p>
                    </div>
                  </div>
                  
                  {pred.reasons && (
                    <div className="mt-2 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t.conditions_met}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {JSON.parse(pred.reasons).map((reason: string, i: number) => (
                          <span key={i} className={cn(
                            "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider",
                            isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600"
                          )}>
                            {reason.replace(/\(\+\d+\)/, '').trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Target className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t.no_signals}</p>
              <p className="text-xs text-zinc-400 mt-2">{t.min_score_desc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
