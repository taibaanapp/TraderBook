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
  CREATE TABLE IF NOT EXISTS stock_notes (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    userId TEXT,
    price REAL,
    content TEXT,
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

  // Notes API
  app.get("/api/notes/:symbol", (req, res) => {
    const { symbol } = req.params;
    try {
      const notes = db.prepare('SELECT * FROM stock_notes WHERE symbol = ? ORDER BY date DESC').all(symbol);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  app.post("/api/notes", (req, res) => {
    const { id, symbol, userId, price, content, date } = req.body;
    try {
      db.prepare('INSERT INTO stock_notes (id, symbol, userId, price, content, date) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, symbol, userId, price, content, date
      );
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save note' });
    }
  });

  app.delete("/api/notes/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM stock_notes WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  app.get("/api/news/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      console.log(`Fetching news for: ${symbol}`);
      const result = await yahooFinance.search(symbol, { newsCount: 5 });
      console.log(`News found for ${symbol}: ${result.news?.length || 0}`);
      res.json(result.news || []);
    } catch (error) {
      console.error('News Fetch Error:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
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

      // Determine Index Symbol
      const indexSymbol = symbol.endsWith('.BK') ? '^SET.BK' : '^GSPC';

      // Fetch chart data, index data, and current fundamentals in parallel
      const [chartResult, indexResult, quoteResult] = await Promise.all([
        yahooFinance.chart(symbol, queryOptions) as Promise<any>,
        yahooFinance.chart(indexSymbol, queryOptions).catch(() => null) as Promise<any>,
        yahooFinance.quote(symbol).catch(() => null) as Promise<any>
      ]);
      
      if (!chartResult || !chartResult.quotes) {
        return res.status(404).json({ error: 'No data found' });
      }

      // Map index data by date for easy lookup
      const indexMap = new Map();
      if (indexResult && indexResult.quotes) {
        indexResult.quotes.forEach((q: any) => {
          if (q.date && q.close) {
            indexMap.set(new Date(q.date).toISOString().split('T')[0], q.close);
          }
        });
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
        const dateStr = new Date(quote.date).toISOString().split('T')[0];
        const indexClose = indexMap.get(dateStr);
        
        // Calculate Volume MA 20
        let volumeMA20 = 0;
        if (index >= 19) {
          const prev20 = array.slice(index - 19, index + 1);
          volumeMA20 = prev20.reduce((sum, q) => sum + (q.volume || 0), 0) / 20;
        } else if (index > 0) {
          const prevAll = array.slice(0, index + 1);
          volumeMA20 = prevAll.reduce((sum, q) => sum + (q.volume || 0), 0) / (index + 1);
        }

        const volumeRatio = volumeMA20 > 0 ? quote.volume / volumeMA20 : 1;

        // Volume Flow Color Logic (for Volume Bars)
        let volumeColor = '#d1d5db'; // Default: gray-300
        if (volumeRatio > 1.5) {
          volumeColor = '#064e3b'; // Deep Green
        } else if (volumeRatio > 1.2) {
          volumeColor = '#059669'; // Active Green
        } else if (volumeRatio < 0.5) {
          volumeColor = '#dc2626'; // Dry Red
        }

        return {
          date: quote.date,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: close,
          volume: quote.volume,
          volumeMA20: volumeMA20,
          volumeRatio: volumeRatio,
          volumeColor: volumeColor,
          indexClose: indexClose || null,
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
