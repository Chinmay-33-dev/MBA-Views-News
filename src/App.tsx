/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, Sparkles, RefreshCw, Calendar, ArrowRight, CheckCircle2, BookOpen, Layers, ShieldCheck, Database, History } from 'lucide-react';
import type { BriefGeneration, NewsArticle, HistoryGroup } from './types.js';
import { Header } from './components/Header.js';
import { NewsCard } from './components/NewsCard.js';
import { TakeawaysSection } from './components/TakeawaysSection.js';
import { LoadingSteps } from './components/LoadingSteps.js';
import { ErrorBanner } from './components/ErrorBanner.js';
import { HistoryView } from './components/HistoryView.js';
import { IntegrationInspector } from './components/IntegrationInspector.js';
import { getCurrentIndianDate, getCurrentIndianTime } from './utils/timeUtils.js';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'brief' | 'history' | 'integration'>('brief');

  // Generation state: idle | generating | success | error
  const [state, setState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');

  // Active brief data
  const [currentGeneration, setCurrentGeneration] = useState<BriefGeneration | null>(null);
  const [currentArticles, setCurrentArticles] = useState<NewsArticle[]>([]);
  const [currentTakeaways, setCurrentTakeaways] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Agent connectivity status
  const [agentConnected, setAgentConnected] = useState<boolean | null>(null);
  const [agentUrl, setAgentUrl] = useState<string>('http://127.0.0.1:54321/api/agents/mba-news/chat');
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Check agent status & load latest brief on startup
  useEffect(() => {
    checkAgentStatus();
    loadLatestStoredBrief();
    loadHistoryCount();
  }, []);

  const checkAgentStatus = async () => {
    try {
      const res = await fetch('/api/agent-status');
      const json = await res.json();
      setAgentConnected(json.connected === true);
      if (json.endpoint) {
        setAgentUrl(json.endpoint);
      }
    } catch {
      setAgentConnected(false);
    }
  };

  const loadLatestStoredBrief = async () => {
    try {
      const res = await fetch('/api/latest-brief');
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentGeneration(json.data.generation);
        setCurrentArticles(json.data.articles || []);
        setCurrentTakeaways(json.data.takeaways || json.data.generation.takeaways || []);
        setState('success');
      }
    } catch (err) {
      console.error('Could not load initial brief from DB:', err);
    }
  };

  const loadHistoryCount = async () => {
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        let total = 0;
        json.data.forEach((group: HistoryGroup) => {
          total += group.generations.length;
        });
        setHistoryCount(total);
      }
    } catch (err) {
      console.error('Failed to load history count:', err);
    }
  };

  const handleGenerateBrief = async (modeParam?: string | unknown) => {
    const mode = modeParam === 'demo' ? 'demo' : 'live';
    if (state === 'generating') return; // Debounce / prevent double clicks

    setState('generating');
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      let json: any = null;
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!res.ok || !json?.success) {
        setErrorMessage(
          json?.error ||
            'Unable to connect to the MBA News Agent. Please start the MBA News agent in Anaconda Agent Studio and try again.'
        );
        setErrorDetails(
          json?.details ||
            (text.startsWith('<') ? 'Received unexpected response format from server.' : text.slice(0, 200))
        );
        setState('error');
        setAgentConnected(false);
        return;
      }

      if (json.data) {
        setCurrentGeneration(json.data.generation);
        setCurrentArticles(json.data.articles || []);
        setCurrentTakeaways(json.data.takeaways || json.data.generation.takeaways || []);
        setState('success');
        setAgentConnected(Boolean(json.agentStatus?.connected));
        loadHistoryCount();
      }
    } catch (err: any) {
      console.error('Error generating brief:', err);
      setErrorMessage(
        'Unable to connect to the MBA News Agent. Please start the MBA News agent in Anaconda Agent Studio and try again.'
      );
      setErrorDetails(err?.message || 'Network communication error');
      setState('error');
      setAgentConnected(false);
    }
  };

  const handleUpdateAgentUrl = async (newUrl: string) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUrl: newUrl }),
      });
      const json = await res.json();
      if (json.success) {
        setAgentUrl(json.agentUrl);
        await checkAgentStatus();
      }
    } catch (err) {
      console.error('Failed to update agent URL:', err);
    }
  };

  const indianDate = getCurrentIndianDate();

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentConnected={agentConnected}
        historyCount={historyCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Tab 1: Today's Brief View */}
        {activeTab === 'brief' && (
          <div className="space-y-8">
            
            {/* Hero / Action Section */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-10 shadow-xs relative overflow-hidden">
              
              {/* Background watermark */}
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-5 pointer-events-none">
                <BookOpen className="w-80 h-80 text-zinc-900" />
              </div>

              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Indian Standard Time (IST): <strong>{indianDate}</strong></span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 tracking-tight leading-tight">
                  Turn Today&apos;s Indian Business News into MBA Case-Study Insights
                </h2>

                <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed max-w-2xl">
                  Dispatches today&apos;s qualifying business news from <strong className="text-zinc-800">Mint</strong>, <strong className="text-zinc-800">Economic Times</strong>, and <strong className="text-zinc-800">The Hindu</strong> via the Anaconda Agent Studio MBA News Agent into three structured case studies with management questions.
                </p>

                {/* Primary Action Button */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    id="generate-brief-btn"
                    onClick={handleGenerateBrief}
                    disabled={state === 'generating'}
                    className={`inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
                      state === 'generating'
                        ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white active:scale-98 hover:shadow-md'
                    }`}
                  >
                    {state === 'generating' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Generating Today&apos;s Brief...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Generate Today&apos;s Brief</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  {/* History shortcut if data exists */}
                  {historyCount > 0 && (
                    <button
                      id="view-history-shortcut-btn"
                      onClick={() => setActiveTab('history')}
                      className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold border border-zinc-200 transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Browse Historical Archive ({historyCount})</span>
                    </button>
                  )}
                </div>

                {/* Subtle meta note */}
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cross-platform architecture: Evaluated solely by Anaconda Agent Studio&apos;s MBA News Agent.</span>
                </div>
              </div>
            </div>

            {/* State 1: Generating Loading Steps */}
            {state === 'generating' && <LoadingSteps />}

            {/* State 2: Error Banner */}
            {state === 'error' && errorMessage && (
              <ErrorBanner
                error={errorMessage}
                details={errorDetails || undefined}
                onRetry={() => handleGenerateBrief('live')}
                onGenerateDemo={() => handleGenerateBrief('demo')}
                onOpenSettings={() => setActiveTab('integration')}
                agentUrl={agentUrl}
              />
            )}

            {/* State 3: Generated Content Display */}
            {state === 'success' && currentArticles.length > 0 && (
              <div id="brief-results-container" className="space-y-6">
                
                {/* Generation Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-5 py-3 text-xs text-emerald-950">
                  <div className="flex items-center space-x-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Today&apos;s MBA Brief is ready &amp; saved to database.</span>
                  </div>
                  {currentGeneration && (
                    <span className="font-mono text-zinc-500 text-[11px]">
                      Timestamp: {currentGeneration.generation_timestamp}
                    </span>
                  )}
                </div>

                {/* Section Header */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    TODAY&apos;S QUALIFYING STORIES (3 CASE STUDIES)
                  </h3>
                </div>

                {/* Three MBA News Cards */}
                <div className="space-y-6">
                  {currentArticles.map((article, index) => (
                    <NewsCard key={article.id || index} article={article} index={index} />
                  ))}
                </div>

                {/* 3 MBA Takeaways Section */}
                <TakeawaysSection takeaways={currentTakeaways} />

              </div>
            )}

          </div>
        )}

        {/* Tab 2: History View */}
        {activeTab === 'history' && (
          <HistoryView onBackToToday={() => setActiveTab('brief')} />
        )}

        {/* Tab 3: Integration & Architecture Inspector */}
        {activeTab === 'integration' && (
          <IntegrationInspector
            agentUrl={agentUrl}
            onUpdateAgentUrl={handleUpdateAgentUrl}
            agentConnected={agentConnected}
            onRefreshStatus={checkAgentStatus}
          />
        )}

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 font-serif">TODAY&apos;S MBA BUSINESS BRIEF</span>
            <span>•</span>
            <span>India Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
            <span>Anaconda Agent Studio (MBA News)</span>
            <span>•</span>
            <span>SQLite Storage</span>
            <span>•</span>
            <span>IST Timezone</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
