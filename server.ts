import express from "express";
import { createServer as createViteServer } from "vite";
import YahooFinance from 'yahoo-finance2';
import Database from 'better-sqlite3';
import path from 'path';

const yahooFinance = new YahooFinance({
  validation: {
    logErrors: false,
    logOptionsErrors: false
  }
});
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
  CREATE TABLE IF NOT EXISTS financial_cache (
    symbol TEXT PRIMARY KEY,
    data TEXT,
    timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS api_usage (
    api_name TEXT,
    usage_date TEXT,
    count INTEGER,
    PRIMARY KEY (api_name, usage_date)
  );
  CREATE TABLE IF NOT EXISTS custom_stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    market TEXT
  );
  CREATE TABLE IF NOT EXISTS stock_profiles (
    symbol TEXT PRIMARY KEY,
    data TEXT,
    timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    date TEXT,
    price REAL,
    score REAL,
    reasons TEXT,
    stopLoss REAL,
    hit5 INTEGER,
    hit10 INTEGER,
    hit20 INTEGER,
    price5 REAL,
    price10 REAL,
    price20 REAL,
    timestamp INTEGER
  );
`);

const CACHE_TTL = {
  '1h': 15 * 60 * 1000, // 15 minutes
  '1d': 60 * 60 * 1000, // 1 hour
  '1wk': 24 * 60 * 60 * 1000, // 1 day
  'financials': 7 * 24 * 60 * 60 * 1000, // 7 days
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
    console.log(`Fetching notes for symbol: ${symbol}`);
    try {
      const notes = db.prepare('SELECT * FROM stock_notes WHERE symbol = ? ORDER BY date DESC').all(symbol);
      console.log(`Notes found: ${notes.length}`);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
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

  app.get("/api/stocks", (req, res) => {
    try {
      const customStocks = db.prepare('SELECT * FROM custom_stocks').all();
      res.json(customStocks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch custom stocks' });
    }
  });

  app.post("/api/stocks", (req, res) => {
    const { symbol, name, market } = req.body;
    try {
      db.prepare('INSERT OR REPLACE INTO custom_stocks (symbol, name, market) VALUES (?, ?, ?)').run(
        symbol.toUpperCase(), name, market
      );
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save custom stock' });
    }
  });

  app.get("/api/stock/profile/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const { exchange } = req.query;
    const apiKey = process.env.GeNews_api;
    const today = new Date().toISOString().split('T')[0];

    if (!apiKey) {
      return res.status(500).json({ error: "GeNews_api is not configured." });
    }

    try {
      // 1. Check Cache
      const cached = db.prepare('SELECT data, timestamp FROM stock_profiles WHERE symbol = ?').get(symbol) as { data: string, timestamp: number } | undefined;
      
      // Cache TTL: 90 days (approx. quarterly earnings cycle)
      const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
      if (cached && (Date.now() - cached.timestamp < NINETY_DAYS)) {
        return res.json(JSON.parse(cached.data));
      }

      // 2. Check Daily Limit (10 per day for new/expired profiles)
      const usage = db.prepare('SELECT count FROM api_usage WHERE api_name = ? AND usage_date = ?').get('stock_profile', today) as { count: number } | undefined;
      
      if (usage && usage.count >= 10) {
        // If we have old cached data, return it even if expired, rather than failing
        if (cached) {
          return res.json(JSON.parse(cached.data));
        }
        return res.status(429).json({ error: "Daily limit for new stock insights reached (10/day). Please try again tomorrow." });
      }

      // 3. Call Gemini
      const exchangeContext = exchange ? ` on the ${exchange} exchange` : '';
      const prompt = `Provide a detailed business profile for the stock symbol ${symbol}${exchangeContext}. 
      Make sure to identify the correct company based on the exchange if provided (e.g., if it's a Thai stock, focus on the Thai company).
      Include the following information in Thai:
      1. Business Description (ทำอะไร)
      2. Main Revenue Sources and Countries (รายได้หลักจากอะไร จากประเทศใด)
      3. Main Competitors (คู่แข่งคือหุ้นตัวใด)
      4. Recent Management Outlook/Comments (ล่าสุดผู้บริหารให้ความเห็นไปในทิศทางใด)
      
      Format the response in JSON with the following keys: "description", "revenue", "competitors", "outlook". 
      The values should be strings or arrays of strings as appropriate. Use professional Thai language.`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                description: { type: "STRING" },
                revenue: { type: "STRING" },
                competitors: { type: "ARRAY", items: { type: "STRING" } },
                outlook: { type: "STRING" }
              },
              required: ["description", "revenue", "competitors", "outlook"]
            }
          }
        })
      });

      if (!response.ok) {
        if (cached) return res.json(JSON.parse(cached.data));
        throw new Error("Failed to fetch from Gemini");
      }

      const result = await response.json();
      const contentText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) throw new Error("Empty response from Gemini");
      
      const content = JSON.parse(contentText);

      // 4. Save to Cache
      db.prepare('INSERT OR REPLACE INTO stock_profiles (symbol, data, timestamp) VALUES (?, ?, ?)').run(
        symbol, JSON.stringify(content), Date.now()
      );

      // 5. Update Usage
      if (usage) {
        db.prepare('UPDATE api_usage SET count = count + 1 WHERE api_name = ? AND usage_date = ?').run('stock_profile', today);
      } else {
        db.prepare('INSERT INTO api_usage (api_name, usage_date, count) VALUES (?, ?, ?)').run('stock_profile', today, 1);
      }

      res.json(content);
    } catch (error: any) {
      console.error("Stock Profile Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/news/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      console.log(`Fetching news for: ${symbol}`);
      const safeYahooCall = async (fn: () => Promise<any>) => {
        try {
          return await fn();
        } catch (e: any) {
          if (e.name === 'FailedYahooValidationError' && e.result) {
            return e.result;
          }
          throw e;
        }
      };
      const result = await safeYahooCall(() => yahooFinance.search(symbol, { newsCount: 5 }));
      console.log(`News found for ${symbol}: ${result.news?.length || 0}`);
      res.json(result.news || []);
    } catch (error) {
      console.error('News Fetch Error:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  });

  app.post("/api/grok/news", async (req, res) => {
    const { symbol, date } = req.body;
    const apiKey = process.env.XAI_Grok_Key;

    if (!apiKey) {
      return res.status(500).json({ error: "XAI_Grok_Key is not configured in environment variables." });
    }

    try {
      const prompt = `Analyze the stock ${symbol} around the date ${date}. 
      Please provide:
      1. A summary of major news for this stock from 4 days before to 4 days after ${date}.
      2. General social media sentiment and opinions during this period.
      3. A brief technical and fundamental analysis of why the price moved as it did (if it moved).
      
      Format the response in JSON with the following keys: "summary", "social", "analysis". 
      Keep the tone professional and analytical.`;

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-2-1212",
          messages: [
            { role: "system", content: "You are a professional financial analyst with access to historical news and social media data." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Grok API Error:", errorText);
        return res.status(response.status).json({ error: "Failed to fetch from Grok API", details: errorText });
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      res.json(content);
    } catch (error: any) {
      console.error("Grok Proxy Error:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  app.post("/api/gemini/news", async (req, res) => {
    const { symbol, date } = req.body;
    const apiKey = process.env.GeNews_api;

    if (!apiKey) {
      return res.status(500).json({ error: "GeNews_api is not configured in environment variables." });
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Rate limiting: 30 calls per day
      const usage = db.prepare('SELECT count FROM api_usage WHERE api_name = ? AND usage_date = ?').get('gemini_news', today) as { count: number } | undefined;
      
      if (usage && usage.count >= 30) {
        return res.status(429).json({ error: "Daily limit reached (30 calls/day). Please try again tomorrow." });
      }

      const prompt = `วิเคราะห์หุ้น ${symbol} ในช่วงวันที่ ${date} (บวก/ลบ 4 วัน) โดยใช้ Google Search เพื่อหาข้อมูลดังนี้:
      1. ข่าวสำคัญ 5 ข่าวล่าสุด (หัวข้อข่าวและลิงค์ URL)
      2. ความคิดเห็นจากโซเชียลมีเดีย (ระบุชื่อผู้โพสต์/แหล่งที่มา และลิงค์ URL ถ้ามี)
      3. บทวิเคราะห์จาก AI โดยประมวลผลจากข่าวและความเห็นของผู้คน พร้อมให้คำแนะนำว่าควร "ลงทุน", "กังวล", หรือ "ควรรอ" รวมถึงนำคำพูดของผู้บริหารหรือข้อมูลการเงินที่หาได้มาประกอบการวิเคราะห์

      กรุณาตอบเป็นภาษาไทยทั้งหมดในรูปแบบ JSON ตามโครงสร้างที่กำหนด:
      - headlines: รายการข่าว 5 ข่าว (title, url)
      - social_posts: รายการความคิดเห็น (author, content, url)
      - ai_analysis: บทวิเคราะห์เชิงลึก (summary, recommendation, details)`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                headlines: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      url: { type: "STRING" }
                    },
                    required: ["title", "url"]
                  }
                },
                social_posts: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      author: { type: "STRING" },
                      content: { type: "STRING" },
                      url: { type: "STRING" }
                    },
                    required: ["author", "content", "url"]
                  }
                },
                ai_analysis: {
                  type: "OBJECT",
                  properties: {
                    summary: { type: "STRING" },
                    recommendation: { type: "STRING" },
                    details: { type: "STRING" }
                  },
                  required: ["summary", "recommendation", "details"]
                }
              },
              required: ["headlines", "social_posts", "ai_analysis"]
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        return res.status(response.status).json({ error: "Failed to fetch from Gemini API", details: errorText });
      }

      const result = await response.json();
      const contentText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        throw new Error("Empty response from Gemini");
      }

      const content = JSON.parse(contentText);

      // Increment usage
      if (usage) {
        db.prepare('UPDATE api_usage SET count = count + 1 WHERE api_name = ? AND usage_date = ?').run('gemini_news', today);
      } else {
        db.prepare('INSERT INTO api_usage (api_name, usage_date, count) VALUES (?, ?, ?)').run('gemini_news', today, 1);
      }

      res.json(content);
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  app.get("/api/usage/gemini_news", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const usage = db.prepare('SELECT count FROM api_usage WHERE api_name = ? AND usage_date = ?').get('gemini_news', today) as { count: number } | undefined;
    res.json({ count: usage ? usage.count : 0, limit: 30 });
  });

  // Reversal Analysis API
  app.get("/api/reversal/predictions", (req, res) => {
    try {
      const predictions = db.prepare('SELECT * FROM predictions ORDER BY timestamp DESC').all();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch predictions' });
    }
  });

  app.post("/api/reversal/predictions", (req, res) => {
    const { id, symbol, date, price, score, reasons, stopLoss } = req.body;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO predictions 
        (id, symbol, date, price, score, reasons, stopLoss, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, symbol, date, price, score, JSON.stringify(reasons), stopLoss, Date.now());
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Save Prediction Error:', error);
      res.status(500).json({ error: 'Failed to save prediction' });
    }
  });

  app.get("/api/reversal/stats", (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT 
          CASE 
            WHEN score >= 80 THEN '80-100%'
            WHEN score >= 70 THEN '70-79%'
            ELSE '60-69%'
          END as scoreGroup,
          COUNT(*) as total,
          SUM(CASE WHEN hit5 = 1 THEN 1 ELSE 0 END) as hits5,
          SUM(CASE WHEN hit10 = 1 THEN 1 ELSE 0 END) as hits10,
          SUM(CASE WHEN hit20 = 1 THEN 1 ELSE 0 END) as hits20
        FROM predictions
        WHERE hit5 IS NOT NULL
        GROUP BY scoreGroup
      `).all();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Background task to update prediction performance (can be called manually or periodically)
  app.post("/api/reversal/track", async (req, res) => {
    try {
      const pending = db.prepare(`
        SELECT * FROM predictions 
        WHERE hit20 IS NULL 
        AND timestamp < ?
      `).all(Date.now() - 5 * 24 * 60 * 60 * 1000) as any[];

      const safeYahooCall = async (fn: () => Promise<any>) => {
        try {
          return await fn();
        } catch (e: any) {
          if (e.name === 'FailedYahooValidationError' && e.result) {
            return e.result;
          }
          throw e;
        }
      };

      for (const pred of pending) {
        try {
          // Fetch historical data to check price after 5, 10, 20 days
          const history = await safeYahooCall(() => yahooFinance.chart(pred.symbol, { period1: pred.date, interval: '1d' }));
          if (history && history.quotes) {
            const quotes = history.quotes.filter(q => q.date > new Date(pred.date));
            
            const updateData: any = {};
            if (quotes.length >= 5 && pred.hit5 === null) {
              updateData.price5 = quotes[4].close;
              updateData.hit5 = quotes[4].close > pred.price ? 1 : 0;
            }
            if (quotes.length >= 10 && pred.hit10 === null) {
              updateData.price10 = quotes[9].close;
              updateData.hit10 = quotes[9].close > pred.price ? 1 : 0;
            }
            if (quotes.length >= 20 && pred.hit20 === null) {
              updateData.price20 = quotes[19].close;
              updateData.hit20 = quotes[19].close > pred.price ? 1 : 0;
            }

            if (Object.keys(updateData).length > 0) {
              const sets = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
              const values = Object.values(updateData);
              db.prepare(`UPDATE predictions SET ${sets} WHERE id = ?`).run(...values, pred.id);
            }
          }
        } catch (e) {
          console.error(`Tracking error for ${pred.symbol}:`, e);
        }
      }
      res.json({ success: true, processed: pending.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to track performance' });
    }
  });

  app.get("/api/financials/:symbol", async (req, res) => {
    const { symbol } = req.params;
    
    try {
      // Check cache
      const cached = db.prepare('SELECT data, timestamp FROM financial_cache WHERE symbol = ?').get(symbol) as any;
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL.financials)) {
        return res.json(JSON.parse(cached.data));
      }

      const modules = [
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'incomeStatementHistoryQuarterly',
        'balanceSheetHistoryQuarterly',
        'cashflowStatementHistoryQuarterly',
        'defaultKeyStatistics',
        'financialData',
        'recommendationTrend'
      ];

      // Helper to handle validation errors and return the result anyway
      const safeYahooCall = async (fn: () => Promise<any>) => {
        try {
          return await fn();
        } catch (e: any) {
          if (e.name === 'FailedYahooValidationError' && e.result) {
            return e.result;
          }
          throw e;
        }
      };

      let result;
      try {
        result = await safeYahooCall(() => yahooFinance.quoteSummary(symbol, { modules: modules as any }));
      } catch (e: any) {
        console.error(`QuoteSummary Error for ${symbol}:`, e.message);
        // If it's a "not found" error, return 404
        if (e.message?.includes('not found') || e.message?.includes('delisted')) {
          return res.status(404).json({ error: `Symbol ${symbol} not found or delisted` });
        }
        throw e;
      }
      
      if (!result) {
        return res.status(404).json({ error: 'No financial data found' });
      }

      // Process and simplify the data for the frontend
      const processStatements = (statements: any[]) => {
        return statements?.map(s => ({
          date: s.endDate,
          revenue: s.totalRevenue,
          netIncome: s.netIncome,
          ebit: s.ebit,
          totalAssets: s.totalAssets,
          totalLiabilities: s.totalLiabilitiesNetMinorityInterest || s.totalLiabilities,
          totalEquity: s.totalStockholderEquity,
          currentAssets: s.totalCurrentAssets,
          currentLiabilities: s.totalCurrentLiabilities,
          cash: s.cash || s.cashAndCashEquivalents,
          inventory: s.inventory,
          totalDebt: s.totalDebt,
          operatingCashflow: s.totalCashFromOperatingActivities,
          freeCashflow: s.freeCashFlow
        })) || [];
      };

      const financials = {
        annual: processStatements(result.incomeStatementHistory?.incomeStatementHistory || []),
        quarterly: processStatements(result.incomeStatementHistoryQuarterly?.incomeStatementHistory || []),
        annualBS: result.balanceSheetHistory?.balanceSheetStatements || [],
        quarterlyBS: result.balanceSheetHistoryQuarterly?.balanceSheetStatements || [],
        stats: {
          pe: result.defaultKeyStatistics?.trailingPE || result.financialData?.trailingPE,
          forwardPE: result.defaultKeyStatistics?.forwardPE,
          pb: result.defaultKeyStatistics?.priceToBook,
          roe: result.financialData?.returnOnEquity,
          roa: result.financialData?.returnOnAssets,
          profitMargin: result.financialData?.profitMargins,
          operatingMargin: result.financialData?.operatingMargins,
          currentRatio: result.financialData?.currentRatio,
          quickRatio: result.financialData?.quickRatio,
          debtToEquity: result.financialData?.debtToEquity,
          revenueGrowth: result.financialData?.revenueGrowth,
          earningsGrowth: result.financialData?.earningsGrowth,
          dividendYield: result.financialData?.dividendYield,
          payoutRatio: result.financialData?.payoutRatio,
          targetPrice: result.financialData?.targetMeanPrice,
          recommendation: result.financialData?.recommendationKey
        }
      };

      // Combine Income Statement and Balance Sheet data
      const combineData = (is: any[], bs: any[]) => {
        return is.map((item, idx) => {
          const bsItem = bs[idx] || {};
          return {
            ...item,
            totalAssets: bsItem.totalAssets,
            totalLiabilities: bsItem.totalLiabilitiesNetMinorityInterest || bsItem.totalLiabilities,
            totalEquity: bsItem.totalStockholderEquity,
            currentAssets: bsItem.totalCurrentAssets,
            currentLiabilities: bsItem.totalCurrentLiabilities,
            cash: bsItem.cash || bsItem.cashAndCashEquivalents,
            inventory: bsItem.inventory,
            totalDebt: bsItem.totalDebt
          };
        });
      };

      const annualCombined = combineData(financials.annual, financials.annualBS);
      
      // Calculate Fair Value (Graham Number)
      // Graham Number = sqrt(22.5 * EPS * BookValue)
      const eps = result.defaultKeyStatistics?.trailingEps || result.financialData?.trailingEps;
      const bvps = result.defaultKeyStatistics?.bookValue;
      let grahamNumber = null;
      if (eps > 0 && bvps > 0) {
        grahamNumber = Math.sqrt(22.5 * eps * bvps);
      }

      // Fallback Fair Value based on PE (Price = EPS * 15)
      const peFairValue = eps > 0 ? eps * 15 : null;

      const finalData = {
        symbol,
        annual: annualCombined,
        quarterly: combineData(financials.quarterly, financials.quarterlyBS),
        stats: financials.stats,
        valuation: {
          grahamNumber,
          peFairValue,
          targetPrice: financials.stats.targetPrice
        },
        timestamp: Date.now()
      };

      // Save to cache
      db.prepare('INSERT OR REPLACE INTO financial_cache (symbol, data, timestamp) VALUES (?, ?, ?)').run(
        symbol,
        JSON.stringify(finalData),
        Date.now()
      );

      res.json(finalData);
    } catch (error: any) {
      console.error('Financials Fetch Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch financial data' });
    }
  });

  app.get("/api/stock/:symbol", async (req, res) => {
    let { symbol } = req.params;
    const { interval = '1d', from = '2020-01-01' } = req.query;

    // Symbol Mapping for Indices and Commodities
    const symbolMap: { [key: string]: string } = {
      'SET': '^SET.BK',
      'DJI': '^DJI',
      'SPX': '^GSPC',
      'IXIC': '^IXIC',
      'FTSE': '^FTSE',
      'N225': '^N225',
      'HSI': '^HSI',
      'GOLD': 'GC=F',
      'OIL': 'CL=F',
      'USDTHB': 'USDTHB=X'
    };

    if (symbolMap[symbol.toUpperCase()]) {
      symbol = symbolMap[symbol.toUpperCase()];
    }

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

      // Helper to handle validation errors and return the result anyway
      const safeYahooCall = async (fn: () => Promise<any>) => {
        try {
          return await fn();
        } catch (e: any) {
          if (e.name === 'FailedYahooValidationError' && e.result) {
            return e.result;
          }
          throw e;
        }
      };

      // Fetch chart data, index data, and current fundamentals in parallel
      let chartResult, indexResult, quoteResult, profileResult;
      try {
        [chartResult, indexResult, quoteResult, profileResult] = await Promise.all([
          safeYahooCall(() => yahooFinance.chart(symbol, queryOptions)),
          safeYahooCall(() => yahooFinance.chart(indexSymbol, queryOptions)).catch(() => null),
          safeYahooCall(() => yahooFinance.quote(symbol)).catch(() => null),
          safeYahooCall(() => yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] })).catch(() => null)
        ]);
      } catch (e: any) {
        console.error(`Yahoo Finance API Error for ${symbol}:`, e.message);
        if (e.message?.includes('not found') || e.message?.includes('delisted')) {
          return res.status(404).json({ error: `Symbol ${symbol} not found or delisted` });
        }
        throw e;
      }
      
      if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
        return res.status(404).json({ error: 'No data found for this period' });
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
        fullExchangeName: quoteResult?.fullExchangeName,
        shortName: quoteResult?.shortName || quoteResult?.longName,
        industry: profileResult?.assetProfile?.industry || quoteResult?.industry || quoteResult?.sector,
        marketState: quoteResult?.marketState,
        data: chartData,
        fundamentals: {
          eps,
          bookValue,
          trailingPE: quoteResult?.trailingPE,
          priceToBook: quoteResult?.priceToBook,
          marketCap: quoteResult?.marketCap,
          averageVolume: quoteResult?.averageDailyVolume3Month
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
