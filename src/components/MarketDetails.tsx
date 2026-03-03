import React from 'react';
import { Clock, BarChart2, Activity, TrendingUp, Calendar, Building2, Globe } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { StockData, ApiResponse } from '../types';

interface MarketDetailsProps {
  symbol: string;
  data: ApiResponse | null;
  hoveredData: StockData | null;
  theme?: 'light' | 'dark';
}

export const MarketDetails: React.FC<MarketDetailsProps> = ({ symbol, data, hoveredData, theme }) => {
  const latestData = data?.data[data.data.length - 1];
  const displayData = hoveredData || latestData;
  const isDark = theme === 'dark';

  const avgVolume15 = React.useMemo(() => {
    if (!data?.data || data.data.length < 16) return 0;
    const startIndex = data.data.length - 16;
    const slice = data.data.slice(startIndex, data.data.length - 1);
    return slice.reduce((sum, d) => sum + d.volume, 0) / 15;
  }, [data]);

  const getMarketStatus = () => {
    const now = new Date();
    const isThai = symbol.endsWith('.BK');
    
    if (isThai) {
      // SET Market (GMT+7)
      const thaiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
      const hours = thaiTime.getHours();
      const minutes = thaiTime.getMinutes();
      const time = hours * 60 + minutes;
      const day = thaiTime.getDay();
      
      if (day === 0 || day === 6) return 'Closed';
      if ((time >= 600 && time <= 750) || (time >= 870 && time <= 990)) return 'Open';
      return 'Closed';
    } else {
      // US Market (EST)
      const usTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hours = usTime.getHours();
      const minutes = usTime.getMinutes();
      const time = hours * 60 + minutes;
      const day = usTime.getDay();
      
      if (day === 0 || day === 6) return 'Closed';
      if (time >= 570 && time <= 960) return 'Open';
      return 'Closed';
    }
  };

  const marketStatus = getMarketStatus();

  if (!displayData) return null;

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden transition-colors duration-300 shadow-sm hover:shadow-md",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className={cn(
        "p-5 border-b flex items-center justify-between",
        isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50/50 border-zinc-100"
      )}>
        <div className="flex items-center gap-2.5">
          <Activity className={cn("w-5 h-5", isDark ? "text-zinc-100" : "text-zinc-900")} />
          <h3 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-100" : "text-zinc-900")}>Market Data</h3>
        </div>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2",
            marketStatus === 'Open'
              ? (isDark ? "bg-emerald-900/20 text-emerald-400 border border-emerald-900/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200")
              : (isDark ? "bg-zinc-800 text-zinc-500 border border-zinc-700" : "bg-zinc-100 text-zinc-400 border border-zinc-200")
          )}>
            <div className={cn("w-2 h-2 rounded-full", marketStatus === 'Open' ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
            {marketStatus}
          </div>
          <div className={cn(
            "px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest",
            hoveredData 
              ? (isDark ? "bg-amber-900/20 text-amber-400 border border-amber-900/30" : "bg-amber-100 text-amber-700 border border-amber-200") 
              : (isDark ? "bg-emerald-900/20 text-emerald-400 border border-emerald-900/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200")
          )}>
            {hoveredData ? 'Point' : 'Latest'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Asset Info */}
        <div className="space-y-3">
          <h2 className={cn("text-3xl font-black tracking-tight leading-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {data?.shortName || symbol}
          </h2>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                {data?.industry || 'General Industry'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Ind. P/E: <span className={isDark ? "text-zinc-100" : "text-zinc-900"}>18.5x</span>
              </span>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] uppercase font-black text-zinc-400 mb-3 tracking-[0.2em]">Current Price</p>
          <div className="flex items-baseline gap-4">
            <span className={cn("text-5xl font-black tracking-tighter", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {formatCurrency(displayData.close, data?.currency)}
            </span>
            <span className={cn(
              "text-base font-black px-3 py-1 rounded-xl shadow-sm",
              displayData.close >= displayData.open 
                ? (isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100") 
                : (isDark ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-rose-50 text-rose-600 border border-rose-100")
            )}>
              {displayData.close >= displayData.open ? '+' : ''}{((displayData.close - displayData.open) / displayData.open * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* OHLC Grid */}
        <div className={cn("grid grid-cols-2 gap-6 pt-6 border-t", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <div>
            <p className="text-xs uppercase font-black text-zinc-400 mb-1.5 tracking-widest">Open</p>
            <p className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-black text-zinc-400 mb-1.5 tracking-widest">High</p>
            <p className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-black text-zinc-400 mb-1.5 tracking-widest">Low</p>
            <p className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-black text-zinc-400 mb-1.5 tracking-widest">Close</p>
            <p className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{displayData.close.toFixed(2)}</p>
          </div>
        </div>

        {/* Technicals */}
        <div className={cn("space-y-4 pt-6 border-t", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-zinc-400" />
              <span className="text-xs uppercase font-black text-zinc-400 tracking-widest">Volume</span>
            </div>
            <span className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{(displayData.volume / 1000000).toFixed(2)}M</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs uppercase font-black text-zinc-400 tracking-widest">Avg Vol (15)</span>
            </div>
            <span className={cn("text-base font-bold", isDark ? "text-zinc-300" : "text-zinc-700")}>{(avgVolume15 / 1000000).toFixed(2)}M</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <span className="text-xs uppercase font-black text-zinc-400 tracking-widest">VWAP</span>
            </div>
            <span className="text-base font-bold text-amber-500">{displayData.vwap ? displayData.vwap.toFixed(2) : '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-zinc-400" />
              <span className="text-xs uppercase font-black text-zinc-400 tracking-widest">Money Flow</span>
            </div>
            <span className={cn(
              "text-sm font-black px-3 py-1 rounded-lg",
              displayData.finalScore >= 50 
                ? (isDark ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600") 
                : (isDark ? "bg-rose-900/20 text-rose-400" : "bg-rose-50 text-rose-600")
            )}>
              {displayData.finalScore?.toFixed(1) || '-'}
            </span>
          </div>
        </div>

        {/* Date Footer */}
        <div className={cn("pt-6 border-t flex items-center gap-3", isDark ? "border-zinc-800" : "border-zinc-50")}>
          <Calendar className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {new Date(displayData.date).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric',
              hour: displayData.date.includes('T') ? '2-digit' : undefined,
              minute: displayData.date.includes('T') ? '2-digit' : undefined
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
