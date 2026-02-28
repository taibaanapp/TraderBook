import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  RefreshCcw,
  AlertCircle,
  Wallet,
  X,
  Plus,
  Save,
  ChevronRight,
  Calculator,
  Monitor
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { STOCK_LIST, TH_STOCKS, US_STOCKS } from './constants/stockList';
import { TradingChart } from './components/TradingChart';
import { Legend } from './components/Legend';
import { AssetInfo } from './components/AssetInfo';
import { ChartControls } from './components/ChartControls';
import { StockNotebook } from './components/StockNotebook';
import { MarketDetails } from './components/MarketDetails';
import { calculateCompositeMoneyFlow, calculateVWAP } from './services/indicatorService';
import { getFlag, formatCurrency } from './utils/formatters';
import { cn } from './utils/cn';
import { StockData, ApiResponse, Transaction, PortfolioSummary } from './types';

const INTERVALS = [
  { label: 'Hourly', value: '1h' },
  { label: 'Daily', value: '1d' },
  { label: 'Weekly', value: '1wk' },
];


export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [stockData, setStockData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showOBV, setShowOBV] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'chart' | 'portfolio'>('chart');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'TH' | 'US'>('ALL');
  const deferredSearchInput = useDeferredValue(searchInput);

  // Portfolio State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [newTx, setNewTx] = useState({
    type: 'BUY' as 'BUY' | 'SELL',
    shares: 0,
    price: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [simAdditionalShares, setSimAdditionalShares] = useState(0);
  const [marketPrices, setMarketPrices] = useState<{ [key: string]: { price: number, currency: string } }>({});
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    };
    fetchTransactions();
  }, []);

  const portfolioSummaries = useMemo(() => {
    const summaries: { [key: string]: PortfolioSummary } = {};
    
    transactions.forEach(tx => {
      if (!summaries[tx.symbol]) {
        summaries[tx.symbol] = { symbol: tx.symbol, totalShares: 0, avgCost: 0, totalCost: 0 };
      }
      
      const s = summaries[tx.symbol];
      if (tx.type === 'BUY') {
        const newTotalCost = s.totalCost + (tx.shares * tx.price);
        const newTotalShares = s.totalShares + tx.shares;
        s.totalShares = newTotalShares;
        s.totalCost = newTotalCost;
        s.avgCost = newTotalShares > 0 ? newTotalCost / newTotalShares : 0;
      } else {
        s.totalShares -= tx.shares;
        // Cost basis usually stays same on sell in simple avg cost models
        s.totalCost = s.totalShares * s.avgCost;
      }
    });
    
    return Object.values(summaries).filter(s => s.totalShares > 0);
  }, [transactions]);

  const currentSummary = portfolioSummaries.find(s => s.symbol === symbol) || { symbol, totalShares: 0, avgCost: 0, totalCost: 0 };

  const addTransaction = async () => {
    if (newTx.shares <= 0 || newTx.price <= 0) return;
    
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      ...newTx
    };
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      
      if (response.ok) {
        setTransactions([...transactions, tx]);
        setNewTx({ ...newTx, shares: 0, price: 0 });
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const processedData = useMemo(() => {
    if (!stockData?.data) return [];
    const withMoneyFlow = calculateCompositeMoneyFlow(stockData.data);
    return calculateVWAP(withMoneyFlow);
  }, [stockData]);

  const fetchData = async (targetSymbol: string, targetInterval: string) => {
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
    } catch (err: any) {
      setError(err.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    if (!deferredSearchInput.trim()) return [];
    const query = deferredSearchInput.toLowerCase();
    const baseList = marketFilter === 'ALL' ? STOCK_LIST : (marketFilter === 'TH' ? TH_STOCKS : US_STOCKS);
    
    return baseList.filter(s => 
      s.symbol.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [deferredSearchInput, marketFilter]);

  useEffect(() => {
    fetchData(symbol, interval);
  }, [symbol, interval]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  const latestPrice = stockData?.data[stockData.data.length - 1]?.close;
  const previousPrice = stockData?.data[stockData.data.length - 2]?.close;
  const priceChange = latestPrice && previousPrice ? latestPrice - previousPrice : 0;
  const percentChange = latestPrice && previousPrice ? (priceChange / previousPrice) * 100 : 0;

  // Fetch market prices for portfolio
  useEffect(() => {
    const fetchMarketPrices = async () => {
      const symbolsToFetch = portfolioSummaries.map(s => s.symbol);
      if (symbolsToFetch.length === 0) return;

      const newPrices = { ...marketPrices };
      let changed = false;

      for (const s of symbolsToFetch) {
        // If it's the current symbol, we already have the price
        if (s === symbol && latestPrice) {
          if (newPrices[s]?.price !== latestPrice) {
            newPrices[s] = { price: latestPrice, currency: stockData?.currency || 'USD' };
            changed = true;
          }
          continue;
        }

        // Fetch price if not present or if we are in portfolio tab
        if (!newPrices[s] || activeTab === 'portfolio') {
          try {
            const response = await fetch(`/api/stock/${s}?interval=1d&from=2024-01-01`);
            if (response.ok) {
              const data = await response.json();
              const price = data.data[data.data.length - 1].close;
              newPrices[s] = { price, currency: data.currency };
              changed = true;
            }
          } catch (err) {
            console.error(`Failed to fetch price for ${s}:`, err);
          }
        }
      }

      if (changed) {
        setMarketPrices(newPrices);
      }
    };

    if (activeTab === 'portfolio' || transactions.length > 0) {
      fetchMarketPrices();
    }
  }, [portfolioSummaries, activeTab, symbol, latestPrice, transactions.length]);

  const currentStockMeta = useMemo(() => {
    return STOCK_LIST.find(s => s.symbol === symbol);
  }, [symbol]);

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8 text-center selection:bg-rose-500 selection:text-white">
        <div className="max-w-md space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-rose-500/20 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 shadow-2xl">
              <Monitor className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Desktop Only</h1>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              TraderBook 99 สาธุ is a professional-grade analysis platform designed exclusively for large displays. 
              Mobile and tablet access is currently restricted to ensure the best analytical experience.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analytical Workspace Required</span>
            </div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Please switch to a desktop or laptop</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">TraderBook 99 สาธุ</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 leading-none">Professional Trading Log</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search symbol (e.g. AAPL, PTT.BK)"
                className="w-full bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900 focus:ring-0 rounded-xl pl-10 pr-10 py-2 text-sm transition-all outline-none border"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              )}
            </div>
            
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="flex bg-zinc-50 border-b border-zinc-100 p-1">
                  {(['ALL', 'TH', 'US'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarketFilter(m)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                        marketFilter === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      {m === 'ALL' ? 'ทั้งหมด' : (m === 'TH' ? 'หุ้นไทย 🇹🇭' : 'หุ้นเมกา 🇺🇸')}
                    </button>
                  ))}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-400 text-xs italic">
                      ไม่พบรายชื่อหุ้นที่ค้นหา
                    </div>
                  ) : suggestions.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => {
                        setSymbol(s.symbol);
                        setSearchInput(s.symbol);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFlag(s.symbol)}</span>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{s.symbol}</p>
                          <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">{s.name}</p>
                          <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider mt-0.5">{s.sector}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{s.market}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showSuggestions && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSuggestions(false)} 
              />
            )}
          </form>

          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 gap-1">
              <button
                onClick={() => setActiveTab('chart')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                  activeTab === 'chart' 
                    ? "bg-white text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Chart
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                  activeTab === 'portfolio' 
                    ? "bg-white text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Wallet className="w-3.5 h-3.5" /> Portfolio
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700 text-sm max-w-md mb-6">{error}</p>
            <button 
              onClick={() => fetchData(symbol, interval)}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : activeTab === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Legend Area (Left) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Quick View (Moved from Right Sidebar) */}
              {currentSummary.totalShares > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Wallet className="w-3.5 h-3.5 text-zinc-900" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Holdings</h3>
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">{symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-black",
                        latestPrice && latestPrice >= currentSummary.avgCost ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {latestPrice ? (((latestPrice - currentSummary.avgCost) / currentSummary.avgCost) * 100).toFixed(2) : 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <p className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Shares</p>
                      <p className="text-xs font-bold text-zinc-900">{currentSummary.totalShares}</p>
                    </div>
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <p className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Avg Cost</p>
                      <p className="text-xs font-bold text-zinc-900">{formatCurrency(currentSummary.avgCost, stockData?.currency)}</p>
                    </div>
                  </div>
                </div>
              )}

              <Legend />
              <StockNotebook 
                symbol={symbol} 
                currentPrice={latestPrice || 0} 
                currency={stockData?.currency} 
              />
            </div>

            {/* Main Chart Area (Wide) */}
            <div className="lg:col-span-7 space-y-6">
              <AssetInfo 
                symbol={symbol}
                latestPrice={latestPrice}
                priceChange={priceChange}
                percentChange={percentChange}
                currency={stockData?.currency}
                interval={interval}
              />

              <ChartControls 
                interval={interval}
                setInterval={setInterval}
                chartType={chartType}
                setChartType={setChartType}
                showVWAP={showVWAP}
                setShowVWAP={setShowVWAP}
                showOBV={showOBV}
                setShowOBV={setShowOBV}
                showVolume={showVolume}
                setShowVolume={setShowVolume}
                onReset={() => setResetTrigger(prev => prev + 1)}
              />

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 h-[600px] relative overflow-hidden group">
                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCcw className="w-8 h-8 text-zinc-900 animate-spin" />
                      <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Updating Market Data...</p>
                    </div>
                  </div>
                )}
                
                <div className="h-full w-full relative">
                  <TradingChart 
                    data={processedData} 
                    showVWAP={showVWAP} 
                    showOBV={showOBV} 
                    showVolume={showVolume}
                    chartType={chartType}
                    onHover={setHoveredData}
                    resetTrigger={resetTrigger}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Stats (Right) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Spacer to align MarketDetails with Chart (accounting for AssetInfo + ChartControls) */}
              <div className="hidden lg:block h-[140px]" />

              <MarketDetails 
                data={hoveredData}
                latestData={processedData[processedData.length - 1]}
                currency={stockData?.currency}
              />

              {/* Buy Strategy */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Buy Strategy</span>
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase mb-1">Entry Conditions:</p>
                    <ul className="text-[10px] text-emerald-700 space-y-1 list-disc pl-4">
                      <li>Price above <b>VWAP</b> (Support)</li>
                      <li>VWAP color is <b>Leading (Dark Green)</b></li>
                      <li>Money Flow Score &gt; 50</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Terminal Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">API Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">Source</span>
                    <span className="text-xs font-bold">Yahoo Finance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Portfolio Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Portfolio Overview</h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">All recorded holdings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Est. Portfolio Value</p>
                      <p className="text-2xl font-black text-zinc-900">
                        {portfolioSummaries.reduce((sum, s) => sum + (s.totalShares * (marketPrices[s.symbol]?.price || s.avgCost)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Asset</th>
                          <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Shares</th>
                          <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Avg Cost</th>
                          <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Market Price</th>
                          <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">P/L</th>
                          <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioSummaries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-zinc-400 text-sm font-medium">No holdings recorded yet.</td>
                          </tr>
                        ) : portfolioSummaries.map(s => {
                          const mPrice = marketPrices[s.symbol];
                          const currentPrice = mPrice?.price || 0;
                          const marketValue = s.totalShares * currentPrice;
                          const pl = marketValue - s.totalCost;
                          const plPercent = s.totalCost > 0 ? (pl / s.totalCost) * 100 : 0;
                          const cur = mPrice?.currency || 'USD';

                          return (
                            <tr key={s.symbol} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                              <td className="py-4">
                                <button 
                                  onClick={() => { setSymbol(s.symbol); setSearchInput(s.symbol); setActiveTab('chart'); }}
                                  className="font-bold text-zinc-900 hover:underline flex items-center gap-2"
                                >
                                  <span className="text-xl">{getFlag(s.symbol)}</span>
                                  {s.symbol}
                                  <ChevronRight className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              </td>
                              <td className="text-right py-4 font-bold text-zinc-700">{s.totalShares}</td>
                              <td className="text-right py-4 font-bold text-zinc-700">{formatCurrency(s.avgCost, cur)}</td>
                              <td className="text-right py-4 font-bold text-zinc-700">
                                {currentPrice ? formatCurrency(currentPrice, cur) : 'Loading...'}
                              </td>
                              <td className={cn(
                                "text-right py-4 font-bold",
                                pl >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                <div>{pl >= 0 ? '+' : ''}{formatCurrency(pl, cur)}</div>
                                <div className="text-[10px] uppercase tracking-wider">{plPercent.toFixed(2)}%</div>
                              </td>
                              <td className="text-right py-4">
                                <button 
                                  onClick={() => { setSymbol(s.symbol); setSearchInput(s.symbol); }}
                                  className="text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Transaction History</h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent activity for {symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {transactions.filter(t => t.symbol === symbol).reverse().map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100 group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs",
                            t.type === 'BUY' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {t.type}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{t.shares} shares @ {formatCurrency(t.price, stockData?.currency)}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">{t.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {transactions.filter(t => t.symbol === symbol).length === 0 && (
                      <p className="text-center py-8 text-zinc-400 text-sm font-medium">No transactions for {symbol}.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-xl shadow-zinc-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-black tracking-tight">Add Record</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-3">Transaction Type</p>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800 rounded-lg">
                        <button 
                          onClick={() => setNewTx({ ...newTx, type: 'BUY' })}
                          className={cn(
                            "py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                            newTx.type === 'BUY' ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Buy
                        </button>
                        <button 
                          onClick={() => setNewTx({ ...newTx, type: 'SELL' })}
                          className={cn(
                            "py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                            newTx.type === 'SELL' ? "bg-rose-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Symbol</p>
                      <p className="text-lg font-black text-white">{symbol}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Shares</label>
                        <input 
                          type="number" 
                          value={newTx.shares || ''}
                          onChange={(e) => setNewTx({ ...newTx, shares: Number(e.target.value) })}
                          className="w-full bg-zinc-800 border-transparent focus:bg-zinc-700 focus:ring-0 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Price</label>
                        <input 
                          type="number" 
                          value={newTx.price || ''}
                          onChange={(e) => setNewTx({ ...newTx, price: Number(e.target.value) })}
                          className="w-full bg-zinc-800 border-transparent focus:bg-zinc-700 focus:ring-0 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Date</label>
                      <input 
                        type="date" 
                        value={newTx.date}
                        onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                        className="w-full bg-zinc-800 border-transparent focus:bg-zinc-700 focus:ring-0 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none"
                      />
                    </div>

                    <button 
                      onClick={addTransaction}
                      className="w-full bg-white text-zinc-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Transaction
                    </button>
                  </div>
                </div>

                {/* DCA Simulator (Moved from Chart) */}
                {(marketPrices[symbol]?.price || latestPrice) && currentSummary.totalShares > 0 && (
                  <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Calculator className="w-5 h-5 text-zinc-900" />
                      <h2 className="text-xl font-black tracking-tight">DCA Simulator</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Market Price</p>
                          <p className="text-lg font-black text-zinc-900">
                            {formatCurrency(marketPrices[symbol]?.price || latestPrice || 0, marketPrices[symbol]?.currency || stockData?.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Current Avg</p>
                          <p className="text-lg font-black text-zinc-500">
                            {formatCurrency(currentSummary.avgCost, marketPrices[symbol]?.currency || stockData?.currency)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Buy More Shares</span>
                          <span className="text-sm font-black text-zinc-900">+{simAdditionalShares}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="2000" 
                          step="1"
                          value={simAdditionalShares}
                          onChange={(e) => setSimAdditionalShares(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div className="bg-zinc-900 rounded-2xl p-6 text-white shadow-lg shadow-zinc-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Average Cost</span>
                          <span className={cn(
                            "text-xl font-black",
                            ((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares)) < currentSummary.avgCost 
                              ? "text-emerald-400" 
                              : "text-white"
                          )}>
                            {formatCurrency(((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares || 1)), marketPrices[symbol]?.currency || stockData?.currency)}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                          {((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares)) < currentSummary.avgCost 
                            ? "Lowering your cost basis" 
                            : "Increasing your cost basis"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Portfolio Tips</h3>
                  <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">
                    Recording individual transactions allows you to track your performance over time. The system automatically calculates your average cost basis using the "BUY" transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
