import React, { useState, useEffect } from 'react';
import { Layers, Database, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface IntegrationInspectorProps {
  agentUrl: string;
  onUpdateAgentUrl: (url: string) => Promise<void>;
  agentConnected: boolean | null;
  onRefreshStatus: () => Promise<void>;
}

export const IntegrationInspector: React.FC<IntegrationInspectorProps> = ({
  agentUrl,
  onUpdateAgentUrl,
  agentConnected,
  onRefreshStatus,
}) => {
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState(agentUrl);
  const [dbStats, setDbStats] = useState<{ totalGenerations: number; totalArticles: number; dbFileSize: number; dbPath: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setNewUrl(agentUrl);
    fetchDbStats();
  }, [agentUrl]);

  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/config', {
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      if (json?.stats) {
        setDbStats(json.stats);
      }
    } catch (err) {
      console.error('Failed to fetch DB stats:', err);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/agent-status', {
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      setStatusMessage(json?.message || (json?.connected ? 'Connected successfully' : 'Unable to connect to agent'));
      await onRefreshStatus();
      await fetchDbStats();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to ping agent endpoint');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    await onUpdateAgentUrl(newUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    handleTestConnection();
  };

  return (
    <div id="integration-inspector-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">
              Cross-Platform AI-Agent Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Separation between Google AI Studio Frontend, Backend Proxy, SQLite, and Anaconda Agent Studio
            </p>
          </div>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="my-5 bg-slate-50 p-4 border border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[580px] gap-2 text-xs font-mono">
            {/* Step 1: User / Frontend */}
            <div className="bg-white p-3 border border-slate-200 text-center flex-1">
              <div className="font-bold text-slate-900 mb-0.5">1. Frontend</div>
              <div className="text-[11px] text-slate-500 font-sans">React + TS</div>
              <div className="text-[10px] text-slate-600 font-mono mt-1">POST /api/generate-brief</div>
            </div>

            <div className="text-slate-400 font-bold text-sm">→</div>

            {/* Step 2: Backend Proxy */}
            <div className="bg-white p-3 border border-slate-200 text-center flex-1">
              <div className="font-bold text-slate-900 mb-0.5">2. Backend Proxy</div>
              <div className="text-[11px] text-slate-500 font-sans">Express / Node.js</div>
              <div className="text-[10px] text-slate-600 font-mono mt-1">Chat API Proxy</div>
            </div>

            <div className="text-slate-400 font-bold text-sm">→</div>

            {/* Step 3: Anaconda Agent Studio */}
            <div className="bg-slate-900 text-white p-3 border border-slate-800 text-center flex-1">
              <div className="font-bold text-white mb-0.5">3. Anaconda Agent</div>
              <div className="text-[11px] text-slate-300 font-sans">MBA News Agent</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">:54321/api/agents/...</div>
            </div>

            <div className="text-slate-400 font-bold text-sm">→</div>

            {/* Step 4: SQLite Database */}
            <div className="bg-white p-3 border border-slate-200 text-center flex-1">
              <div className="font-bold text-slate-900 mb-0.5">4. SQLite</div>
              <div className="text-[11px] text-slate-500 font-sans">mba_news.db</div>
              <div className="text-[10px] text-slate-600 font-mono mt-1">Archive Storage</div>
            </div>
          </div>
        </div>

        {/* Rule Verification Callout */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">Strict Agent Routing:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              All business intelligence retrieval, Indian newspaper parsing (Mint, Economic Times, The Hindu), and MBA analysis are executed exclusively through the Anaconda Agent Studio REST endpoint.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint Configuration & Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Diagnostics */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-serif text-slate-900">
                Agent Connectivity
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  agentConnected === true
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : agentConnected === false
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agentConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {agentConnected === true ? 'Connected' : agentConnected === false ? 'Disconnected' : 'Checking'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Target endpoint for the MBA News Chat completion:
            </p>

            <form onSubmit={handleSaveUrl} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  ANACONDA_AGENT_URL
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="http://127.0.0.1:54321/api/agents/mba-news/chat"
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors"
                >
                  Save URL
                </button>
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </form>

            {statusMessage && (
              <div className="mt-3 p-2.5 bg-slate-50 rounded text-xs font-mono text-slate-700 border border-slate-200">
                Status: {statusMessage}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors rounded disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">Port: 54321</span>
          </div>
        </div>

        {/* SQLite Database Stats */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-bold font-serif text-slate-900">
                SQLite Storage Layer
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              All generated briefs and extracted MBA case studies are stored in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">mba_news.db</code>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Briefs</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {dbStats?.totalGenerations ?? 0}
                </div>
              </div>
              <div className="bg-slate-50 p-3 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Studies</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {dbStats?.totalArticles ?? 0}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-mono text-slate-800">SQLite 3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">File Name:</span>
                <span className="font-mono text-slate-800">mba_news.db</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Timezone Standard:</span>
                <span className="font-mono text-slate-800">Asia/Kolkata (IST)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Historical Reads: <strong className="text-slate-700">Pure Local DB (0 API Calls)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

