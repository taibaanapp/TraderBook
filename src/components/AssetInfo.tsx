import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Clock, Calendar } from 'lucide-react';
import { getFlag, formatCurrency } from '../utils/formatters';
import { StockData } from '../types';

interface AssetInfoProps {
  symbol: string;
  name?: string;
  sector?: string;
  latestPrice: number;
  priceChange: number;
  percentChange: number;
  currency: string;
  interval: string;
}

export const AssetInfo: React.FC<AssetInfoProps> = ({
  symbol,
  name,
  sector,
  latestPrice,
  priceChange,
  percentChange,
  currency,
  interval
}) => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-wrap items-end justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-5xl">{getFlag(symbol)}</div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Market Data</span>
            <ChevronRight className="w-3 h-3 text-zinc-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">{symbol}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <div className="flex flex-col">
              <h2 className="text-4xl font-black tracking-tighter">{symbol}</h2>
              {name && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-zinc-600">{name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded font-bold uppercase tracking-wider">{sector}</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatCurrency(latestPrice, currency)}</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${priceChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(priceChange).toFixed(2)} ({percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-8 border-l border-zinc-100 pl-8">
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Interval</p>
          <p className="text-sm font-bold flex items-center gap-1.5 text-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {interval === '1h' ? 'Hourly' : interval === '1d' ? 'Daily' : 'Weekly'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Since</p>
          <p className="text-sm font-bold flex items-center gap-1.5 text-zinc-700">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            {interval === '1h' ? 'Last 2 Years' : 'Jan 1, 2020'}
          </p>
        </div>
      </div>
    </div>
  );
};
