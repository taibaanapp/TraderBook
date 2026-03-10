import React from 'react';
import { 
  Monitor, 
  RefreshCcw,
  AlertCircle,
  Brain,
  X,
  Plus,
  Save,
  ChevronRight,
  Activity,
  TrendingUp
} from 'lucide-react';
import { TradingChart, TradingChartHandle } from '../TradingChart';
import { Legend } from '../Legend';
import { AssetInfo } from '../AssetInfo';
import { ChartControls } from '../ChartControls';
import { StockNotebook } from '../StockNotebook';
import { MarketDetails } from '../MarketDetails';
import { SimTradePanel } from '../SimTradePanel';
import { ReversalDashboard } from '../ReversalDashboard';
import { cn } from '../../utils/cn';
import { TRANSLATIONS } from '../../constants/translations';
import { StockData, ApiResponse, ScenarioResult } from '../../types';

interface MainContentProps {
  theme: 'light' | 'dark';
  activeTab: 'chart' | 'portfolio';
  setActiveTab: (tab: 'chart' | 'portfolio') => void;
  symbol: string;
  stockData: ApiResponse | null;
  processedData: StockData[];
  loading: boolean;
  error: string | null;
  fetchData: (symbol: string, interval: string, forceRefresh?: boolean) => void;
  interval: string;
  setChartInterval: (interval: string) => void;
  showVWAP: boolean;
  showOBV: boolean;
  showVolume: boolean;
  showEMAX: boolean;
  showEMA20: boolean;
  showEMA50: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showElliottWaves: boolean;
  showVolumeSpikes: boolean;
  showIchimoku: boolean;
  showMoneyFlow: boolean;
  showPickBo: boolean;
  isInvertedY: boolean;
  isLogScale: boolean;
  chartType: 'line' | 'candlestick';
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  showChartControls: boolean;
  showNotebook: boolean;
  isSimulationMode: boolean;
  isSmartSRMode: boolean;
  isScenarioMode: boolean;
  scenarioResult: ScenarioResult | null;
  selectedSRDate: string | null;
  setSelectedSRDate: (date: string | null) => void;
  srZones: any[];
  srGuidance: string;
  revealIndex: number;
  isRevealing: boolean;
  setIsRevealing: (revealing: boolean) => void;
  hoveredData: any;
  setHoveredData: (data: any) => void;
  setContextMenu: (menu: { x: number, y: number, data: any } | null) => void;
  contextMenu: { x: number, y: number, data: any } | null;
  handleGeminiAnalysis: (data: any) => void;
  handleElliottWaveAnalysis: (data: any, label: string) => void;
  resetTrigger: number;
  setResetTrigger: (trigger: number | ((prev: number) => number)) => void;
  showSaveImage: boolean;
  showSimTrade: boolean;
  setShowSimTrade: (show: boolean) => void;
  handleOpenSimTrade: () => void;
  isStandaloneSimTrade: boolean;
  chartRef: React.RefObject<TradingChartHandle>;
}

export const MainContent: React.FC<MainContentProps> = ({
  theme,
  activeTab,
  setActiveTab,
  symbol,
  stockData,
  processedData,
  loading,
  error,
  fetchData,
  interval,
  setChartInterval,
  showVWAP,
  showOBV,
  showVolume,
  showEMAX,
  showEMA20,
  showEMA50,
  showRSI,
  showMACD,
  showElliottWaves,
  showVolumeSpikes,
  showIchimoku,
  showMoneyFlow,
  showPickBo,
  isInvertedY,
  isLogScale,
  chartType,
  isFullscreen,
  setIsFullscreen,
  showChartControls,
  showNotebook,
  isSimulationMode,
  isSmartSRMode,
  isScenarioMode,
  scenarioResult,
  selectedSRDate,
  setSelectedSRDate,
  srZones,
  srGuidance,
  revealIndex,
  isRevealing,
  setIsRevealing,
  hoveredData,
  setHoveredData,
  setContextMenu,
  contextMenu,
  handleGeminiAnalysis,
  handleElliottWaveAnalysis,
  resetTrigger,
  setResetTrigger,
  showSaveImage,
  showSimTrade,
  setShowSimTrade,
  handleOpenSimTrade,
  isStandaloneSimTrade,
  chartRef
}) => {
  const latestPrice = stockData?.data[stockData.data.length - 1]?.close;
  const previousPrice = stockData?.data[stockData.data.length - 2]?.close;
  const priceChange = latestPrice && previousPrice ? latestPrice - previousPrice : 0;
  const percentChange = latestPrice && previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 w-fit">
        <button
          onClick={() => setActiveTab('chart')}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'chart' 
              ? (theme === 'dark' ? "bg-zinc-800 text-zinc-100 shadow-lg" : "bg-white text-zinc-900 shadow-sm")
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          {TRANSLATIONS.TH.common.chart}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'portfolio' 
              ? (theme === 'dark' ? "bg-zinc-800 text-zinc-100 shadow-lg" : "bg-white text-zinc-900 shadow-sm")
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          {TRANSLATIONS.TH.common.portfolio}
        </button>
      </div>

      {activeTab === 'chart' ? (
        <>
          {/* Asset Info & Market Details */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <AssetInfo 
                symbol={symbol} 
                price={latestPrice || 0} 
                change={priceChange} 
                percentChange={percentChange}
                data={stockData}
              />
            </div>
            <div className="xl:col-span-1">
              <MarketDetails 
                symbol={symbol}
                data={stockData}
                hoveredData={hoveredData}
                theme={theme}
              />
            </div>
          </div>

          {/* Chart Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  {['1h', '90m', '1d', '1wk'].map((i) => (
                    <button
                      key={i}
                      onClick={() => setChartInterval(i)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        interval === i 
                          ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100" : "bg-white text-zinc-900 shadow-sm")
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => fetchData(symbol, interval, true)}
                  disabled={loading}
                  className={cn(
                    "p-2 rounded-lg transition-all border",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50",
                    loading && "animate-spin"
                  )}
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={cn(
                    "p-2 rounded-lg transition-all border",
                    theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              {/* Chart */}
              <div className={cn(
                "rounded-2xl border p-6 h-[500px] relative overflow-hidden group transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-950 border-zinc-700 shadow-xl" : "bg-white border-zinc-200 shadow-xl",
                isFullscreen && "fixed inset-0 z-[100] h-screen w-screen rounded-none p-0 flex flex-col"
              )}>
                {isFullscreen && (
                  <div className={cn(
                    "p-4 border-b flex items-center justify-between",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    <div className="flex items-center gap-4">
                      <h2 className={cn("text-xl font-black italic", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                        {symbol} <span className="text-rose-500">TERMINAL</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        {['1h', '90m', '1d', '1wk'].map((i) => (
                          <button
                            key={i}
                            onClick={() => setChartInterval(i)}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                              interval === i 
                                ? (theme === 'dark' ? "bg-zinc-700 text-zinc-100" : "bg-white text-zinc-900 shadow-sm")
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsFullscreen(false)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCcw className={cn("w-8 h-8 animate-spin", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")} />
                      <p className={cn("text-base font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Optimizing Data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
                    <div className="max-w-sm">
                      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                      <h3 className={cn("text-lg font-bold mb-2", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Terminal Error</h3>
                      <p className="text-zinc-500 text-sm mb-6">{error}</p>
                      <button 
                        onClick={() => fetchData(symbol, interval, true)}
                        className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={cn("h-full w-full relative", isFullscreen && "pt-20")}>
                    <TradingChart 
                      ref={chartRef}
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
                        if (isSmartSRMode) {
                          setSelectedSRDate(data.date);
                        } else {
                          setContextMenu({ x, y, data });
                        }
                      }}
                      onElliottWaveClick={handleElliottWaveAnalysis}
                      resetTrigger={resetTrigger}
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
                      isLogScale={isLogScale}
                      showSaveImage={showSaveImage}
                      isFullscreen={isFullscreen}
                    />
                    
                    <Legend 
                      data={hoveredData || processedData[processedData.length - 1]} 
                      showVWAP={showVWAP}
                      showOBV={showOBV}
                      showEMAX={showEMAX}
                      showEMA20={showEMA20}
                      showEMA50={showEMA50}
                      showRSI={showRSI}
                      showMACD={showMACD}
                      showIchimoku={showIchimoku}
                      showMoneyFlow={showMoneyFlow}
                      theme={theme}
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
                        <button 
                          onClick={() => {
                            handleGeminiAnalysis(contextMenu.data);
                            setContextMenu(null);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm font-bold flex items-center gap-3 transition-colors",
                            theme === 'dark' ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-zinc-700 hover:bg-zinc-50"
                          )}
                        >
                          <Brain className="w-4 h-4 text-emerald-500" />
                          AI News Analysis
                        </button>
                        <div className="h-px bg-zinc-800 my-1 mx-2" />
                        <button 
                          onClick={() => setContextMenu(null)}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm font-bold transition-colors",
                            theme === 'dark' ? "text-zinc-500 hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-50"
                          )}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chart Controls Overlay */}
              {showChartControls && (
                <div className="absolute top-4 right-4 z-20 animate-in slide-in-from-right-4">
                  <ChartControls 
                    showVWAP={showVWAP} setShowVWAP={setShowVWAP}
                    showOBV={showOBV} setShowOBV={setShowOBV}
                    showVolume={showVolume} setShowVolume={setShowVolume}
                    showEMAX={showEMAX} setShowEMAX={setShowEMAX}
                    showEMA20={showEMA20} setShowEMA20={setShowEMA20}
                    showEMA50={showEMA50} setShowEMA50={setShowEMA50}
                    showRSI={showRSI} setShowRSI={setShowRSI}
                    showMACD={showMACD} setShowMACD={setShowMACD}
                    showElliottWaves={showElliottWaves} setShowElliottWaves={setShowElliottWaves}
                    showVolumeSpikes={showVolumeSpikes} setShowVolumeSpikes={setShowVolumeSpikes}
                    showIchimoku={showIchimoku} setShowIchimoku={setShowIchimoku}
                    showMoneyFlow={showMoneyFlow} setShowMoneyFlow={setShowMoneyFlow}
                    showPickBo={showPickBo} setShowPickBo={setShowPickBo}
                    isInvertedY={isInvertedY} setIsInvertedY={setIsInvertedY}
                    isLogScale={isLogScale} setIsLogScale={setIsLogScale}
                    chartType={chartType} setChartType={setChartType}
                    onReset={() => setResetTrigger(prev => prev + 1)}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {showNotebook && (
              <StockNotebook symbol={symbol} theme={theme} />
            )}
            {showSimTrade && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10">
                      <Activity className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                      Simulation Trading
                    </h3>
                  </div>
                  <button
                    onClick={handleOpenSimTrade}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    Open in New Window
                  </button>
                </div>
                <SimTradePanel 
                  symbol={symbol} 
                  interval={interval}
                  data={processedData}
                  theme={theme} 
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <ReversalDashboard theme={theme} />
        </div>
      )}
    </div>
  );
};
