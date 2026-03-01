import localforage from 'localforage';
import { ApiResponse, StockData } from '../types';

// Configure localforage to use IndexedDB as primary
localforage.config({
  name: 'CrossVision',
  storeName: 'stock_cache',
  description: 'Cache for stock market data'
});

interface CachedData {
  data: ApiResponse;
  timestamp: number;
  lastViewed: number;
}

/**
 * Prunes stock data to keep only essential fields for storage.
 * This significantly reduces the storage footprint.
 */
const pruneStockData = (apiResponse: ApiResponse): ApiResponse => {
  return {
    ...apiResponse,
    data: apiResponse.data.map((point: StockData) => ({
      date: point.date,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      // We exclude calculated indicators like ema50, ema135, vwap, etc.
      // as they are recalculated on the fly in the app.
    } as StockData))
  };
};

/**
 * Saves stock data to IndexedDB with pruning.
 */
export const saveStockData = async (symbol: string, interval: string, data: ApiResponse): Promise<void> => {
  const key = `stock_data_${symbol}_${interval}`;
  const prunedData = pruneStockData(data);
  
  const cacheEntry: CachedData = {
    data: prunedData,
    timestamp: Date.now(),
    lastViewed: Date.now()
  };

  try {
    await localforage.setItem(key, cacheEntry);
    // Trigger background cleanup
    cleanupOldCache();
  } catch (error) {
    console.error('Storage error:', error);
    // Fallback: if IndexedDB fails, we could try localStorage but it's likely to fail too if quota is the issue.
    // localforage already handles driver fallbacks.
  }
};

/**
 * Retrieves stock data from IndexedDB.
 */
export const getStockData = async (symbol: string, interval: string): Promise<ApiResponse | null> => {
  const key = `stock_data_${symbol}_${interval}`;
  try {
    const cached = await localforage.getItem<CachedData>(key);
    if (!cached) return null;

    // Check if data is older than 24 hours
    const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) return null;

    // Update last viewed timestamp for cleanup logic
    cached.lastViewed = Date.now();
    await localforage.setItem(key, cached);

    return cached.data;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
};

/**
 * Cleans up cache entries that haven't been viewed in more than 7 days.
 */
export const cleanupOldCache = async (): Promise<void> => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const keys = await localforage.keys();
    for (const key of keys) {
      if (key.startsWith('stock_data_')) {
        const entry = await localforage.getItem<CachedData>(key);
        if (entry && (now - entry.lastViewed > SEVEN_DAYS_MS)) {
          console.log(`Cleaning up old cache for ${key}`);
          await localforage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};
