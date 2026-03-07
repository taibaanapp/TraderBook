import React from 'react';
import { X, Settings, Brain, Power, Monitor, BarChart2, Search, Image as ImageIcon, History as HistoryIcon, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.settings;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  isAiInsightEnabled: boolean;
  onToggleAiInsight: () => void;
  showTicker: boolean;
  onToggleTicker: () => void;
  showStockProfile: boolean;
  onToggleStockProfile: () => void;
  showFinancials: boolean;
  onToggleFinancials: () => void;
  showGeminiNews: boolean;
  onToggleGeminiNews: () => void;
  showSaveImage: boolean;
  onToggleSaveImage: () => void;
  showRecentStocks: boolean;
  onToggleRecentStocks: () => void;
  showNotebook: boolean;
  onToggleNotebook: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  theme,
  isAiInsightEnabled,
  onToggleAiInsight,
  showTicker,
  onToggleTicker,
  showStockProfile,
  onToggleStockProfile,
  showFinancials,
  onToggleFinancials,
  showGeminiNews,
  onToggleGeminiNews,
  showSaveImage,
  onToggleSaveImage,
  showRecentStocks,
  onToggleRecentStocks,
  showNotebook,
  onToggleNotebook
}) => {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-md rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            )}>
              <Settings className={cn("w-5 h-5", isDark ? "text-zinc-300" : "text-zinc-700")} />
            </div>
            <div>
              <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {t.title}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t.subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Market Ticker Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showTicker 
                  ? (isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.market_ticker}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.market_ticker_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleTicker}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showTicker 
                  ? "bg-blue-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showTicker ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Stock Insight Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showStockProfile 
                  ? (isDark ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-100 text-indigo-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.stock_insight}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.stock_insight_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleStockProfile}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showStockProfile 
                  ? "bg-indigo-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showStockProfile ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* AI Insight Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100",
            !showStockProfile && "opacity-50 pointer-events-none"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isAiInsightEnabled 
                  ? (isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.ai_generation}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.ai_generation_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleAiInsight}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                isAiInsightEnabled 
                  ? "bg-emerald-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                isAiInsightEnabled ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Gemini News Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showGeminiNews 
                  ? (isDark ? "bg-rose-900/30 text-rose-400" : "bg-rose-100 text-rose-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.gemini_news}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.gemini_news_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleGeminiNews}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showGeminiNews 
                  ? "bg-rose-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showGeminiNews ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Save Image Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showSaveImage 
                  ? (isDark ? "bg-violet-900/30 text-violet-400" : "bg-violet-100 text-violet-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.save_image}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.save_image_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleSaveImage}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showSaveImage 
                  ? "bg-violet-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showSaveImage ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Financials Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showFinancials 
                  ? (isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.finance_data}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.finance_data_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleFinancials}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showFinancials 
                  ? "bg-amber-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showFinancials ? "left-6" : "left-1"
              )} />
            </button>
          </div>
          {/* Recent Stocks Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showRecentStocks 
                  ? (isDark ? "bg-cyan-900/30 text-cyan-400" : "bg-cyan-100 text-cyan-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <HistoryIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.recently_viewed}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.recently_viewed_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleRecentStocks}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showRecentStocks 
                  ? "bg-cyan-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showRecentStocks ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Notebook Toggle */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                showNotebook 
                  ? (isDark ? "bg-fuchsia-900/30 text-fuchsia-400" : "bg-fuchsia-100 text-fuchsia-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {t.stock_notebook}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t.stock_notebook_desc}
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleNotebook}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showNotebook 
                  ? "bg-fuchsia-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-1 transition-transform",
                showNotebook ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
