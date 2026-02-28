export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  obv?: number;
  finalScore?: number;
  color?: string;
  volumeColor?: string;
  pe: number | null;
  pb: number | null;
}

export interface ApiResponse {
  symbol: string;
  currency: string;
  data: StockData[];
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
