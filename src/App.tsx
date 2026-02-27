import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  BarChart3,
  RefreshCcw,
  AlertCircle,
  ChevronRight,
  Wallet,
  Calculator,
  Plus,
  Save
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import { STOCK_LIST } from './constants/stockList';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeColor: string;
  pe: number | null;
  pb: number | null;
  vwap?: number;
  obv?: number;
}

interface ApiResponse {
  symbol: string;
  currency: string;
  data: StockData[];
}

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  thumbnail?: { resolutions: { url: string }[] };
  translatedTitle?: string;
}

const INTERVALS = [
  { label: 'Hourly', value: '1h' },
  { label: 'Daily', value: '1d' },
  { label: 'Weekly', value: '1wk' },
];

interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string;
}

interface PortfolioSummary {
  symbol: string;
  totalShares: number;
  avgCost: number;
  totalCost: number;
}

const getFlag = (symbol: string) => {
  const s = symbol.toUpperCase();
  if (s.endsWith('.BK')) return '🇹🇭';
  if (s.endsWith('.HK')) return '🇭🇰';
  if (s.endsWith('.SS') || s.endsWith('.SZ')) return '🇨🇳';
  if (s.endsWith('.T')) return '🇯🇵';
  if (s.endsWith('.L')) return '🇬🇧';
  if (s.endsWith('.DE')) return '🇩🇪';
  if (s.endsWith('.PA')) return '🇫เร';
  if (s.endsWith('.TO')) return '🇨🇦';
  if (s.endsWith('.AX')) return '🇦🇺';
  if (s.endsWith('.NS') || s.endsWith('.BO')) return '🇮🇳';
  if (s.endsWith('.SG')) return '🇸🇬';
  if (s.endsWith('.KL')) return '🇲🇾';
  if (s.includes('-USD') || s.includes('-BTC')) return '₿';
  return '🇺🇸';
};

const formatCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (e) {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [interval, setInterval] = useState('1d');
  const [stockData, setStockData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showOBV, setShowOBV] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'portfolio'>('chart');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof STOCK_LIST>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    let currentOBV = 0;
    
    return stockData.data.map((point, i, arr) => {
      // VWAP Calculation
      const typicalPrice = (point.high + point.low + point.close) / 3;
      cumulativeTPV += typicalPrice * point.volume;
      cumulativeVolume += point.volume;
      const vwap = cumulativeTPV / cumulativeVolume;
      
      // OBV Calculation
      if (i > 0) {
        if (point.close > arr[i-1].close) {
          currentOBV += point.volume;
        } else if (point.close < arr[i-1].close) {
          currentOBV -= point.volume;
        }
      } else {
        currentOBV = point.volume;
      }
      
      return {
        ...point,
        vwap,
        obv: currentOBV
      };
    });
  }, [stockData]);

  const fetchNews = async (targetSymbol: string) => {
    setNewsLoading(true);
    try {
      const response = await fetch(`/api/news/${targetSymbol}`);
      if (response.ok) {
        const newsData: NewsItem[] = await response.json();
        
        // Translate news titles using Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const translatedNews = await Promise.all(newsData.map(async (item) => {
          try {
            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Translate this stock news headline to professional Thai: "${item.title}"`,
              config: {
                systemInstruction: "You are a professional financial translator. Provide only the Thai translation, no extra text.",
              }
            });
            return { ...item, translatedTitle: result.text?.trim() };
          } catch (e) {
            console.error('Translation error:', e);
            return item;
          }
        }));
        setNews(translatedNews);
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

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
      fetchNews(targetSymbol);
    } catch (err: any) {
      setError(err.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = STOCK_LIST.filter(s => 
      s.symbol.toLowerCase().includes(searchInput.toLowerCase()) || 
      s.name.toLowerCase().includes(searchInput.toLowerCase())
    ).slice(0, 8);
    setSuggestions(filtered);
  }, [searchInput]);

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

  const lineGradientStops = useMemo(() => {
    if (!stockData?.data || stockData.data.length === 0) return null;
    const data = stockData.data;
    return data.map((point, i) => {
      const offset = (i / (data.length - 1)) * 100;
      return (
        <stop key={`stop-${i}`} offset={`${offset}%`} stopColor={point.volumeColor} />
      );
    });
  }, [stockData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-zinc-200 shadow-xl rounded-lg">
          <p className="text-xs font-mono text-zinc-500 mb-1">
            {(() => {
              const d = new Date(label);
              if (isNaN(d.getTime())) return 'N/A';
              return format(d, interval === '1h' ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy');
            })()}
          </p>
          <p className="text-lg font-bold text-zinc-900">
            {formatCurrency(payload[0].value, stockData?.currency)}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
            <span>Open</span>
            <span className="text-zinc-700 text-right">{formatCurrency(payload[0].payload.open, stockData?.currency)}</span>
            <span>High</span>
            <span className="text-zinc-700 text-right">{formatCurrency(payload[0].payload.high, stockData?.currency)}</span>
            <span>Low</span>
            <span className="text-zinc-700 text-right">{formatCurrency(payload[0].payload.low, stockData?.currency)}</span>
            <span>Volume</span>
            <span className="text-zinc-700 text-right">{(payload[0].payload.volume / 1000000).toFixed(2)}M</span>
            {payload[0].payload.pe !== null ? (
              <>
                <span>P/E Ratio</span>
                <span className="text-zinc-700 text-right">{payload[0].payload.pe.toFixed(2)}x</span>
              </>
            ) : (
              <>
                <span>P/E Ratio</span>
                <span className="text-zinc-700 text-right text-zinc-300">N/A</span>
              </>
            )}
            {payload[0].payload.pb !== null ? (
              <>
                <span>P/B Ratio</span>
                <span className="text-zinc-700 text-right">{payload[0].payload.pb.toFixed(2)}x</span>
              </>
            ) : (
              <>
                <span>P/B Ratio</span>
                <span className="text-zinc-700 text-right text-zinc-300">N/A</span>
              </>
            )}
            {showVWAP && payload[0].payload.vwap && (
              <>
                <span>VWAP</span>
                <span className="text-blue-600 text-right">{formatCurrency(payload[0].payload.vwap, stockData?.currency)}</span>
              </>
            )}
            {showOBV && payload[0].payload.obv !== undefined && (
              <>
                <span>OBV</span>
                <span className="text-zinc-900 text-right">{(payload[0].payload.obv / 1000000).toFixed(2)}M</span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                className="w-full bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900 focus:ring-0 rounded-xl pl-10 pr-4 py-2 text-sm transition-all outline-none border"
              />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50">
                {suggestions.map((s) => (
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
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{s.market}</span>
                  </button>
                ))}
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
            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 gap-1 mr-4">
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

            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 gap-1">
              <button
                onClick={() => setShowVWAP(!showVWAP)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  showVWAP 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                VWAP
              </button>
              <button
                onClick={() => setShowOBV(!showOBV)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  showOBV 
                    ? "bg-zinc-900 text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                OBV
              </button>
            </div>

            <div className="hidden sm:flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              {INTERVALS.map((int) => (
                <button
                  key={int.value}
                  onClick={() => setInterval(int.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                    interval === int.value 
                      ? "bg-white text-zinc-900 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {int.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Asset Info */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getFlag(symbol)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Market Data</span>
                      <ChevronRight className="w-3 h-3 text-zinc-300" />
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">{symbol}</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-4xl font-black tracking-tighter">{symbol}</h2>
                      {latestPrice && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{formatCurrency(latestPrice, stockData?.currency)}</span>
                          <span className={cn(
                            "text-sm font-bold flex items-center gap-1",
                            priceChange >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(priceChange).toFixed(2)} ({percentChange.toFixed(2)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-8 border-l border-zinc-100 pl-8">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Interval</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {INTERVALS.find(i => i.value === interval)?.label}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Since</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {interval === '1h' ? 'Last 2 Years' : 'Jan 1, 2020'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 h-[500px] relative overflow-hidden group">
                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCcw className="w-8 h-8 text-zinc-900 animate-spin" />
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Syncing Data...</p>
                    </div>
                  </div>
                )}
                
                <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processedData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          {lineGradientStops}
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis 
                        dataKey="date" 
                        hide 
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="url(#lineGradient)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1500}
                      />
                      {showVWAP && (
                        <Line 
                          type="monotone" 
                          dataKey="vwap" 
                          stroke="#2563eb" 
                          strokeWidth={2} 
                          dot={false} 
                          animationDuration={1500}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* OBV Chart */}
              {showOBV && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 h-[200px]">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">On-Balance Volume (OBV)</h3>
                  </div>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={processedData}>
                        <defs>
                          <linearGradient id="colorOBV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.05}/>
                            <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="obv" 
                          stroke="#18181b" 
                          strokeWidth={1.5} 
                          fill="url(#colorOBV)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Volume Chart */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 h-[200px]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Trading Volume</h3>
                </div>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData}>
                      <Bar 
                        dataKey="volume" 
                        radius={[2, 2, 0, 0]}
                      >
                        {processedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.volumeColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-2xl p-6 text-white shadow-xl shadow-zinc-200">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Market Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Current Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(latestPrice || 0, stockData?.currency)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">24h High</p>
                      <p className="text-sm font-bold">{formatCurrency(Math.max(...(stockData?.data.slice(-24).map(d => d.high) || [0])), stockData?.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">24h Low</p>
                      <p className="text-sm font-bold">{formatCurrency(Math.min(...(stockData?.data.slice(-24).map(d => d.low) || [0])), stockData?.currency)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Popular Symbols</p>
                    <div className="flex flex-wrap gap-2">
                      {['BTC-USD', 'ETH-USD', 'TSLA', 'NVDA', 'MSFT'].map(s => (
                        <button 
                          key={s}
                          onClick={() => {
                            setSymbol(s);
                            setSearchInput(s);
                          }}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-between">
                  <span>Latest News</span>
                  <span className="text-[10px] text-zinc-300 font-medium">Translated by AI</span>
                </h3>
                <div className="space-y-4">
                  {newsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-3 bg-zinc-100 rounded w-full" />
                          <div className="h-2 bg-zinc-50 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : news.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 italic">No news available for this asset.</p>
                  ) : news.map((item) => (
                    <div key={item.uuid} className="group">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block space-y-1"
                      >
                        <p className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {item.translatedTitle || item.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span>{item.publisher}</span>
                          <span>
                            {(() => {
                              const d = new Date(item.providerPublishTime * 1000);
                              if (isNaN(d.getTime())) return 'N/A';
                              return format(d, 'MMM d');
                            })()}
                          </span>
                        </div>
                      </a>
                    </div>
                  ))}
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">Region</span>
                    <span className="text-xs font-bold">Global</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 p-6">
                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
                  Data provided for informational purposes only. Past performance is not indicative of future results. All symbols are fetched via Yahoo Finance API.
                </p>
              </div>

              {/* Portfolio & DCA Simulator */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-zinc-900" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Quick View</h3>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium">{symbol} Holdings</p>
                  </div>
                  {currentSummary.totalShares > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Profit/Loss</p>
                      <p className={cn(
                        "text-xs font-bold",
                        latestPrice && latestPrice >= currentSummary.avgCost ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {latestPrice ? (((latestPrice - currentSummary.avgCost) / currentSummary.avgCost) * 100).toFixed(2) : 0}%
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Shares</p>
                      <p className="text-sm font-bold text-zinc-900">{currentSummary.totalShares}</p>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Avg Cost</p>
                      <p className="text-sm font-bold text-zinc-900">{formatCurrency(currentSummary.avgCost, stockData?.currency)}</p>
                    </div>
                  </div>

                  {latestPrice && (
                    <div className="pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">DCA Simulator</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Buy More</span>
                            <span className="text-xs font-bold text-zinc-900">+{simAdditionalShares} Shares</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1000" 
                            step="1"
                            value={simAdditionalShares}
                            onChange={(e) => setSimAdditionalShares(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                          />
                        </div>

                        <div className="bg-zinc-900 rounded-xl p-4 text-white">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">New Average</span>
                            <span className="text-xs font-bold text-emerald-400">
                              {formatCurrency(((currentSummary.totalShares * currentSummary.avgCost + simAdditionalShares * latestPrice) / (currentSummary.totalShares + simAdditionalShares || 1)), stockData?.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Value</span>
                            <span className="text-xs font-bold">
                              {formatCurrency(((currentSummary.totalShares + simAdditionalShares) * latestPrice), stockData?.currency)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase text-center border-b border-zinc-100 pb-2">Quick Simulation Table</p>
                          {[1, 5, 10, 50, 100].map(amount => {
                            const newAvg = (currentSummary.totalShares * currentSummary.avgCost + amount * latestPrice) / (currentSummary.totalShares + amount || 1);
                            return (
                              <div key={amount} className="flex justify-between items-center text-[11px] py-1">
                                <span className="text-zinc-500 font-medium">Buy +{amount} shares</span>
                                <span className="font-bold text-zinc-900">New Avg: {formatCurrency(newAvg, stockData?.currency)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
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
