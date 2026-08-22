import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, Building2, ChevronRight, ArrowLeft, Database } from 'lucide-react';
import type { HistoryGroup, BriefGeneration, NewsArticle } from '../types.js';
import { NewsCard } from './NewsCard.js';
import { TakeawaysSection } from './TakeawaysSection.js';

interface HistoryViewProps {
  onBackToToday: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBackToToday }) => {
  const [historyGroups, setHistoryGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected generation for full viewing
  const [selectedGeneration, setSelectedGeneration] = useState<BriefGeneration | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<NewsArticle[]>([]);
  const [selectedTakeaways, setSelectedTakeaways] = useState<string[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history', {
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (json?.success && Array.isArray(json.data)) {
        setHistoryGroups(json.data);
      } else {
        setError(json?.error || 'Failed to fetch history archive');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGeneration = async (gen: BriefGeneration) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/brief/${gen.id}`, {
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (json?.success && json.data) {
        setSelectedGeneration(json.data.generation);
        setSelectedArticles(json.data.articles || []);
        setSelectedTakeaways(json.data.takeaways || json.data.generation.takeaways || []);
      }
    } catch (err: any) {
      console.error('Failed to load detail for generation:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Retrieving archives from SQLite database...</p>
      </div>
    );
  }

  // If a historical generation is selected, display its complete brief & 3 articles
  if (selectedGeneration) {
    return (
      <div className="space-y-6">
        {/* Back navigation & Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-slate-200">
          <button
            id="back-to-history-list"
            onClick={() => setSelectedGeneration(null)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-slate-100 px-3 py-1.5 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to History</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 border border-slate-200 font-mono text-[11px]">
              <Database className="w-3 h-3 mr-1 text-slate-600" />
              SQLite Record
            </span>
            <span>Generated: <strong className="text-slate-800">{selectedGeneration.generation_timestamp}</strong></span>
          </div>
        </div>

        {/* Date header */}
        <div className="border-b border-slate-200 pb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            ARCHIVED BRIEF • {selectedGeneration.generation_date}
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1">
            MBA Business Brief Archive ({selectedArticles.length} Case Studies)
          </h2>
        </div>

        {loadingDetail ? (
          <div className="py-12 text-center">
            <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading stored case studies from database...</p>
          </div>
        ) : (
          <>
            {/* 3 News Articles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {selectedArticles.map((article, idx) => (
                <NewsCard key={article.id} article={article} index={idx} />
              ))}
            </div>

            {/* 3 MBA Takeaways */}
            <TakeawaysSection takeaways={selectedTakeaways} />
          </>
        )}
      </div>
    );
  }

  return (
    <div id="history-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Database Archive
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
            Historical MBA Business Briefs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived case-study intelligence stored in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">mba_news.db</code> (SQLite)
          </p>
        </div>

        <button
          onClick={onBackToToday}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <span>Today&apos;s Brief</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {historyGroups.length === 0 && !error && (
        <div className="bg-white border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 font-serif">
            No Historical Briefs Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Click &ldquo;Generate Today&apos;s Brief&rdquo; on the main page to retrieve today&apos;s business news and store the first entry in your SQLite database.
          </p>
          <button
            onClick={onBackToToday}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors"
          >
            <span>Go to Today&apos;s Brief</span>
          </button>
        </div>
      )}

      {/* Grouped by Date list */}
      <div className="space-y-4">
        {historyGroups.map((group) => (
          <div
            key={group.date}
            className="bg-white border border-slate-200"
          >
            {/* Date Group Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold tracking-wider uppercase font-serif">
                  {group.date}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {group.generations.length} {group.generations.length === 1 ? 'brief' : 'briefs'}
              </span>
            </div>

            {/* List of Generations for this date */}
            <div className="divide-y divide-slate-100">
              {group.generations.map((gen, genIdx) => (
                <div
                  key={gen.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                        RUN #{group.generations.length - genIdx}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {gen.generation_timestamp}
                      </span>
                      <span className="text-xs text-slate-400 font-mono text-[11px]">
                        ({gen.articles?.length || gen.article_count} Articles)
                      </span>
                    </div>

                    {/* Article headlines list */}
                    {gen.articles && gen.articles.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-700 pl-1">
                        {gen.articles.map((art, aIdx) => (
                          <li key={art.id || aIdx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 font-bold">•</span>
                            <span className="font-medium text-slate-800">{art.headline}</span>
                            {art.source && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                [{art.source}]
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Sources Represented */}
                    {gen.sources && gen.sources.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>Sources:</span>
                        <div className="flex flex-wrap gap-1">
                          {gen.sources.map((s, sIdx) => (
                            <span key={sIdx} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[9px] font-medium border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectGeneration(gen)}
                    className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-semibold transition-colors border border-slate-200 flex-shrink-0 rounded"
                  >
                    <span>View Case Studies</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

