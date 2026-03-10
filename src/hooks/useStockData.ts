import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { STOCK_LIST, TH_STOCKS, US_STOCKS } from '../constants/stockList';
import { getStockData, saveStockData } from '../services/storageService';
import { ApiResponse, StockData } from '../types';

export function useStockData() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [interval, setChartInterval] = useState('1d');
  const [stockData, setStockData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'TH' | 'US'>('ALL');
  const [customStocks, setCustomStocks] = useState<any[]>([]);
  const [recentStocks, setRecentStocks] = useState<{symbol: string, percentChange: number, timestamp: number}[]>([]);
  
  const deferredSearchInput = useDeferredValue(searchInput);

  useEffect(() => {
    const fetchCustomStocks = async () => {
      try {
        const response = await fetch('/api/stocks');
        if (response.ok) {
          const data = await response.json();
          setCustomStocks(data);
        }
      } catch (err) {
        console.error('Failed to fetch custom stocks:', err);
      }
    };
    fetchCustomStocks();
  }, []);

  useEffect(() => {
    const savedRecentStocks = localStorage.getItem('recentStocks');
    if (savedRecentStocks) {
      try {
        setRecentStocks(JSON.parse(savedRecentStocks));
      } catch (e) {
        console.error('Failed to parse recent stocks', e);
      }
    }
  }, []);

  useEffect(() => {
    if (recentStocks.length > 0) {
      localStorage.setItem('recentStocks', JSON.stringify(recentStocks));
    }
  }, [recentStocks]);

  const fetchData = async (targetSymbol: string, targetInterval: string, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await getStockData(targetSymbol, targetInterval);
      if (cached) {
        setStockData(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stock/${targetSymbol}?interval=${targetInterval}&from=2020-01-01`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch data');
      }
      const data = await response.json();
      setStockData(data);
      
      const isPredefined = STOCK_LIST.some(s => s.symbol === targetSymbol);
      if (!isPredefined) {
        await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: targetSymbol,
            name: data.shortName || targetSymbol,
            market: (targetSymbol || '').endsWith('.BK') ? 'TH' : 'US'
          })
        });
        const res = await fetch('/api/stocks');
        if (res.ok) {
          const customData = await res.json();
          setCustomStocks(customData);
        }
      }
      
      await saveStockData(targetSymbol, targetInterval, data);
    } catch (err: any) {
      setError(err.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(symbol, interval);
  }, [symbol, interval]);

  useEffect(() => {
    if (stockData && stockData.symbol === symbol && stockData.data && stockData.data.length >= 2) {
      const latest = stockData.data[stockData.data.length - 1].close;
      const previous = stockData.data[stockData.data.length - 2].close;
      const pctChange = ((latest - previous) / previous) * 100;
      
      setRecentStocks(prev => {
        const newStocks = prev.filter(s => s.symbol !== symbol);
        newStocks.unshift({ symbol, percentChange: pctChange, timestamp: Date.now() });
        return newStocks.slice(0, 20);
      });
    }
  }, [stockData, symbol]);

  const suggestions = useMemo(() => {
    if (!deferredSearchInput.trim()) return [];
    const query = deferredSearchInput.toLowerCase();
    
    const baseList = marketFilter === 'ALL' ? STOCK_LIST : (marketFilter === 'TH' ? TH_STOCKS : US_STOCKS);
    const mergedList = [...baseList];
    customStocks.forEach(cs => {
      if (!mergedList.some(s => s.symbol === cs.symbol)) {
        if (marketFilter === 'ALL' || marketFilter === cs.market) {
          mergedList.push(cs);
        }
      }
    });
    
    return mergedList.filter(s => 
      s.symbol.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [deferredSearchInput, marketFilter, customStocks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  return {
    symbol,
    setSymbol,
    searchInput,
    setSearchInput,
    interval,
    setChartInterval,
    stockData,
    loading,
    error,
    marketFilter,
    setMarketFilter,
    suggestions,
    handleSearch,
    recentStocks,
    fetchData
  };
}
