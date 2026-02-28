import React from 'react';
import { Clock, BarChart2, Activity, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { StockData } from '../types';

interface MarketDetailsProps {
  data: StockData | null;
  latestData: StockData | null;
  currency?: string;
}

export const MarketDetails: React.FC<MarketDetailsProps> = ({ data, latestData, currency }) => {
  const displayData = data || latestData;

  if (!displayData) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-900" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Market Details</h3>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
          data ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
        )}>
          {data ? 'Live' : 'Latest'}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Price Section */}
        <div>
          <p className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Current Price</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(displayData.close, currency)}
            </span>
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              displayData.close >= displayData.open ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {((displayData.close - displayData.open) / displayData.open * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* OHLC Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Open</p>
            <p className="text-sm font-bold text-zinc-700">{displayData.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 mb-1">High</p>
            <p className="text-sm font-bold text-zinc-700">{displayData.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Low</p>
            <p className="text-sm font-bold text-zinc-700">{displayData.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Close</p>
            <p className="text-sm font-bold text-zinc-700">{displayData.close.toFixed(2)}</p>
          </div>
        </div>

        {/* Technicals */}
        <div className="space-y-3 pt-4 border-t border-zinc-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] uppercase font-bold text-zinc-400">Volume</span>
            </div>
            <span className="text-xs font-bold text-zinc-700">{(displayData.volume / 1000000).toFixed(2)}M</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] uppercase font-bold text-zinc-400">VWAP</span>
            </div>
            <span className="text-xs font-bold text-amber-600">{displayData.vwap ? displayData.vwap.toFixed(2) : '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] uppercase font-bold text-zinc-400">Money Flow</span>
            </div>
            <span className={cn(
              "text-xs font-black px-2 py-0.5 rounded",
              displayData.finalScore >= 50 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {displayData.finalScore?.toFixed(1) || '-'}
            </span>
          </div>
        </div>

        {/* Date Footer */}
        <div className="pt-4 border-t border-zinc-50 flex items-center gap-2">
          <Calendar className="w-3 h-3 text-zinc-300" />
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
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
