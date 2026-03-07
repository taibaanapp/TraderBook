import React from 'react';
import { X, Brain, MessageSquare, Newspaper, BarChart3, Loader2, ExternalLink, User } from 'lucide-react';
import { cn } from '../utils/cn';
import Markdown from 'react-markdown';

import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.gemini;

interface GeminiAnalysis {
  headlines: { title: string; url: string }[];
  social_posts: { author: string; content: string; url: string }[];
  ai_analysis: {
    summary: string;
    recommendation: string;
    details: string;
  };
}

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  date: string;
  loading: boolean;
  error: string | null;
  analysis: GeminiAnalysis | null;
  theme?: 'light' | 'dark';
}

export const GeminiModal: React.FC<GeminiModalProps> = ({
  isOpen,
  onClose,
  symbol,
  date,
  loading,
  error,
  analysis,
  theme
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const getRecommendationColor = (rec: string) => {
    if (rec.includes(t.recommendation)) return 'text-emerald-500';
    if (rec.includes('กังวล')) return 'text-rose-500';
    if (rec.includes('รอ')) return 'text-amber-500';
    return 'text-blue-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className={cn(
        "relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col transition-all duration-300",
        isDark ? "bg-[#0f172a] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* Header */}
        <div className={cn(
          "px-6 py-4 border-b flex items-center justify-between",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                Gemini Analysis: {symbol}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {t.period}: {date} (± 4 {t.days})
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
              <p className={cn("text-sm font-bold uppercase tracking-widest animate-pulse", isDark ? "text-zinc-400" : "text-zinc-500")}>
                {t.analyzing}
              </p>
            </div>
          ) : error ? (
            <div className={cn(
              "p-6 rounded-2xl border flex flex-col items-center text-center",
              isDark ? "bg-rose-950/20 border-rose-900/30" : "bg-rose-50 border-rose-100"
            )}>
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className={cn("text-base font-bold mb-2", isDark ? "text-rose-400" : "text-rose-900")}>{t.analysis_failed}</h3>
              <p className={cn("text-sm max-w-md", isDark ? "text-rose-300" : "text-rose-700")}>{error}</p>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 gap-8">
              {/* Headlines */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-rose-500">
                  <Newspaper className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">{t.top_headlines}</h3>
                </div>
                <div className="grid gap-3">
                  {analysis.headlines.map((news, i) => (
                    <a 
                      key={i}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between group transition-all",
                        isDark ? "bg-zinc-900/50 border-zinc-800 hover:border-rose-500/50" : "bg-zinc-50 border-zinc-100 hover:border-rose-500/50"
                      )}
                    >
                      <span className={cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>{news.title}</span>
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-rose-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </section>

              {/* Social */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-500">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">{t.social_opinions}</h3>
                </div>
                <div className="grid gap-4">
                  {analysis.social_posts.map((post, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-5 rounded-2xl border space-y-3",
                        isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className={cn("text-xs font-bold", isDark ? "text-zinc-400" : "text-zinc-600")}>{post.author}</span>
                        </div>
                        {post.url && post.url !== "#" && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            {t.view_original} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>{post.content}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Analysis */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">{t.ai_analysis}</h3>
                </div>
                <div className={cn(
                  "p-6 rounded-2xl border space-y-6",
                  isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-100"
                )}>
                  <div className="space-y-2">
                    <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.summary}</h4>
                    <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>{analysis.ai_analysis.summary}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.recommendation}</h4>
                    <div className={cn("text-lg font-black", getRecommendationColor(analysis.ai_analysis.recommendation))}>
                      {analysis.ai_analysis.recommendation}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>{t.details}</h4>
                    <div className={cn("text-sm leading-relaxed markdown-body", isDark ? "text-zinc-300" : "text-zinc-700")}>
                      <Markdown>{analysis.ai_analysis.details}</Markdown>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className={cn(
          "px-6 py-4 border-t flex items-center justify-between",
          isDark ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-100 bg-zinc-50/50"
        )}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Powered by Gemini 3 Flash
          </p>
          <button 
            onClick={onClose}
            className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
          >
            {t.close_analysis}
          </button>
        </div>
      </div>
    </div>
  );
};
