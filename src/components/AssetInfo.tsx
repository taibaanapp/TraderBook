import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Clock, Calendar } from 'lucide-react';
import { getFlag, formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.asset;

interface AssetInfoProps {
  symbol: string;
  name?: string;
  sector?: string;
  latestPrice: number;
  priceChange: number;
  percentChange: number;
  currency: string;
  interval: string;
  theme?: 'light' | 'dark';
}

export const AssetInfo: React.FC<AssetInfoProps> = ({
  symbol,
  latestPrice,
  priceChange,
  percentChange,
  currency,
  interval,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded-2xl border p-6 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">{getFlag(symbol)}</div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.market_data}</span>
            <ChevronRight className="w-3 h-3 text-zinc-300" />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-zinc-100" : "text-zinc-900")}>{symbol}</span>
          </div>
          <div className="flex items-center gap-4">
            <h2 className={cn("text-4xl font-black tracking-tighter", isDark ? "text-zinc-100" : "text-zinc-900")}>{symbol}</h2>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{formatCurrency(latestPrice, currency)}</span>
              <span className={cn(
                "text-sm font-bold flex items-center gap-1",
                percentChange >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn("flex gap-8 border-l pl-8", isDark ? "border-zinc-800" : "border-zinc-100")}>
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{t.interval}</p>
          <p className={cn("text-sm font-bold flex items-center gap-1.5", isDark ? "text-zinc-300" : "text-zinc-700")}>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {interval === '1h' ? t.hourly : interval === '1d' ? t.daily : t.weekly}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{t.since}</p>
          <p className={cn("text-sm font-bold flex items-center gap-1.5", isDark ? "text-zinc-300" : "text-zinc-700")}>
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            {interval === '1h' ? t.last_2_years : t.jan_1_2020}
          </p>
        </div>
      </div>
    </div>
  );
};
