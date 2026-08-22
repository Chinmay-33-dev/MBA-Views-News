import React from 'react';
import { Newspaper, History, Activity, Sparkles, BookOpen, Layers } from 'lucide-react';
import { getCurrentIndianDate, getCurrentIndianTime } from '../utils/timeUtils.js';

interface HeaderProps {
  activeTab: 'brief' | 'history' | 'integration';
  setActiveTab: (tab: 'brief' | 'history' | 'integration') => void;
  agentConnected: boolean | null;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  agentConnected,
  historyCount,
}) => {
  const indianDate = getCurrentIndianDate();
  const indianTime = getCurrentIndianTime();

  return (
    <header id="app-header" className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-serif">
                  TODAY&apos;S MBA BUSINESS BRIEF
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                  India Edition
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Turn today&apos;s Indian business news into MBA case-study insights
              </p>
            </div>
          </div>

          {/* Time & Tab Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* IST Time Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-900">{indianDate}</span>
              <span className="text-zinc-400">|</span>
              <span className="text-zinc-500 font-mono text-[11px]">{indianTime}</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button
                id="nav-tab-today-brief"
                onClick={() => setActiveTab('brief')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'brief'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Today&apos;s Brief</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {historyCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-zinc-200 text-zinc-700 text-[10px] rounded-full font-mono">
                    {historyCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-integration"
                onClick={() => setActiveTab('integration')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'integration'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-zinc-700" />
                <span className="hidden sm:inline">Agent Architecture</span>
                <span className="sm:hidden">Status</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    agentConnected === true
                      ? 'bg-emerald-500'
                      : agentConnected === false
                      ? 'bg-amber-500'
                      : 'bg-zinc-400'
                  }`}
                  title={agentConnected ? 'Anaconda Agent Reachable' : 'Anaconda Agent Disconnected'}
                />
              </button>
            </nav>

          </div>
        </div>
      </div>
    </header>
  );
};
