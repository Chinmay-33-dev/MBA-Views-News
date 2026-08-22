import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, Settings } from 'lucide-react';

interface ErrorBannerProps {
  error: string;
  details?: string;
  onRetry: () => void;
  onGenerateDemo?: () => void;
  onOpenSettings?: () => void;
  agentUrl?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  details,
  onRetry,
  onGenerateDemo,
  onOpenSettings,
  agentUrl = 'http://127.0.0.1:54321/api/agents/mba-news/chat',
}) => {
  const isNotRunning = error.includes('Unable to connect to the MBA News Agent') || error.includes('not running') || error.includes('ECONNREFUSED');

  return (
    <div id="error-alert-banner" className="max-w-3xl mx-auto my-6 bg-white border border-rose-200 p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 font-serif">
            Agent Connection Required
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {error}
          </p>

          {details && (
            <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-700 break-all">
              {details}
            </div>
          )}

          {/* Troubleshooting guidance */}
          {isNotRunning && (
            <div className="mt-3.5 bg-slate-50/70 p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <Terminal className="w-3 h-3 text-slate-500" />
                Connection Steps:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-0.5">
                <li>Open <strong>Anaconda Agent Studio</strong> on your local machine.</li>
                <li>Launch the <strong>MBA News</strong> agent REST endpoint (<code className="bg-slate-200/60 px-1 py-0.5 font-mono text-slate-800">{agentUrl}</code>).</li>
                <li>Once active, click <strong>Try Again</strong> below.</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              id="retry-generate-btn"
              onClick={onRetry}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try Again</span>
            </button>

            {onGenerateDemo && (
              <button
                id="generate-demo-btn"
                onClick={onGenerateDemo}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium rounded transition-colors"
              >
                <span>Generate Demo Brief (Offline Mode)</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded transition-colors"
              >
                <Settings className="w-3 h-3 text-slate-500" />
                <span>Configure Agent Endpoint</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

