export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  obv?: number;
  ema20?: number;
  ema50?: number;
  ema135?: number;
  finalScore?: number;
  color?: string;
  volumeColor?: string;
  pe: number | null;
  pb: number | null;
  isSimulated?: boolean;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  elliottWaveLabel?: string;
  elliottWaveId?: string;
  elliottWaveType?: 'impulse' | 'correction';
  elliottWaveConfidence?: number;
  elliottWaveProjection?: {
    targetPrice: number;
    label: string;
    waveLabel: string;
  };
  isVolumeSpike?: boolean;
  isOrderBlock?: boolean;
  tenkanSen?: number;
  kijunSen?: number;
  senkouSpanA?: number;
  senkouSpanB?: number;
  chikouSpan?: number;
  
  // Money Flow & Climax Analyzer
  buyDollarVolume?: number;
  sellDollarVolume?: number;
  totalDollarVolume?: number;
  avgTotalDollarVolume?: number;
  drawdownPct?: number;
  isSellingClimax?: boolean;
  isAbsorption?: boolean;
  isPanic?: boolean;
  isExhaustion?: boolean;
}

export interface ApiResponse {
  symbol: string;
  currency: string;
  timezone?: string;
  exchangeTimezoneName?: string;
  data: StockData[];
  shortName?: string;
  industry?: string;
  marketState?: string;
  fullExchangeName?: string;
  fundamentals?: {
    eps?: number;
    bookValue?: number;
    trailingPE?: number;
    fiveYearAvgPE?: number;
    industryPE?: number;
    priceToBook?: number;
    marketCap?: number;
    averageVolume?: number;
  };
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string;
}

export interface PortfolioSummary {
  symbol: string;
  totalShares: number;
  avgCost: number;
  totalCost: number;
}

export interface StockNote {
  id: string;
  symbol: string;
  userId: string;
  price: number;
  content: string;
  date: string;
}

export interface GhostCandle extends StockData {
  isGhost: boolean;
  confidence: number;
  patternName?: string;
}

export interface ScenarioResult {
  candles: GhostCandle[];
  setup: string;
  patternName: string;
  trigger: string;
  invalidation: number;
  confidence: number;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}
