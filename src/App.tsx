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
  Sun,
  Brain,
  Activity,
  Settings,
  HelpCircle,
  SlidersHorizontal,
  History as HistoryIcon
} from 'lucide-react';
import { STOCK_LIST, TH_STOCKS, US_STOCKS } from './constants/stockList';
import { TradingChart } from './components/TradingChart';
import { Legend } from './components/Legend';
import { AssetInfo } from './components/AssetInfo';
import { ChartControls } from './components/ChartControls';
import { StockNotebook } from './components/StockNotebook';
import { MarketDetails } from './components/MarketDetails';
import { WhatIfBox } from './components/WhatIfBox';
import { FinancialIndicators } from './components/FinancialIndicators';
import { GeminiModal } from './components/GeminiModal';
import { StockProfile } from './components/StockProfile';
import { ReversalBox } from './components/ReversalBox';
import { SettingsModal } from './components/SettingsModal';
import { ReversalDashboard } from './components/ReversalDashboard';
import { AdminPanel } from './components/AdminPanel';
import { Logo } from './components/Logo';
import { MarketTicker } from './components/MarketTicker';
import { SimTradePanel } from './components/SimTradePanel';
import { RRGChart } from './components/RRGChart';
import { calculateCompositeMoneyFlow, calculateVWAP, calculateEMA, calculateRSI, calculateMACD } from './services/indicatorService';
import { calculateMoneyFlow, generateMoneyFlowInsights } from './services/moneyFlowService';
import { calculateIchimoku } from './services/ichimokuService';
import { analyzeReversal } from './services/reversalService';
import { simulateGoldenCross } from './services/simulationService';
import { calculateSmartSR, SRZone } from './services/smartSRService';
import { generateScenario, ScenarioResult } from './services/scenarioService';
import { getStockProfile, getGeminiNewsAnalysis, getElliottWaveAnalysis } from './services/geminiService';
import { getStockData, saveStockData } from './services/storageService';
import { getFlag, formatCurrency } from './utils/formatters';
import { TRANSLATIONS } from './constants/translations';
import { cn } from './utils/cn';
import { StockData, ApiResponse, Transaction, PortfolioSummary } from './types';

const INTERVALS = [
  { label: 'Hourly', value: '1h' },
  { label: '90 Minutes', value: '90m' },
  { label: 'Daily', value: '1d' },
  { label: 'Weekly', value: '1wk' },
];


export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [interval, setChartInterval] = useState('1d');
  const [stockData, setStockData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showOBV, setShowOBV] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showEMAX, setShowEMAX] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showElliottWaves, setShowElliottWaves] = useState(false);
  const [showVolumeSpikes, setShowVolumeSpikes] = useState(false);
  const [showIchimoku, setShowIchimoku] = useState(false);
  const [showMoneyFlow, setShowMoneyFlow] = useState(false);
  const [showPickBo, setShowPickBo] = useState(false);
  const [isInvertedY, setIsInvertedY] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationRate, setSimulationRate] = useState(-1.5);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'chart' | 'portfolio' | 'rrg'>('chart');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'TH' | 'US'>('ALL');
  const deferredSearchInput = useDeferredValue(searchInput);

  // Gemini State
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>(null);
  const [elliottAnalysis, setElliottAnalysis] = useState<string | null>(null);
  const [isElliottWaveAiEnabled, setIsElliottWaveAiEnabled] = useState(false);
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);
  const [pendingElliottWaveData, setPendingElliottWaveData] = useState<{data: StockData, label: string} | null>(null);
  const [geminiTargetDate, setGeminiTargetDate] = useState<string>('');
  const [geminiUsage, setGeminiUsage] = useState<{ count: number; limit: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customStocks, setCustomStocks] = useState<any[]>([]);
  const [stockProfile, setStockProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Collapsible states
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [isSimulationExpanded, setIsSimulationExpanded] = useState(true);
  const [isFinancialsExpanded, setIsFinancialsExpanded] = useState(false);
  const [isAiInsightEnabled, setIsAiInsightEnabled] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [showStockProfile, setShowStockProfile] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showGeminiNews, setShowGeminiNews] = useState(false);
  const [showSaveImage, setShowSaveImage] = useState(false);
  const [showChartControls, setShowChartControls] = useState(false);
  const [showRecentStocks, setShowRecentStocks] = useState(true);
  const [showNotebook, setShowNotebook] = useState(true);
  const [recentStocks, setRecentStocks] = useState<{symbol: string, percentChange: number, timestamp: number}[]>([]);
  
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const searchFormRef = React.useRef<HTMLFormElement>(null);

  const [showSimTrade, setShowSimTrade] = useState(false);
  const [isStandaloneSimTrade, setIsStandaloneSimTrade] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'simtrade') {
      setIsStandaloneSimTrade(true);
      const urlSymbol = params.get('symbol');
      const urlInterval = params.get('interval');
      if (urlSymbol) {
        setSymbol(urlSymbol);
        setSearchInput(urlSymbol);
      }
      if (urlInterval) setChartInterval(urlInterval);
    }
  }, []);

  const handleOpenSimTrade = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=simtrade&symbol=${symbol}&interval=${interval}`;
    window.open(url, '_blank');
  };

  // Smart S/R State
  const [isSmartSRMode, setIsSmartSRMode] = useState(false);
  const [isLogScale, setIsLogScale] = useState(false);
  const [isScenarioMode, setIsScenarioMode] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [selectedSRDate, setSelectedSRDate] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  const srResult = useMemo(() => {
    if (!isSmartSRMode || !selectedSRDate || !stockData?.data) return { zones: [] };
    return calculateSmartSR(stockData.data, selectedSRDate);
  }, [isSmartSRMode, selectedSRDate, stockData]);

  const srZones = srResult.zones;
  const srGuidance = srResult.guidance;

  useEffect(() => {
    if (isSmartSRMode) {
      setChartType('candlestick');
      setIsSimulationMode(false);
    } else {
      setSelectedSRDate(null);
      setRevealIndex(0);
      setIsRevealing(false);
    }
  }, [isSmartSRMode]);

  useEffect(() => {
    let timer: any;
    if (isRevealing && stockData?.data && selectedSRDate) {
      const selectedIdx = stockData.data.findIndex(d => d.date === selectedSRDate);
      const totalToReveal = stockData.data.length - 1 - selectedIdx;
      
      timer = window.setInterval(() => {
        setRevealIndex(prev => {
          if (prev >= totalToReveal) {
            setIsRevealing(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200); // Slower, more visible speed
    }
    return () => window.clearInterval(timer);
  }, [isRevealing, stockData, selectedSRDate]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    setIsScenarioMode(false);
    setScenarioResult(null);
    setIsSmartSRMode(false);
    setSelectedSRDate(null);
    setRevealIndex(0);
    setIsRevealing(false);
  }, [symbol]);

  const fetchStockProfile = async (targetSymbol: string, exchangeName?: string) => {
    if (!isAiInsightEnabled) return;
    setProfileLoading(true);
    try {
      const data = await getStockProfile(targetSymbol, exchangeName);
      setStockProfile(data);
    } catch (err) {
      console.error('Failed to fetch stock profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    setStockProfile(null);
  }, [symbol]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, data: any } | null>(null);

  const fetchGeminiUsage = async () => {
    try {
      const response = await fetch('/api/usage/gemini_news');
      if (response.ok) {
        const data = await response.json();
        setGeminiUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      setContextMenu(null);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGeminiAnalysis = async (data: any) => {
    setGeminiModalOpen(true);
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiAnalysis(null);
    setElliottAnalysis(null); // Reset Elliott analysis
    setGeminiTargetDate(new Date(data.date).toISOString().split('T')[0]);

    try {
      const result = await getGeminiNewsAnalysis(symbol, new Date(data.date).toISOString().split('T')[0]);
      setGeminiAnalysis(result);
      fetchGeminiUsage(); 
    } catch (err: any) {
      setGeminiError(err.message);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleElliottWaveAnalysis = (data: StockData, label: string) => {
    if (!isElliottWaveAiEnabled) return;
    setPendingElliottWaveData({ data, label });
    setShowAiConfirmation(true);
  };

  const confirmElliottWaveAnalysis = async () => {
    setShowAiConfirmation(false);
    if (!pendingElliottWaveData) return;
    
    const { data, label } = pendingElliottWaveData;
    setGeminiModalOpen(true);
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiAnalysis(null); // Reset News analysis
    setElliottAnalysis(null);
    setGeminiTargetDate(new Date(data.date).toISOString().split('T')[0]);

    try {
      // Prepare context data (last 20 bars)
      const idx = stockData?.data.findIndex(d => d.date === data.date) || -1;
      let contextData = '';
      if (idx !== -1 && stockData?.data) {
        const start = Math.max(0, idx - 20);
        const end = Math.min(stockData.data.length - 1, idx + 5);
        const slice = stockData.data.slice(start, end + 1);
        contextData = slice.map(d => 
          `${d.date}: O=${d.open}, H=${d.high}, L=${d.low}, C=${d.close}`
        ).join('\n');
      }

      const result = await getElliottWaveAnalysis(symbol, label, contextData);
      setElliottAnalysis(result);
      fetchGeminiUsage();
    } catch (err: any) {
      setGeminiError(err.message);
    } finally {
      setGeminiLoading(false);
      setPendingElliottWaveData(null);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const savedAiInsight = localStorage.getItem('isAiInsightEnabled');
    if (savedAiInsight !== null) {
      setIsAiInsightEnabled(savedAiInsight === 'true');
    }

    const savedTicker = localStorage.getItem('showTicker');
    if (savedTicker !== null) {
      setShowTicker(savedTicker === 'true');
    }

    const savedStockProfile = localStorage.getItem('showStockProfile');
    if (savedStockProfile !== null) {
      setShowStockProfile(savedStockProfile === 'true');
    }

    const savedFinancials = localStorage.getItem('showFinancials');
    if (savedFinancials !== null) {
      setShowFinancials(savedFinancials === 'true');
    }

    const savedGeminiNews = localStorage.getItem('showGeminiNews');
    if (savedGeminiNews !== null) {
      setShowGeminiNews(savedGeminiNews === 'true');
    }

    const savedSaveImage = localStorage.getItem('showSaveImage');
    if (savedSaveImage !== null) {
      setShowSaveImage(savedSaveImage === 'true');
    }

    const savedEMA20 = localStorage.getItem('showEMA20');
    if (savedEMA20 !== null) {
      setShowEMA20(savedEMA20 === 'true');
    }

    const savedEMA50 = localStorage.getItem('showEMA50');
    if (savedEMA50 !== null) {
      setShowEMA50(savedEMA50 === 'true');
    }

    const savedRSI = localStorage.getItem('showRSI');
    if (savedRSI !== null) {
      setShowRSI(savedRSI === 'true');
    }

    const savedMACD = localStorage.getItem('showMACD');
    if (savedMACD !== null) {
      setShowMACD(savedMACD === 'true');
    }

    const savedInvertedY = localStorage.getItem('isInvertedY');
    if (savedInvertedY !== null) {
      setIsInvertedY(savedInvertedY === 'true');
    }

    const savedVWAP = localStorage.getItem('showVWAP');
    if (savedVWAP !== null) {
      setShowVWAP(savedVWAP === 'true');
    }

    const savedOBV = localStorage.getItem('showOBV');
    if (savedOBV !== null) {
      setShowOBV(savedOBV === 'true');
    }

    const savedVolume = localStorage.getItem('showVolume');
    if (savedVolume !== null) {
      setShowVolume(savedVolume === 'true');
    }

    const savedEMAX = localStorage.getItem('showEMAX');
    if (savedEMAX !== null) {
      setShowEMAX(savedEMAX === 'true');
    }

    const savedPickBo = localStorage.getItem('showPickBo');
    if (savedPickBo !== null) {
      setShowPickBo(savedPickBo === 'true');
    }

    const savedLogScale = localStorage.getItem('isLogScale');
    if (savedLogScale !== null) {
      setIsLogScale(savedLogScale === 'true');
    }

    const savedChartControls = localStorage.getItem('showChartControls');
    if (savedChartControls !== null) {
      setShowChartControls(savedChartControls === 'true');
    }

    const savedShowRecentStocks = localStorage.getItem('showRecentStocks');
    if (savedShowRecentStocks !== null) {
      setShowRecentStocks(savedShowRecentStocks === 'true');
    }

    const savedShowNotebook = localStorage.getItem('showNotebook');
    if (savedShowNotebook !== null) {
      setShowNotebook(savedShowNotebook === 'true');
    }

    const savedElliottWaveAi = localStorage.getItem('isElliottWaveAiEnabled');
    if (savedElliottWaveAi !== null) {
      setIsElliottWaveAiEnabled(savedElliottWaveAi === 'true');
    }

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
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isAiInsightEnabled', String(isAiInsightEnabled));
  }, [isAiInsightEnabled]);

  useEffect(() => {
    localStorage.setItem('showTicker', String(showTicker));
  }, [showTicker]);

  useEffect(() => {
    localStorage.setItem('showStockProfile', String(showStockProfile));
  }, [showStockProfile]);

  useEffect(() => {
    localStorage.setItem('showFinancials', String(showFinancials));
  }, [showFinancials]);

  useEffect(() => {
    localStorage.setItem('showGeminiNews', String(showGeminiNews));
  }, [showGeminiNews]);

  useEffect(() => {
    localStorage.setItem('showSaveImage', String(showSaveImage));
  }, [showSaveImage]);

  useEffect(() => {
    localStorage.setItem('showEMA20', String(showEMA20));
  }, [showEMA20]);

  useEffect(() => {
    localStorage.setItem('showEMA50', String(showEMA50));
  }, [showEMA50]);

  useEffect(() => {
    localStorage.setItem('showRSI', String(showRSI));
  }, [showRSI]);

  useEffect(() => {
    localStorage.setItem('showMACD', String(showMACD));
  }, [showMACD]);

  useEffect(() => {
    localStorage.setItem('isInvertedY', String(isInvertedY));
  }, [isInvertedY]);

  useEffect(() => {
    localStorage.setItem('showVWAP', String(showVWAP));
  }, [showVWAP]);

  useEffect(() => {
    localStorage.setItem('showOBV', String(showOBV));
  }, [showOBV]);

  useEffect(() => {
    localStorage.setItem('showVolume', String(showVolume));
  }, [showVolume]);

  useEffect(() => {
    localStorage.setItem('showEMAX', String(showEMAX));
  }, [showEMAX]);

  useEffect(() => {
    localStorage.setItem('showPickBo', String(showPickBo));
  }, [showPickBo]);

  useEffect(() => {
    localStorage.setItem('isLogScale', String(isLogScale));
  }, [isLogScale]);

  useEffect(() => {
    localStorage.setItem('showChartControls', String(showChartControls));
  }, [showChartControls]);

  useEffect(() => {
    localStorage.setItem('showRecentStocks', String(showRecentStocks));
  }, [showRecentStocks]);

  useEffect(() => {
    localStorage.setItem('showNotebook', String(showNotebook));
  }, [showNotebook]);

  useEffect(() => {
    localStorage.setItem('isElliottWaveAiEnabled', String(isElliottWaveAiEnabled));
  }, [isElliottWaveAiEnabled]);

  useEffect(() => {
    localStorage.setItem('recentStocks', JSON.stringify(recentStocks));
  }, [recentStocks]);

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
    data = calculateEMA(data, 20, 'ema20');
    data = calculateEMA(data, 50, 'ema50');
    data = calculateEMA(data, 135, 'ema135');
    data = calculateRSI(data);
    data = calculateMACD(data);
    
    // Always calculate Ichimoku if we want to show it, or just calculate it always?
    // It adds 26 bars to the end. If we do it always, the chart x-axis will always extend.
    // Let's only do it if showIchimoku is true.
    if (showIchimoku) {
      data = calculateIchimoku(data);
    }
    
    if (showMoneyFlow) {
      data = calculateMoneyFlow(data);
    }

    return data;
  }, [stockData, isSimulationMode, simulationRate, interval, showIchimoku, showMoneyFlow]);

  const handleScenarioToggle = () => {
    const nextMode = !isScenarioMode;
    setIsScenarioMode(nextMode);
    if (nextMode) {
      const result = generateScenario(processedData);
      setScenarioResult(result);
      setChartType('candlestick'); // Force candlestick for ghost candles
    } else {
      setScenarioResult(null);
    }
  };

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
      
      // Save to custom stocks if not in predefined list
      const isPredefined = STOCK_LIST.some(s => s.symbol === targetSymbol);
      if (!isPredefined) {
        await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: targetSymbol,
            name: data.shortName || targetSymbol,
            market: targetSymbol.endsWith('.BK') ? 'TH' : 'US'
          })
        });
        // Refresh custom stocks
        const res = await fetch('/api/stocks');
        if (res.ok) {
          const customData = await res.json();
          setCustomStocks(customData);
        }
      }
      
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
    
    // Merge custom stocks
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

  const moneyFlowInsights = useMemo(() => {
    if (!showMoneyFlow || !processedData || processedData.length === 0) return { insights: [], summary: null };
    return generateMoneyFlowInsights(processedData);
  }, [processedData, showMoneyFlow]);

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

  if (isStandaloneSimTrade) {
    return (
      <SimTradePanel
        symbol={symbol}
        interval={interval}
        data={stockData?.data || []}
        loading={loading}
        error={error}
        theme={theme}
        isStandalone={true}
      />
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8 text-center selection:bg-rose-500 selection:text-white">
        <div className="max-w-md space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-rose-500/20 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-zinc-950 rounded-3xl flex items-center justify-center border border-zinc-700 shadow-2xl">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 rounded-full border border-zinc-700">
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
        theme === 'dark' ? "bg-[#030712] border-zinc-700" : "bg-white border-zinc-200"
      )}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => {
              setAdminClickCount(prev => {
                if (prev >= 4) {
                  setIsAdminPanelOpen(true);
                  return 0;
                }
                return prev + 1;
              });
            }}
          >
            <Logo size={40} />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight">CrossVision</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-500 dark:text-rose-400 leading-none">See the Cross before it happens.</p>
            </div>
          </div>

          <form 
            ref={searchFormRef}
            onSubmit={handleSearch} 
            className="flex-1 max-w-xl mx-4 sm:mx-8 relative"
          >
            <div className="relative group flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={TRANSLATIONS.TH.common.search_placeholder}
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
              <button
                type="submit"
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95",
                  theme === 'dark'
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-rose-500 text-white hover:bg-rose-600"
                )}
              >
                {TRANSLATIONS.TH.common.search || 'ค้นหา'}
              </button>
            </div>
            
            {showSuggestions && (
              <div className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 border",
                theme === 'dark' ? "bg-zinc-900 border-zinc-700 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "bg-white border-zinc-200 shadow-2xl"
              )}>
                <div className={cn(
                  "flex p-1 border-b",
                  theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-zinc-50 border-zinc-100"
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
                      {m === 'ALL' ? TRANSLATIONS.TH.common.all : (m === 'TH' ? TRANSLATIONS.TH.common.th_stocks : TRANSLATIONS.TH.common.us_stocks)}
                    </button>
                  ))}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-400 text-sm italic">
                      {TRANSLATIONS.TH.common.search_not_found}
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

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === 'dark' ? "text-zinc-500" : "text-zinc-400")}>
                System Time
              </p>
              <p className={cn("text-sm font-black font-mono tracking-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                {currentTime.toLocaleString('th-TH', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSimTrade}
                className={cn(
                  "p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95",
                  theme === 'dark' 
                    ? "bg-zinc-800 border-zinc-700 text-indigo-400 hover:bg-zinc-700" 
                    : "bg-white border-zinc-200 text-indigo-500 hover:bg-zinc-50"
                )}
                title="SimTrade AI"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsDashboardOpen(true)}
                className={cn(
                  "p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95",
                  theme === 'dark' 
                    ? "bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700" 
                    : "bg-white border-zinc-200 text-emerald-500 hover:bg-zinc-50"
                )}
                title="Reversal Dashboard"
              >
                <Activity className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowChartControls(!showChartControls)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95",
                  showChartControls
                    ? (theme === 'dark' ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-zinc-100 border-zinc-300 text-zinc-900")
                    : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")
                )}
                title="Indicators & Tools"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tight">IND</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={cn(
                  "p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95",
                  theme === 'dark' 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" 
                    : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                )}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95",
                  theme === 'dark' 
                    ? "bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700" 
                    : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                )}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

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
                onClick={() => setActiveTab('rrg')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                  activeTab === 'rrg' 
                    ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <Activity className="w-3.5 h-3.5" /> RRG
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

      {showTicker && (
        <MarketTicker 
          theme={theme} 
          onSelect={(newSymbol) => {
            setSymbol(newSymbol);
            setSearchInput(newSymbol);
          }} 
        />
      )}

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {activeTab === 'rrg' ? (
          <RRGChart theme={theme} />
        ) : error ? (
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
              {showStockProfile && (
                <StockProfile 
                  theme={theme} 
                  data={stockProfile} 
                  loading={profileLoading} 
                  symbol={symbol} 
                  isExpanded={isProfileExpanded}
                  onToggle={() => setIsProfileExpanded(!isProfileExpanded)}
                  isAiEnabled={isAiInsightEnabled}
                  onToggleAi={() => setIsAiInsightEnabled(!isAiInsightEnabled)}
                  onFetch={() => fetchStockProfile(symbol, stockData?.fullExchangeName)}
                />
              )}
              
              {showRecentStocks && recentStocks.length > 0 && (
                <div className={cn(
                  "rounded-2xl border p-4 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <HistoryIcon className={cn("w-4 h-4", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")} />
                    <h3 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                      Recently Viewed
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentStocks.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setSymbol(stock.symbol);
                          setSearchInput(stock.symbol);
                        }}
                        className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold tracking-wider transition-colors border",
                          stock.percentChange > 0 
                            ? (theme === 'dark' ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100")
                            : stock.percentChange < 0
                              ? (theme === 'dark' ? "bg-rose-900/20 border-rose-900/30 text-rose-400 hover:bg-rose-900/40" : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100")
                              : (theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200")
                        )}
                      >
                        #{stock.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showNotebook && (
                <StockNotebook 
                  symbol={symbol} 
                  currentPrice={latestPrice || 0} 
                  currency={stockData?.currency} 
                  theme={theme}
                />
              )}
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

              {showChartControls && (
                <ChartControls 
                  interval={interval}
                  setInterval={setChartInterval}
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
                  showEMA20={showEMA20}
                  setShowEMA20={setShowEMA20}
                  showEMA50={showEMA50}
                  setShowEMA50={setShowEMA50}
                  showRSI={showRSI}
                  setShowRSI={setShowRSI}
                  showMACD={showMACD}
                  setShowMACD={setShowMACD}
                  showElliottWaves={showElliottWaves}
                  setShowElliottWaves={setShowElliottWaves}
                  showVolumeSpikes={showVolumeSpikes}
                  setShowVolumeSpikes={setShowVolumeSpikes}
                  showIchimoku={showIchimoku}
                  setShowIchimoku={setShowIchimoku}
                  showMoneyFlow={showMoneyFlow}
                  setShowMoneyFlow={setShowMoneyFlow}
                  showPickBo={showPickBo}
                  setShowPickBo={setShowPickBo}
                  isInvertedY={isInvertedY}
                  setIsInvertedY={setIsInvertedY}
                  isLogScale={isLogScale}
                  setIsLogScale={setIsLogScale}
                  isSimulationMode={isSimulationMode}
                  setIsSimulationMode={setIsSimulationMode}
                  isSmartSRMode={isSmartSRMode}
                  setIsSmartSRMode={setIsSmartSRMode}
                  isScenarioMode={isScenarioMode}
                  onToggleScenario={handleScenarioToggle}
                  onReset={() => {
                    setResetTrigger(prev => prev + 1);
                    setIsSimulationMode(false);
                    setIsSmartSRMode(false);
                  }}
                  onRefresh={() => fetchData(symbol, interval, true)}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                  theme={theme}
                />
              )}

              {/* Chart */}
              <div className={cn(
                "rounded-2xl border p-6 h-[500px] relative overflow-hidden group transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-950 border-zinc-700 shadow-xl" : "bg-white border-zinc-200 shadow-xl",
                isFullscreen && "fixed inset-0 z-[100] h-screen w-screen rounded-none p-0 flex flex-col"
              )}>
                {isFullscreen && (
                  <div className="absolute top-4 left-4 right-4 z-[110]">
                    <ChartControls 
                      interval={interval}
                      setInterval={setChartInterval}
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
                      showEMA20={showEMA20}
                      setShowEMA20={setShowEMA20}
                      showEMA50={showEMA50}
                      setShowEMA50={setShowEMA50}
                      showRSI={showRSI}
                      setShowRSI={setShowRSI}
                      showMACD={showMACD}
                      setShowMACD={setShowMACD}
                      showElliottWaves={showElliottWaves}
                      setShowElliottWaves={setShowElliottWaves}
                      showVolumeSpikes={showVolumeSpikes}
                      setShowVolumeSpikes={setShowVolumeSpikes}
                      showIchimoku={showIchimoku}
                      setShowIchimoku={setShowIchimoku}
                      showMoneyFlow={showMoneyFlow}
                      setShowMoneyFlow={setShowMoneyFlow}
                      showPickBo={showPickBo}
                      setShowPickBo={setShowPickBo}
                      isInvertedY={isInvertedY}
                      setIsInvertedY={setIsInvertedY}
                      isLogScale={isLogScale}
                      setIsLogScale={setIsLogScale}
                      isSimulationMode={isSimulationMode}
                      setIsSimulationMode={setIsSimulationMode}
                      isSmartSRMode={isSmartSRMode}
                      setIsSmartSRMode={setIsSmartSRMode}
                      isScenarioMode={isScenarioMode}
                      onToggleScenario={handleScenarioToggle}
                      onReset={() => {
                        setResetTrigger(prev => prev + 1);
                        setIsSimulationMode(false);
                        setIsSmartSRMode(false);
                      }}
                      onRefresh={() => fetchData(symbol, interval, true)}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                      onSymbolChange={(sym) => {
                        setSymbol(sym);
                        setSearchInput(sym);
                      }}
                      theme={theme}
                    />
                  </div>
                )}
                {loading && !isFullscreen && (
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
                
                <div className={cn("h-full w-full relative", isFullscreen && "pt-20")}>
                  <TradingChart 
                    symbol={symbol}
                    data={processedData} 
                    exchangeTimezoneName={stockData?.exchangeTimezoneName}
                    showVWAP={showVWAP} 
                    showOBV={showOBV} 
                    showVolume={showVolume}
                    showEMAX={showEMAX}
                    showEMA20={showEMA20}
                    showEMA50={showEMA50}
                    showRSI={showRSI}
                    showMACD={showMACD}
                    showElliottWaves={showElliottWaves}
                    showVolumeSpikes={showVolumeSpikes}
                    showIchimoku={showIchimoku}
                    showMoneyFlow={showMoneyFlow}
                    showPickBo={showPickBo}
                    isInvertedY={isInvertedY}
                    chartType={chartType}
                    onHover={setHoveredData}
                    onRightClick={(data, x, y) => {
                      setContextMenu({ x, y, data });
                      fetchGeminiUsage();
                    }}
                    onElliottWaveClick={handleElliottWaveAnalysis}
                    resetTrigger={resetTrigger}
                    isLogScale={isLogScale}
                    isSimulationMode={isSimulationMode}
                    isSmartSRMode={isSmartSRMode}
                    isScenarioMode={isScenarioMode}
                    scenarioResult={scenarioResult}
                    selectedSRDate={selectedSRDate}
                    onSelectSRDate={setSelectedSRDate}
                    srZones={srZones}
                    srGuidance={srGuidance}
                    revealIndex={revealIndex}
                    isRevealing={isRevealing}
                    onToggleReveal={() => setIsRevealing(!isRevealing)}
                    theme={theme}
                    showSaveImage={showSaveImage}
                  />

                  {/* Context Menu */}
                  {contextMenu && (
                    <div 
                      className={cn(
                        "fixed z-[100] w-56 py-2 rounded-xl border shadow-2xl transition-all",
                        theme === 'dark' ? "bg-[#030712] border-zinc-700" : "bg-white border-zinc-200"
                      )}
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                      {showGeminiNews && (
                        <button
                          onClick={() => {
                            handleGeminiAnalysis(contextMenu.data);
                            setContextMenu(null);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left transition-colors group",
                            theme === 'dark' ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                          )}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <Brain className="w-4 h-4 text-rose-500" />
                            <span className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-300" : "text-zinc-600")}>
                              {TRANSLATIONS.TH.gemini.analyze_with_gemini}
                            </span>
                          </div>
                          {geminiUsage && (
                            <div className="flex items-center justify-between pl-7">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{TRANSLATIONS.TH.gemini.daily_quota}</span>
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded",
                                geminiUsage.count >= geminiUsage.limit 
                                  ? "bg-rose-500/10 text-rose-500" 
                                  : "bg-emerald-500/10 text-emerald-500"
                              )}>
                                {TRANSLATIONS.TH.gemini.remaining} {geminiUsage.limit - geminiUsage.count} / {geminiUsage.limit}
                              </span>
                            </div>
                          )}
                        </button>
                      )}
                      {!showGeminiNews && (
                        <div className="px-4 py-3 text-xs text-zinc-500 font-bold uppercase tracking-widest text-center">
                          Menu Disabled
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {showMoneyFlow && (
                <div className="space-y-6">
                  {/* Trade Setup Summary */}
                  {moneyFlowInsights.summary && (
                    <div className={cn(
                      "rounded-2xl border p-6 transition-colors duration-300 animate-in fade-in slide-in-from-top-4",
                      theme === 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"
                    )}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                            Trade Setup Summary
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">[System Note]</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={cn("p-4 rounded-xl border", theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Status</p>
                          <p className={cn("text-sm font-black", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                            {moneyFlowInsights.summary.currentStatus}
                          </p>
                        </div>
                        <div className={cn("p-4 rounded-xl border", theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Smart Money Action</p>
                          <p className={cn("text-sm font-black", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                            {moneyFlowInsights.summary.smartMoneyAction}
                          </p>
                        </div>
                        <div className={cn("p-4 rounded-xl border", 
                          moneyFlowInsights.summary.actionBias.includes('Accumulate') 
                            ? "bg-emerald-500/10 border-emerald-500/20" 
                            : (theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200")
                        )}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Action Bias</p>
                          <p className={cn("text-sm font-black", 
                            moneyFlowInsights.summary.actionBias.includes('Accumulate') ? "text-emerald-500" : (theme === 'dark' ? "text-zinc-100" : "text-zinc-900")
                          )}>
                            {moneyFlowInsights.summary.actionBias}
                          </p>
                        </div>
                      </div>

                      {moneyFlowInsights.insights.length > 0 && (
                        <div className="mt-6 space-y-3 border-t border-zinc-700/50 pt-5">
                          {moneyFlowInsights.insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <p className={cn("text-sm font-medium leading-relaxed", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>
                                {insight}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legend Box */}
                  <div className={cn(
                    "rounded-2xl border p-6 transition-colors duration-300",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-4 h-4 text-zinc-500" />
                      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                        คำอธิบายระบบ Money Flow & Climax
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-black border border-rose-500/20">CLIMAX</span>
                          <span className={cn("text-sm font-black uppercase tracking-tight", theme === 'dark' ? "text-zinc-200" : "text-zinc-800")}>Selling Climax</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                          <span className="font-bold text-rose-500/80">ระบบคำนวณ:</span> Vol &gt; 2x Avg และราคาลง &gt; 20% จากจุดสูงสุด มักเป็นสัญญาณ Panic Sell ที่รุนแรงจนแรงขายเริ่มหมด
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20">ABSORB</span>
                          <span className={cn("text-sm font-black uppercase tracking-tight", theme === 'dark' ? "text-zinc-200" : "text-zinc-800")}>Absorption</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                          <span className="font-bold text-emerald-500/80">ระบบคำนวณ:</span> Vol &gt; 1.5x Avg และฝั่งซื้อ &gt; ฝั่งขาย บ่งบอกว่า "เงินก้อนใหญ่" กำลังรับซื้อของในปริมาณมาก
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600/10 text-rose-600 text-[10px] font-black border border-rose-600/20">PANIC</span>
                          <span className={cn("text-sm font-black uppercase tracking-tight", theme === 'dark' ? "text-zinc-200" : "text-zinc-800")}>Panic Selling</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                          <span className="font-bold text-rose-600/80">ระบบคำนวณ:</span> Vol แดงสูงปรี๊ด (&gt; 1.5x Avg) พร้อมราคาทำ New Low ในรอบ 20 แท่ง เป็นจุดที่คนส่วนใหญ่ยอมแพ้
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20">EXHAUST</span>
                          <span className={cn("text-sm font-black uppercase tracking-tight", theme === 'dark' ? "text-zinc-200" : "text-zinc-800")}>Exhaustion</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                          <span className="font-bold text-amber-500/80">ระบบคำนวณ:</span> วอลุ่มแห้งสนิท (&lt; 0.5x Avg) หลังจากราคาลงมาลึก (&gt; 15% Drawdown) แปลว่าคนขายหมดมือแล้ว
                        </p>
                      </div>
                      <div className="md:col-span-2 pt-4 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-0.5 bg-blue-500 opacity-60" />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'dark' ? "text-blue-400" : "text-blue-600")}>% Drawdown Line (Blue Line)</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                          เส้นแสดงการย่อตัวจากจุดสูงสุดสะสม ใช้หาจุด "Discount" หรือ Margin of Safety สำหรับหุ้นพื้นฐานดี
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <WhatIfBox 
                result={simulationResult}
                currency={stockData?.currency}
                interval={interval}
                theme={theme}
                layout="horizontal"
                isExpanded={isSimulationExpanded}
                onToggle={() => setIsSimulationExpanded(!isSimulationExpanded)}
              />

              <ReversalBox 
                symbol={symbol}
                analysis={stockData?.data ? analyzeReversal(stockData.data) : null}
                currentPrice={latestPrice || 0}
                currency={stockData?.currency}
                theme={theme}
              />

              {showFinancials && (
                <FinancialIndicators 
                  symbol={symbol} 
                  theme={theme} 
                  isExpanded={isFinancialsExpanded}
                  onToggle={() => setIsFinancialsExpanded(!isFinancialsExpanded)}
                />
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <MarketDetails 
                symbol={symbol}
                data={stockData}
                hoveredData={hoveredData}
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
                        <tr className={cn("border-b", theme === 'dark' ? "border-zinc-700" : "border-zinc-100")}>
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
                              theme === 'dark' ? "border-zinc-700/50 hover:bg-zinc-800/30" : "border-zinc-50 hover:bg-zinc-50/50"
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
      {/* Gemini Modal */}
      <GeminiModal 
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        symbol={symbol}
        date={geminiTargetDate}
        loading={geminiLoading}
        error={geminiError}
        analysis={geminiAnalysis}
        elliottAnalysis={elliottAnalysis}
        theme={theme}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        theme={theme}
        isAiInsightEnabled={isAiInsightEnabled}
        onToggleAiInsight={() => setIsAiInsightEnabled(!isAiInsightEnabled)}
        showTicker={showTicker}
        onToggleTicker={() => setShowTicker(!showTicker)}
        showStockProfile={showStockProfile}
        onToggleStockProfile={() => setShowStockProfile(!showStockProfile)}
        showFinancials={showFinancials}
        onToggleFinancials={() => setShowFinancials(!showFinancials)}
        showGeminiNews={showGeminiNews}
        onToggleGeminiNews={() => setShowGeminiNews(!showGeminiNews)}
        showSaveImage={showSaveImage}
        onToggleSaveImage={() => setShowSaveImage(!showSaveImage)}
        showRecentStocks={showRecentStocks}
        onToggleRecentStocks={() => setShowRecentStocks(!showRecentStocks)}
        showNotebook={showNotebook}
        onToggleNotebook={() => setShowNotebook(!showNotebook)}
        isElliottWaveAiEnabled={isElliottWaveAiEnabled}
        onToggleElliottWaveAi={() => setIsElliottWaveAiEnabled(!isElliottWaveAiEnabled)}
      />

      {/* AI Confirmation Modal */}
      {showAiConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowAiConfirmation(false)}
          />
          <div className={cn(
            "relative w-full max-w-sm rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle className="w-8 h-8" />
                <h3 className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                  Confirm AI Analysis
                </h3>
              </div>
              <p className={cn("text-sm leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
                This action will use your AI quota. Are you sure you want to proceed with the Elliott Wave analysis?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAiConfirmation(false)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm transition-colors",
                    theme === 'dark' ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmElliottWaveAnalysis}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReversalDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
        theme={theme}
      />

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        theme={theme}
      />

      {showSimTrade && stockData && (
        <SimTradePanel
          symbol={symbol}
          interval={interval}
          data={stockData.data}
          onClose={() => setShowSimTrade(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
