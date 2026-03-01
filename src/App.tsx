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
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { STOCK_LIST, TH_STOCKS, US_STOCKS } from './constants/stockList';
import { TradingChart } from './components/TradingChart';
import { Legend } from './components/Legend';
import { AssetInfo } from './components/AssetInfo';
import { ChartControls } from './components/ChartControls';
import { StockNotebook } from './components/StockNotebook';
import { MarketDetails } from './components/MarketDetails';
import { WhatIfBox } from './components/WhatIfBox';
import { FinancialIndicators } from './components/FinancialIndicators';
import { Logo } from './components/Logo';
import { calculateCompositeMoneyFlow, calculateVWAP, calculateEMA } from './services/indicatorService';
import { simulateGoldenCross } from './services/simulationService';
import { getStockData, saveStockData } from './services/storageService';
import { getFlag, formatCurrency } from './utils/formatters';
import { cn } from './utils/cn';
import { StockData, ApiResponse, Transaction, PortfolioSummary } from './types';

const INTERVALS = [
  { label: 'Hourly', value: '1h' },
  { label: 'Daily', value: '1d' },
  { label: 'Weekly', value: '1wk' },
];


export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [stockData, setStockData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showOBV, setShowOBV] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showEMAX, setShowEMAX] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationRate, setSimulationRate] = useState(-1.5);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'chart' | 'portfolio'>('chart');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'TH' | 'US'>('ALL');
  const deferredSearchInput = useDeferredValue(searchInput);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
    
    let rawData = [...stockData.data];
    
    if (isSimulationMode && rawData.length > 0) {
      const lastPoint = rawData[rawData.length - 1];
      let currentPrice = lastPoint.close;
      let currentDate = new Date(lastPoint.date);
      
      // Weighted Volatility Calculation
      // 70% weight to last 30 days, 30% weight to last 90 days
      const calculateVolatility = (lookback: number) => {
        const recentData = stockData.data.slice(-lookback);
        if (recentData.length < 2) return 0.02; // Fallback
        const returns = [];
        for (let i = 1; i < recentData.length; i++) {
          returns.push((recentData[i].close - recentData[i-1].close) / recentData[i-1].close);
        }
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
        return Math.sqrt(variance);
      };

      const vol30 = calculateVolatility(30);
      const vol90 = calculateVolatility(90);
      const weightedVolatility = (vol30 * 0.7) + (vol90 * 0.3);
      
      // Random Normal Generator (Box-Muller transform)
      const randomNormal = (mean: number, stdDev: number) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
      };

      const msPerInterval = interval === '1h' ? 3600000 : (interval === '1d' ? 86400000 : 604800000);
      const targetDailyChange = simulationRate / 100;

      for (let i = 1; i <= 20; i++) {
        const dailyChange = randomNormal(targetDailyChange, weightedVolatility);
        currentPrice = currentPrice * (1 + dailyChange);
        currentDate = new Date(currentDate.getTime() + msPerInterval);
        
        rawData.push({
          date: currentDate.toISOString(),
          open: currentPrice * (1 - dailyChange * 0.2),
          high: currentPrice * (1 + Math.abs(dailyChange) * 0.5),
          low: currentPrice * (1 - Math.abs(dailyChange) * 0.5),
          close: currentPrice,
          volume: lastPoint.volume * (0.8 + Math.random() * 0.4),
          isSimulated: true,
          pe: lastPoint.pe,
          pb: lastPoint.pb
        });
      }
    }

    let data = calculateCompositeMoneyFlow(rawData);
    data = calculateVWAP(data);
    data = calculateEMA(data, 50, 'ema50');
    data = calculateEMA(data, 135, 'ema135');
    return data;
  }, [stockData, isSimulationMode, simulationRate, interval]);

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
      
      // Cache the result using IndexedDB and pruning
      await saveStockData(targetSymbol, targetInterval, data);
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

  const simulationResult = useMemo(() => {
    return simulateGoldenCross(processedData, interval);
  }, [processedData, interval]);

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
              CrossVision is a professional-grade analysis platform designed exclusively for large displays. 
              Mobile and tablet access is currently restricted to ensure the best analytical experience.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Analytical Workspace Required</span>
            </div>
            <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Please switch to a desktop or laptop</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      theme === 'dark' ? "bg-[#0f172a] text-zinc-100" : "bg-[#F8F9FA] text-zinc-900"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b sticky top-0 z-50 transition-colors duration-300",
        theme === 'dark' ? "bg-[#1e293b] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight">CrossVision</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-500 dark:text-rose-400 leading-none">See the Cross before it happens.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 sm:mx-8 relative">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search symbol (e.g. AAPL, PTT.BK)"
                className={cn(
                  "w-full rounded-xl pl-10 pr-10 py-2 text-sm transition-all outline-none border",
                  theme === 'dark' 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:bg-zinc-700 focus:border-zinc-500" 
                    : "bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900"
                )}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              )}
            </div>
            
            {showSuggestions && (
              <div className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 border",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"
              )}>
                <div className={cn(
                  "flex p-1 border-b",
                  theme === 'dark' ? "bg-zinc-900 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                )}>
                  {(['ALL', 'TH', 'US'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarketFilter(m)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                        marketFilter === m 
                          ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      )}
                    >
                      {m === 'ALL' ? 'ทั้งหมด' : (m === 'TH' ? 'หุ้นไทย 🇹🇭' : 'หุ้นเมกา 🇺🇸')}
                    </button>
                  ))}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-400 text-sm italic">
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
                      className={cn(
                        "w-full px-4 py-3 flex items-center justify-between transition-colors border-b last:border-0 text-left",
                        theme === 'dark' 
                          ? "hover:bg-zinc-700 border-zinc-700" 
                          : "hover:bg-zinc-50 border-zinc-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(s.symbol)}</span>
                        <div>
                          <p className={cn("text-base font-bold", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>{s.symbol}</p>
                          <p className="text-sm text-zinc-400 font-medium truncate max-w-[200px]">{s.name}</p>
                          <p className="text-[10px] text-zinc-300 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{s.sector}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">{s.market}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-xl border transition-all",
                theme === 'dark' 
                  ? "bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700" 
                  : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={cn(
              "flex p-1 rounded-lg border gap-1",
              theme === 'dark' ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
            )}>
              <button
                onClick={() => setActiveTab('chart')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                  activeTab === 'chart' 
                    ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Vision
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                  activeTab === 'portfolio' 
                    ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <Wallet className="w-3.5 h-3.5" /> Portfolio
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {error ? (
          <div className={cn(
            "border rounded-2xl p-8 flex flex-col items-center justify-center text-center",
            theme === 'dark' ? "bg-red-900/10 border-red-900/20" : "bg-red-50 border-red-100"
          )}>
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className={cn("text-lg font-bold mb-2", theme === 'dark' ? "text-red-400" : "text-red-900")}>Error Loading Data</h2>
            <p className={cn("text-sm max-w-md mb-6", theme === 'dark' ? "text-red-300" : "text-red-700")}>{error}</p>
            <button 
              onClick={() => fetchData(symbol, interval)}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : activeTab === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <Legend theme={theme} />
              <WhatIfBox 
                result={simulationResult}
                currency={stockData?.currency}
                interval={interval}
                theme={theme}
              />
              <StockNotebook 
                symbol={symbol} 
                currentPrice={latestPrice || 0} 
                currency={stockData?.currency} 
                theme={theme}
              />
            </div>

            {/* Center Column */}
            <div className="lg:col-span-7 space-y-6">
              <AssetInfo 
                symbol={symbol}
                latestPrice={latestPrice}
                priceChange={priceChange}
                percentChange={percentChange}
                currency={stockData?.currency}
                interval={interval}
                theme={theme}
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
                showEMAX={showEMAX}
                setShowEMAX={setShowEMAX}
                isSimulationMode={isSimulationMode}
                setIsSimulationMode={setIsSimulationMode}
                onReset={() => {
                  setResetTrigger(prev => prev + 1);
                  setIsSimulationMode(false);
                }}
                onRefresh={() => fetchData(symbol, interval, true)}
                theme={theme}
              />

              {/* Chart */}
              <div className={cn(
                "rounded-2xl border p-6 h-[500px] relative overflow-hidden group transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                {loading && (
                  <div className={cn(
                    "absolute inset-0 backdrop-blur-[2px] z-20 flex items-center justify-center",
                    theme === 'dark' ? "bg-zinc-900/60" : "bg-white/60"
                  )}>
            <div className="flex flex-col items-center gap-3">
              <RefreshCcw className={cn("w-8 h-8 animate-spin", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")} />
              <p className={cn("text-base font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Optimizing Data...</p>
            </div>
                  </div>
                )}
                
                <div className="h-full w-full relative">
                  <TradingChart 
                    data={processedData} 
                    showVWAP={showVWAP} 
                    showOBV={showOBV} 
                    showVolume={showVolume}
                    showEMAX={showEMAX}
                    chartType={chartType}
                    onHover={setHoveredData}
                    resetTrigger={resetTrigger}
                    isSimulationMode={isSimulationMode}
                    theme={theme}
                  />
                </div>
              </div>

              <FinancialIndicators symbol={symbol} theme={theme} />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <MarketDetails 
                data={hoveredData}
                latestData={processedData[processedData.length - 1]}
                currency={stockData?.currency}
                theme={theme}
              />

              {/* Buy Strategy */}
              <div className={cn(
                "rounded-2xl border p-6 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <h3 className={cn("text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                  <TrendingUp className="w-4 h-4" />
                  <span>CrossVision Strategy</span>
                </h3>
                <div className="space-y-4">
                  <div className={cn(
                    "p-3 rounded-xl border",
                    theme === 'dark' ? "bg-emerald-900/10 border-emerald-900/20" : "bg-emerald-50 border-emerald-100"
                  )}>
                    <p className={cn("text-xs font-bold uppercase mb-1", theme === 'dark' ? "text-emerald-400" : "text-emerald-800")}>Vision Conditions:</p>
                    <ul className={cn("text-[13px] space-y-1 list-disc pl-4", theme === 'dark' ? "text-emerald-300" : "text-emerald-700")}>
                      <li>Price above <b>VWAP</b> (Support)</li>
                      <li>VWAP color is <b>Leading (Dark Green)</b></li>
                      <li>Money Flow Score &gt; 30</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Terminal Status */}
              <div className={cn(
                "rounded-2xl border p-6 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">CrossVision Terminal</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-500">API Status</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-500">Source</span>
                    <span className={cn("text-sm font-bold", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Yahoo Finance</span>
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
                <div className={cn(
                  "rounded-2xl border p-8 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>CrossVision Portfolio</h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">All recorded holdings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400 uppercase">Est. Portfolio Value</p>
                      <p className={cn("text-2xl font-black", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                        {portfolioSummaries.reduce((sum, s) => sum + (s.totalShares * (marketPrices[s.symbol]?.price || s.avgCost)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn("border-b", theme === 'dark' ? "border-zinc-800" : "border-zinc-100")}>
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
                            <tr key={s.symbol} className={cn(
                              "border-b transition-colors group",
                              theme === 'dark' ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-zinc-50 hover:bg-zinc-50/50"
                            )}>
                              <td className="py-4">
                                <button 
                                  onClick={() => { setSymbol(s.symbol); setSearchInput(s.symbol); setActiveTab('chart'); }}
                                  className={cn(
                                    "font-bold hover:underline flex items-center gap-2",
                                    theme === 'dark' ? "text-zinc-100" : "text-zinc-900"
                                  )}
                                >
                                  <span className="text-xl">{getFlag(s.symbol)}</span>
                                  {s.symbol}
                                  <ChevronRight className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              </td>
                              <td className={cn("text-right py-4 font-bold", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>{s.totalShares}</td>
                              <td className={cn("text-right py-4 font-bold", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>{formatCurrency(s.avgCost, cur)}</td>
                              <td className={cn("text-right py-4 font-bold", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>
                                {currentPrice ? formatCurrency(currentPrice, cur) : 'Loading...'}
                              </td>
                              <td className={cn(
                                "text-right py-4 font-bold",
                                pl >= 0 ? "text-emerald-500" : "text-rose-500"
                              )}>
                                <div>{pl >= 0 ? '+' : ''}{formatCurrency(pl, cur)}</div>
                                <div className="text-[10px] uppercase tracking-wider">{plPercent.toFixed(2)}%</div>
                              </td>
                              <td className="text-right py-4">
                                <button 
                                  onClick={() => { setSymbol(s.symbol); setSearchInput(s.symbol); }}
                                  className="text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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

                <div className={cn(
                  "rounded-2xl border p-8 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>CrossVision History</h2>
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent activity for {symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {transactions.filter(t => t.symbol === symbol).reverse().map(t => (
                      <div key={t.id} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border group transition-colors",
                        theme === 'dark' ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                            t.type === 'BUY' 
                              ? (theme === 'dark' ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-100 text-emerald-700") 
                              : (theme === 'dark' ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-700")
                          )}>
                            {t.type}
                          </div>
                          <div>
                            <p className={cn("text-base font-bold", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>{t.shares} shares @ {formatCurrency(t.price, stockData?.currency)}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">{t.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-rose-500"
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
                <div className={cn(
                  "rounded-2xl p-8 shadow-xl transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-800 border border-zinc-700 shadow-none" : "bg-zinc-900 text-white shadow-zinc-200"
                )}>
                  <div className="flex items-center gap-2 mb-6">
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <h2 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-white")}>Add CrossVision Record</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-3">Transaction Type</p>
                      <div className={cn(
                        "grid grid-cols-2 gap-2 p-1 rounded-lg",
                        theme === 'dark' ? "bg-zinc-900" : "bg-zinc-800"
                      )}>
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
                      <p className={cn("text-xl font-black", theme === 'dark' ? "text-zinc-100" : "text-white")}>{symbol}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Shares</label>
                        <input 
                          type="number" 
                          value={newTx.shares || ''}
                          onChange={(e) => setNewTx({ ...newTx, shares: Number(e.target.value) })}
                          className={cn(
                            "w-full border-transparent focus:ring-0 rounded-lg px-3 py-2 text-base font-bold outline-none transition-colors",
                            theme === 'dark' ? "bg-zinc-900 text-zinc-100 focus:bg-zinc-950" : "bg-zinc-800 text-white focus:bg-zinc-700"
                          )}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Price</label>
                        <input 
                          type="number" 
                          value={newTx.price || ''}
                          onChange={(e) => setNewTx({ ...newTx, price: Number(e.target.value) })}
                          className={cn(
                            "w-full border-transparent focus:ring-0 rounded-lg px-3 py-2 text-base font-bold outline-none transition-colors",
                            theme === 'dark' ? "bg-zinc-900 text-zinc-100 focus:bg-zinc-950" : "bg-zinc-800 text-white focus:bg-zinc-700"
                          )}
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
                        className={cn(
                          "w-full border-transparent focus:ring-0 rounded-lg px-3 py-2 text-base font-bold outline-none transition-colors",
                          theme === 'dark' ? "bg-zinc-900 text-zinc-100 focus:bg-zinc-950" : "bg-zinc-800 text-white focus:bg-zinc-700"
                        )}
                      />
                    </div>

                    <button 
                      onClick={addTransaction}
                      className={cn(
                        "w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        theme === 'dark' ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-white text-zinc-900 hover:bg-zinc-100"
                      )}
                    >
                      <Save className="w-4 h-4" /> Save Transaction
                    </button>
                  </div>
                </div>

                {/* DCA Simulator (Moved from Chart) */}
                {(marketPrices[symbol]?.price || latestPrice) && currentSummary.totalShares > 0 && (
                  <div className={cn(
                    "rounded-2xl border p-8 transition-colors duration-300",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    <div className="flex items-center gap-2 mb-6">
                      <Calculator className={cn("w-5 h-5", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")} />
                      <h2 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>CrossVision DCA Simulator</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border",
                        theme === 'dark' ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                      )}>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Market Price</p>
                          <p className={cn("text-xl font-black", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                            {formatCurrency(marketPrices[symbol]?.price || latestPrice || 0, marketPrices[symbol]?.currency || stockData?.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Current Avg</p>
                          <p className="text-xl font-black text-zinc-500">
                            {formatCurrency(currentSummary.avgCost, marketPrices[symbol]?.currency || stockData?.currency)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Buy More Shares</span>
                          <span className={cn("text-base font-black", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>+{simAdditionalShares}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="2000" 
                          step="1"
                          value={simAdditionalShares}
                          onChange={(e) => setSimAdditionalShares(Number(e.target.value))}
                          className={cn(
                            "w-full h-2 rounded-lg appearance-none cursor-pointer",
                            theme === 'dark' ? "bg-zinc-800 accent-zinc-100" : "bg-zinc-100 accent-zinc-900"
                          )}
                        />
                      </div>

                      <div className={cn(
                        "rounded-2xl p-6 shadow-lg transition-colors",
                        theme === 'dark' ? "bg-zinc-800 border border-zinc-700 shadow-none" : "bg-zinc-900 text-white shadow-zinc-200"
                      )}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Average Cost</span>
                          <span className={cn(
                            "text-2xl font-black",
                            ((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares)) < currentSummary.avgCost 
                              ? "text-emerald-400" 
                              : (theme === 'dark' ? "text-zinc-100" : "text-white")
                          )}>
                            {formatCurrency(((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares || 1)), marketPrices[symbol]?.currency || stockData?.currency)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                          {((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * (marketPrices[symbol]?.price || latestPrice || 0)) / (currentSummary.totalShares + simAdditionalShares)) < currentSummary.avgCost 
                            ? "Lowering your cost basis" 
                            : "Increasing your cost basis"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Portfolio Tips</h3>
                  <p className="text-xs leading-relaxed text-zinc-500 font-medium">
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
