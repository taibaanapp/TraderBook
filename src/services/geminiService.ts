import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StockProfileData {
  description: string;
  revenue: string;
  competitors: string[];
  outlook: string;
}

export interface GeminiAnalysis {
  headlines: { title: string; url: string }[];
  social_posts: { author: string; content: string; url: string }[];
  ai_analysis: {
    summary: string;
    recommendation: string;
    details: string;
  };
}

export async function getStockProfile(symbol: string, exchange?: string): Promise<StockProfileData> {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          revenue: { type: Type.STRING },
          competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
          outlook: { type: Type.STRING }
        },
        required: ["description", "revenue", "competitors", "outlook"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text);
}

export async function getGeminiNewsAnalysis(symbol: string, date: string): Promise<GeminiAnalysis> {
  const prompt = `วิเคราะห์หุ้น ${symbol} ในช่วงวันที่ ${date} (บวก/ลบ 4 วัน) โดยใช้ Google Search เพื่อหาข้อมูลดังนี้:
  1. ข่าวสำคัญ 5 ข่าวล่าสุด (หัวข้อข่าวและลิงค์ URL)
  2. ความคิดเห็นจากโซเชียลมีเดีย (ระบุชื่อผู้โพสต์/แหล่งที่มา และลิงค์ URL ถ้ามี)
  3. บทวิเคราะห์จาก AI โดยประมวลผลจากข่าวและความเห็นของผู้คน พร้อมให้คำแนะนำว่าควร "ลงทุน", "กังวล", หรือ "ควรรอ" รวมถึงนำคำพูดของผู้บริหารหรือข้อมูลการเงินที่หาได้มาประกอบการวิเคราะห์

  กรุณาตอบเป็นภาษาไทยทั้งหมดในรูปแบบ JSON ตามโครงสร้างที่กำหนด:
  - headlines: รายการข่าว 5 ข่าว (title, url)
  - social_posts: รายการความคิดเห็น (author, content, url)
  - ai_analysis: บทวิเคราะห์เชิงลึก (summary, recommendation, details)`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "url"]
            }
          },
          social_posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING },
                content: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["author", "content", "url"]
            }
          },
          ai_analysis: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              details: { type: Type.STRING }
            },
            required: ["summary", "recommendation", "details"]
          }
        },
        required: ["headlines", "social_posts", "ai_analysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text);
}
