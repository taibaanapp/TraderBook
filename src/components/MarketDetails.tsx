import React from 'react';
import { Clock, BarChart2, Activity, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { StockData } from '../types';

interface MarketDetailsProps {
  data: StockData | null;
  latestData: StockData | null;
  currency?: string;
  theme?: 'light' | 'dark';
}

export const MarketDetails: React.FC<MarketDetailsProps> = ({ data, latestData, currency, theme }) => {
  const displayData = data || latestData;
  const isDark = theme === 'dark';

  if (!displayData) return null;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50/50 border-zinc-100"
      )}>
        <div className="flex items-center gap-2">
          <Activity className={cn("w-4 h-4", isDark ? "text-zinc-100" : "text-zinc-900")} />
          <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-zinc-100" : "text-zinc-900")}>CrossVision Market</h3>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
          data 
            ? (isDark ? "bg-amber-900/20 text-amber-400 border border-amber-900/30" : "bg-amber-100 text-amber-700 border border-amber-200") 
            : (isDark ? "bg-emerald-900/20 text-emerald-400 border border-emerald-900/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200")
        )}>
          {data ? 'Live' : 'Latest'}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Price Section */}
        <div>
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Current Price</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {formatCurrency(displayData.close, currency)}
            </span>
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              displayData.close >= displayData.open 
                ? (isDark ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600") 
                : (isDark ? "bg-rose-900/20 text-rose-400" : "bg-rose-50 text-rose-600")
            )}>
              {((displayData.close - displayData.open) / displayData.open * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* OHLC Grid */}
        <div className={cn("grid grid-cols-2 gap-4 pt-4 border-t", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Open</p>
            <p className={cn("text-sm font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">High</p>
            <p className={cn("text-sm font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Low</p>
            <p className={cn("text-sm font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Close</p>
            <p className={cn("text-sm font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.close.toFixed(2)}</p>
          </div>
        </div>

        {/* Technicals */}
        <div className={cn("space-y-3 pt-4 border-t", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Volume</span>
            </div>
            <span className={cn("text-sm font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{(displayData.volume / 1000000).toFixed(2)}M</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">VWAP</span>
            </div>
            <span className="text-sm font-bold text-amber-500">{displayData.vwap ? displayData.vwap.toFixed(2) : '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Money Flow</span>
            </div>
            <span className={cn(
              "text-sm font-black px-2 py-0.5 rounded",
              displayData.finalScore >= 50 
                ? (isDark ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600") 
                : (isDark ? "bg-rose-900/20 text-rose-400" : "bg-rose-50 text-rose-600")
            )}>
              {displayData.finalScore?.toFixed(1) || '-'}
            </span>
          </div>
        </div>

        {/* Date Footer */}
        <div className={cn("pt-4 border-t flex items-center gap-2", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <Calendar className="w-3 h-3 text-zinc-300" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {new Date(displayData.date).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              hour: displayData.date.includes('T') ? '2-digit' : undefined,
              minute: displayData.date.includes('T') ? '2-digit' : undefined
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
