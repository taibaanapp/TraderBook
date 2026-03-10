import { useState, useEffect } from 'react';

export function useChartSettings() {
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
  const [isLogScale, setIsLogScale] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [showStockProfile, setShowStockProfile] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showGeminiNews, setShowGeminiNews] = useState(false);
  const [showSaveImage, setShowSaveImage] = useState(false);
  const [showChartControls, setShowChartControls] = useState(false);
  const [showRecentStocks, setShowRecentStocks] = useState(true);
  const [showNotebook, setShowNotebook] = useState(true);

  useEffect(() => {
    const savedTicker = localStorage.getItem('showTicker');
    if (savedTicker !== null) setShowTicker(savedTicker === 'true');

    const savedStockProfile = localStorage.getItem('showStockProfile');
    if (savedStockProfile !== null) setShowStockProfile(savedStockProfile === 'true');

    const savedFinancials = localStorage.getItem('showFinancials');
    if (savedFinancials !== null) setShowFinancials(savedFinancials === 'true');

    const savedGeminiNews = localStorage.getItem('showGeminiNews');
    if (savedGeminiNews !== null) setShowGeminiNews(savedGeminiNews === 'true');

    const savedSaveImage = localStorage.getItem('showSaveImage');
    if (savedSaveImage !== null) setShowSaveImage(savedSaveImage === 'true');

    const savedEMA20 = localStorage.getItem('showEMA20');
    if (savedEMA20 !== null) setShowEMA20(savedEMA20 === 'true');

    const savedEMA50 = localStorage.getItem('showEMA50');
    if (savedEMA50 !== null) setShowEMA50(savedEMA50 === 'true');

    const savedRSI = localStorage.getItem('showRSI');
    if (savedRSI !== null) setShowRSI(savedRSI === 'true');

    const savedMACD = localStorage.getItem('showMACD');
    if (savedMACD !== null) setShowMACD(savedMACD === 'true');

    const savedInvertedY = localStorage.getItem('isInvertedY');
    if (savedInvertedY !== null) setIsInvertedY(savedInvertedY === 'true');

    const savedVWAP = localStorage.getItem('showVWAP');
    if (savedVWAP !== null) setShowVWAP(savedVWAP === 'true');

    const savedOBV = localStorage.getItem('showOBV');
    if (savedOBV !== null) setShowOBV(savedOBV === 'true');

    const savedVolume = localStorage.getItem('showVolume');
    if (savedVolume !== null) setShowVolume(savedVolume === 'true');

    const savedEMAX = localStorage.getItem('showEMAX');
    if (savedEMAX !== null) setShowEMAX(savedEMAX === 'true');

    const savedPickBo = localStorage.getItem('showPickBo');
    if (savedPickBo !== null) setShowPickBo(savedPickBo === 'true');

    const savedLogScale = localStorage.getItem('isLogScale');
    if (savedLogScale !== null) setIsLogScale(savedLogScale === 'true');

    const savedChartControls = localStorage.getItem('showChartControls');
    if (savedChartControls !== null) setShowChartControls(savedChartControls === 'true');

    const savedShowRecentStocks = localStorage.getItem('showRecentStocks');
    if (savedShowRecentStocks !== null) setShowRecentStocks(savedShowRecentStocks === 'true');

    const savedShowNotebook = localStorage.getItem('showNotebook');
    if (savedShowNotebook !== null) setShowNotebook(savedShowNotebook === 'true');
  }, []);

  useEffect(() => { localStorage.setItem('showTicker', String(showTicker)); }, [showTicker]);
  useEffect(() => { localStorage.setItem('showStockProfile', String(showStockProfile)); }, [showStockProfile]);
  useEffect(() => { localStorage.setItem('showFinancials', String(showFinancials)); }, [showFinancials]);
  useEffect(() => { localStorage.setItem('showGeminiNews', String(showGeminiNews)); }, [showGeminiNews]);
  useEffect(() => { localStorage.setItem('showSaveImage', String(showSaveImage)); }, [showSaveImage]);
  useEffect(() => { localStorage.setItem('showEMA20', String(showEMA20)); }, [showEMA20]);
  useEffect(() => { localStorage.setItem('showEMA50', String(showEMA50)); }, [showEMA50]);
  useEffect(() => { localStorage.setItem('showRSI', String(showRSI)); }, [showRSI]);
  useEffect(() => { localStorage.setItem('showMACD', String(showMACD)); }, [showMACD]);
  useEffect(() => { localStorage.setItem('isInvertedY', String(isInvertedY)); }, [isInvertedY]);
  useEffect(() => { localStorage.setItem('showVWAP', String(showVWAP)); }, [showVWAP]);
  useEffect(() => { localStorage.setItem('showOBV', String(showOBV)); }, [showOBV]);
  useEffect(() => { localStorage.setItem('showVolume', String(showVolume)); }, [showVolume]);
  useEffect(() => { localStorage.setItem('showEMAX', String(showEMAX)); }, [showEMAX]);
  useEffect(() => { localStorage.setItem('showPickBo', String(showPickBo)); }, [showPickBo]);
  useEffect(() => { localStorage.setItem('isLogScale', String(isLogScale)); }, [isLogScale]);
  useEffect(() => { localStorage.setItem('showChartControls', String(showChartControls)); }, [showChartControls]);
  useEffect(() => { localStorage.setItem('showRecentStocks', String(showRecentStocks)); }, [showRecentStocks]);
  useEffect(() => { localStorage.setItem('showNotebook', String(showNotebook)); }, [showNotebook]);

  return {
    showVWAP, setShowVWAP,
    showOBV, setShowOBV,
    showVolume, setShowVolume,
    showEMAX, setShowEMAX,
    showEMA20, setShowEMA20,
    showEMA50, setShowEMA50,
    showRSI, setShowRSI,
    showMACD, setShowMACD,
    showElliottWaves, setShowElliottWaves,
    showVolumeSpikes, setShowVolumeSpikes,
    showIchimoku, setShowIchimoku,
    showMoneyFlow, setShowMoneyFlow,
    showPickBo, setShowPickBo,
    isInvertedY, setIsInvertedY,
    isLogScale, setIsLogScale,
    chartType, setChartType,
    isFullscreen, setIsFullscreen,
    showTicker, setShowTicker,
    showStockProfile, setShowStockProfile,
    showFinancials, setShowFinancials,
    showGeminiNews, setShowGeminiNews,
    showSaveImage, setShowSaveImage,
    showChartControls, setShowChartControls,
    showRecentStocks, setShowRecentStocks,
    showNotebook, setShowNotebook
  };
}
