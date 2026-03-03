import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TH_STOCKS } from '../constants/stockList';

interface TradingViewWidgetProps {
  symbol: string;
  theme: 'light' | 'dark';
  onSymbolChange?: (newSymbol: string) => void;
}

export const mapSymbolToTV = (symbol: string): string => {
  const sym = symbol.toUpperCase().trim();
  if (sym.endsWith('.BK')) {
    return `SET:${sym.replace('.BK', '')}`;
  }
  if (sym.includes(':')) return sym;
  
  // Check if it's a known Thai stock symbol without .BK
  const isThai = TH_STOCKS.some(s => s.symbol.replace('.BK', '') === sym);
  if (isThai) {
    return `SET:${sym}`;
  }
  return sym;
};

export const mapSymbolFromTV = (tvSymbol: string): string => {
  if (tvSymbol.startsWith('SET:')) {
    return `${tvSymbol.replace('SET:', '')}.BK`;
  }
  if (tvSymbol.includes(':')) {
    const parts = tvSymbol.split(':');
    const sym = parts[1];
    // Check if this symbol exists in our TH_STOCKS list
    const isThai = TH_STOCKS.some(s => s.symbol.replace('.BK', '') === sym);
    return isThai ? `${sym}.BK` : sym;
  }
  return tvSymbol;
};

declare const TradingView: any;

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ 
  symbol, 
  theme, 
  onSymbolChange 
}) => {
  const container = useRef<HTMLDivElement>(null);
  const currentSymbolRef = useRef(symbol);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous content
    container.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview_chart';
    widgetContainer.className = 'tradingview-widget-container__widget h-full w-full';
    container.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": mapSymbolToTV(symbol),
      "interval": "D",
      "timezone": "Asia/Bangkok",
      "theme": theme,
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": true,
      "calendar": false,
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "withdateranges": true,
      "details": true,
      "hotlist": true,
      "container_id": "tradingview_chart"
    });

    container.current.appendChild(script);

    const handleMessage = (event: MessageEvent) => {
      // The free widget sometimes sends messages when the symbol changes
      // We try to catch anything that looks like a symbol change
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // TradingView widgets often send messages with a 'name' or 'method'
        if (data && (data.name === 'symbol_change' || data.method === 'symbol_change')) {
          const newTVSymbol = data.data?.symbol || data.params?.symbol;
          if (newTVSymbol) {
            const mapped = mapSymbolFromTV(newTVSymbol);
            currentSymbolRef.current = mapped;
            if (onSymbolChange) onSymbolChange(mapped);
          }
        }
      } catch (e) {
        // Not JSON or not our message
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme, onSymbolChange]);

  return (
    <div className="tradingview-widget-container h-full w-full flex flex-col" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};
