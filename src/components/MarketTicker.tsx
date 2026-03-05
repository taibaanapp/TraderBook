import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timezone: string; // e.g. "Asia/Bangkok"
  openHour: number; // 0-23
  closeHour: number; // 0-23
}

const INDICES: MarketIndex[] = [
  { symbol: 'SET', name: 'SET Index', price: 1382.51, change: 5.21, changePercent: 0.38, timezone: 'Asia/Bangkok', openHour: 10, closeHour: 17 },
  { symbol: 'DJI', name: 'Dow Jones', price: 38996.39, change: -97.55, changePercent: -0.25, timezone: 'America/New_York', openHour: 9, closeHour: 16 },
  { symbol: 'SPX', name: 'S&P 500', price: 5096.27, change: 26.51, changePercent: 0.52, timezone: 'America/New_York', openHour: 9, closeHour: 16 },
  { symbol: 'IXIC', name: 'Nasdaq', price: 16091.92, change: 183.02, changePercent: 1.15, timezone: 'America/New_York', openHour: 9, closeHour: 16 },
  { symbol: 'FTSE', name: 'FTSE 100', price: 7630.02, change: 5.21, changePercent: 0.07, timezone: 'Europe/London', openHour: 8, closeHour: 16 },
  { symbol: 'N225', name: 'Nikkei 225', price: 39910.82, change: 744.63, changePercent: 1.90, timezone: 'Asia/Tokyo', openHour: 9, closeHour: 15 },
  { symbol: 'HSI', name: 'Hang Seng', price: 16589.44, change: 78.00, changePercent: 0.47, timezone: 'Asia/Hong_Kong', openHour: 9, closeHour: 16 },
  { symbol: 'GOLD', name: 'Gold Price', price: 2082.90, change: 38.50, changePercent: 1.88, timezone: 'UTC', openHour: 0, closeHour: 24 },
  { symbol: 'USDTHB', name: 'USD/THB', price: 35.82, change: -0.05, changePercent: -0.14, timezone: 'Asia/Bangkok', openHour: 0, closeHour: 24 },
  { symbol: 'OIL', name: 'Crude Oil', price: 79.97, change: 1.71, changePercent: 2.19, timezone: 'UTC', openHour: 0, closeHour: 24 },
];

export const MarketTicker: React.FC<{ 
  theme?: 'light' | 'dark';
  onSelect?: (symbol: string) => void;
}> = ({ theme = 'dark', onSelect }) => {
  const [data, setData] = useState(INDICES);

  const fetchMarketData = async () => {
    try {
      const results = await Promise.all(INDICES.map(async (item) => {
        try {
          const res = await fetch(`/api/stock/${item.symbol}?interval=1d`);
          if (res.ok) {
            const stock = await res.json();
            const last = stock.data[stock.data.length - 1];
            const prev = stock.data[stock.data.length - 2];
            const change = last.close - prev.close;
            return {
              ...item,
              price: last.close,
              change: change,
              changePercent: (change / prev.close) * 100
            };
          }
        } catch (e) {
          console.error(`Failed to fetch ${item.symbol}`, e);
        }
        return item;
      }));
      setData(results);
    } catch (err) {
      console.error('Failed to fetch market data', err);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const refreshInterval = setInterval(fetchMarketData, 15 * 60 * 1000); // 15 minutes
    
    const simInterval = setInterval(() => {
      setData(prev => prev.map(item => {
        const volatility = 0.0001;
        const move = item.price * (Math.random() - 0.5) * volatility;
        const newPrice = item.price + move;
        const newChange = item.change + move;
        return {
          ...item,
          price: newPrice,
          change: newChange,
          changePercent: (newChange / (newPrice - newChange)) * 100
        };
      }));
    }, 5000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(simInterval);
    };
  }, []);

  const isMarketOpen = (index: MarketIndex) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: index.timezone,
        hour: 'numeric',
        hour12: false,
        weekday: 'long'
      });
      const parts = formatter.formatToParts(now);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const weekday = parts.find(p => p.type === 'weekday')?.value || '';

      // Weekend check
      if (weekday === 'Saturday' || weekday === 'Sunday') return false;
      
      // 24/7 markets
      if (index.openHour === 0 && index.closeHour === 24) return true;

      return hour >= index.openHour && hour < index.closeHour;
    } catch (e) {
      return true;
    }
  };

  return (
    <div className={cn(
      "w-full h-10 border-b overflow-hidden flex items-center relative z-40",
      theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
    )}>
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-inherit to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-inherit to-transparent pointer-events-none" />
      
      <div className="flex whitespace-nowrap animate-marquee hover:pause">
        {[...data, ...data].map((item, idx) => {
          const isOpen = isMarketOpen(item);
          const isPositive = item.change >= 0;
          
          return (
            <div 
              key={`${item.symbol}-${idx}`} 
              onClick={() => onSelect?.(item.symbol)}
              className="flex items-center px-6 gap-3 group cursor-pointer hover:bg-white/5 transition-colors h-10"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOpen ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500"
                )} />
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-wider group-hover:text-emerald-400 transition-colors",
                  theme === 'dark' ? "text-zinc-400" : "text-zinc-500"
                )}>
                  {item.symbol}
                </span>
              </div>
              
              <span className={cn(
                "text-xs font-mono font-bold",
                theme === 'dark' ? "text-zinc-100" : "text-zinc-900"
              )}>
                {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(item.change).toFixed(2)}</span>
                <span className="opacity-80">({Math.abs(item.changePercent).toFixed(2)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
