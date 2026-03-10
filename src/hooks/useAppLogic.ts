import { useState, useMemo, useEffect } from 'react';
import { useStockData } from './useStockData';
import { useChartSettings } from './useChartSettings';
import { useGeminiAnalysis } from './useGeminiAnalysis';
import { useSmartSR } from './useSmartSR';
import { 
  calculateCompositeMoneyFlow, 
  calculateVWAP, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD 
} from '../services/indicatorService';
import { calculateMoneyFlow } from '../services/moneyFlowService';
import { calculateIchimoku } from '../services/ichimokuService';
import { generateScenario, ScenarioResult } from '../services/scenarioService';
import { StockData } from '../types';

export function useAppLogic() {
  const stockDataHook = useStockData();
  const chartSettings = useChartSettings();
  const gemini = useGeminiAnalysis(stockDataHook.symbol);
  const smartSR = useSmartSR(stockDataHook.stockData?.data);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'chart' | 'portfolio'>('chart');
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationRate, setSimulationRate] = useState(-1.5);
  const [isScenarioMode, setIsScenarioMode] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSimTrade, setShowSimTrade] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isStandaloneSimTrade, setIsStandaloneSimTrade] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, data: any } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'simtrade') {
      setIsStandaloneSimTrade(true);
      const urlSymbol = params.get('symbol');
      const urlInterval = params.get('interval');
      if (urlSymbol) {
        stockDataHook.setSymbol(urlSymbol);
        stockDataHook.setSearchInput(urlSymbol);
      }
      if (urlInterval) stockDataHook.setChartInterval(urlInterval);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  const processedData = useMemo(() => {
    if (!stockDataHook.stockData?.data) return [];
    
    let rawData = [...stockDataHook.stockData.data];
    
    if (isSimulationMode) {
      const lastPoint = rawData[rawData.length - 1];
      const simulationDays = 30;
      const msPerInterval = stockDataHook.interval === '1h' ? 3600000 : 
                           stockDataHook.interval === '90m' ? 5400000 : 
                           stockDataHook.interval === '1wk' ? 604800000 : 86400000;
      
      let currentPrice = lastPoint.close;
      let currentDate = new Date(lastPoint.date);
      
      const randomNormal = (mean: number, stdDev: number) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
      };

      const targetDailyChange = simulationRate / 100;
      const volatility = 0.015;

      for (let i = 0; i < simulationDays; i++) {
        const weightedVolatility = volatility * (1 + Math.random() * 0.5);
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
    
    if (chartSettings.showIchimoku) {
      data = calculateIchimoku(data);
    }
    
    if (chartSettings.showMoneyFlow) {
      data = calculateMoneyFlow(data);
    }

    return data;
  }, [stockDataHook.stockData, isSimulationMode, simulationRate, stockDataHook.interval, chartSettings.showIchimoku, chartSettings.showMoneyFlow]);

  const handleScenarioToggle = () => {
    const nextMode = !isScenarioMode;
    setIsScenarioMode(nextMode);
    if (nextMode) {
      const result = generateScenario(processedData);
      setScenarioResult(result);
      chartSettings.setChartType('candlestick');
    } else {
      setScenarioResult(null);
    }
  };

  const handleOpenSimTrade = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=simtrade&symbol=${stockDataHook.symbol}&interval=${stockDataHook.interval}`;
    window.open(url, '_blank');
  };

  return {
    ...stockDataHook,
    ...chartSettings,
    ...gemini,
    ...smartSR,
    theme, setTheme,
    activeTab, setActiveTab,
    isSimulationMode, setIsSimulationMode,
    simulationRate, setSimulationRate,
    isScenarioMode, setIsScenarioMode,
    scenarioResult, setScenarioResult,
    hoveredData, setHoveredData,
    resetTrigger, setResetTrigger,
    isSettingsOpen, setIsSettingsOpen,
    isDashboardOpen, setIsDashboardOpen,
    isAdminPanelOpen, setIsAdminPanelOpen,
    adminClickCount, setAdminClickCount,
    currentTime,
    showSimTrade, setShowSimTrade,
    showSuggestions, setShowSuggestions,
    isStandaloneSimTrade,
    contextMenu, setContextMenu,
    processedData,
    handleScenarioToggle,
    handleOpenSimTrade
  };
}
