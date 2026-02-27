import express from "express";
import { createServer as createViteServer } from "vite";
import YahooFinance from 'yahoo-finance2';
import Database from 'better-sqlite3';
import path from 'path';

const yahooFinance = new YahooFinance();
const dbPath = process.env.DATABASE_PATH || 'data.db';
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_cache (
    key TEXT PRIMARY KEY,
    data TEXT,
    timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    type TEXT,
    shares REAL,
    price REAL,
    date TEXT
  );
`);

const CACHE_TTL = {
  '1h': 15 * 60 * 1000, // 15 minutes
  '1d': 60 * 60 * 1000, // 1 hour
  '1wk': 24 * 60 * 60 * 1000, // 1 day
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.get("/api/transactions", (req, res) => {
    try {
      const transactions = db.prepare('SELECT * FROM transactions').all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { id, symbol, type, shares, price, date } = req.body;
    try {
      db.prepare('INSERT INTO transactions (id, symbol, type, shares, price, date) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, symbol, type, shares, price, date
      );
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save transaction' });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  app.get("/api/stock/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const { interval = '1d', from = '2020-01-01' } = req.query;
    const cacheKey = `${symbol}_${interval}_${from}`;

    try {
      // Check cache
      const cached = db.prepare('SELECT data, timestamp FROM stock_cache WHERE key = ?').get(cacheKey) as any;
      const ttl = CACHE_TTL[interval as keyof typeof CACHE_TTL] || CACHE_TTL['1d'];

      if (cached && (Date.now() - cached.timestamp < ttl)) {
        console.log(`Cache hit for ${cacheKey}`);
        return res.json(JSON.parse(cached.data));
      }

      // Yahoo Finance limits hourly data to the last 730 days
      let startDate = from as string;
      if (interval === '1h') {
        const twoYearsAgo = new Date();
        twoYearsAgo.setDate(twoYearsAgo.getDate() - 720);
        startDate = twoYearsAgo.toISOString().split('T')[0];
      }

      const queryOptions = {
        period1: startDate,
        interval: interval as any,
      };

      // Fetch chart data and current fundamentals in parallel
      const [chartResult, quoteResult] = await Promise.all([
        yahooFinance.chart(symbol, queryOptions) as Promise<any>,
        yahooFinance.quote(symbol).catch(() => null) as Promise<any>
      ]);
      
      if (!chartResult || !chartResult.quotes) {
        return res.status(404).json({ error: 'No data found' });
      }

      // Try multiple fields for EPS and Book Value as they vary by asset type
      const eps = quoteResult?.epsTrailingTwelveMonths || 
                  quoteResult?.trailingEps || 
                  quoteResult?.forwardEps || 
                  quoteResult?.epsForward || 
                  null;
                  
      const bookValue = quoteResult?.bookValue || 
                        quoteResult?.priceToBook ? (quoteResult.regularMarketPrice / quoteResult.priceToBook) : 
                        null;

      // Format data for Recharts
      const chartData = chartResult.quotes.map((quote, index, array) => {
        const close = quote.close;
        
        // Calculate average of previous 5 volumes
        let volumeColor = '#18181b'; // Default: black (zinc-900)
        if (index >= 5) {
          const prev5 = array.slice(index - 5, index);
          const avgVolume = prev5.reduce((sum, q) => sum + (q.volume || 0), 0) / 5;
          if (quote.volume > avgVolume) {
            volumeColor = '#10b981'; // Green (emerald-500)
          } else if (quote.volume < avgVolume) {
            volumeColor = '#f43f5e'; // Red (rose-500)
          }
        }

        return {
          date: quote.date,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: close,
          volume: quote.volume,
          volumeColor: volumeColor,
          // Calculate dynamic PE/PB based on current fundamentals
          pe: eps && close ? (close / eps) : null,
          pb: bookValue && close ? (close / bookValue) : null
        };
      }).filter(q => q.close !== null);

      const responseData = {
        symbol: chartResult.meta.symbol,
        currency: chartResult.meta.currency,
        data: chartData,
        fundamentals: {
          eps,
          bookValue,
          trailingPE: quoteResult?.trailingPE,
          priceToBook: quoteResult?.priceToBook
        }
      };

      // Save to cache
      db.prepare('INSERT OR REPLACE INTO stock_cache (key, data, timestamp) VALUES (?, ?, ?)').run(
        cacheKey,
        JSON.stringify(responseData),
        Date.now()
      );

      res.json(responseData);
    } catch (error: any) {
      console.error('Yahoo Finance Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch stock data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
