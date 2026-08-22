import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  saveBriefGeneration,
  getLatestBrief,
  getBriefById,
  getHistoryGroups,
  getBriefsByDate,
  getDbStats,
} from './server/db.js';
import {
  callAnacondaMbaNewsAgent,
  checkAgentConnectivity,
  getAgentUrl,
  setAgentUrl,
  generateDemonstrationBrief,
} from './server/agentClient.js';
import { parseAgentBriefResponse } from './server/parser.js';
import { getIndianDateFormatted, getIndianTimestampFormatted } from './server/timeUtils.js';
import type { BriefGeneration, BriefApiResponse } from './src/types.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: "Today's MBA Business Brief Backend",
      time: new Date().toISOString(),
    });
  });

  // Agent status and configuration
  app.get('/api/agent-status', async (req, res) => {
    try {
      const status = await checkAgentConnectivity();
      res.json({
        endpoint: getAgentUrl(),
        ...status,
      });
    } catch (err: any) {
      res.status(500).json({
        endpoint: getAgentUrl(),
        connected: false,
        status: 0,
        message: err?.message || 'Failed to check status',
        durationMs: 0,
      });
    }
  });

  // Configuration endpoint
  app.get('/api/config', async (req, res) => {
    const stats = await getDbStats();
    res.json({
      agentUrl: getAgentUrl(),
      stats,
    });
  });

  app.post('/api/config', (req, res) => {
    const { agentUrl } = req.body;
    if (agentUrl && typeof agentUrl === 'string') {
      setAgentUrl(agentUrl);
      return res.json({ success: true, agentUrl: getAgentUrl() });
    }
    return res.status(400).json({ success: false, error: 'Invalid agent URL' });
  });

  // Primary Generation Endpoint
  app.post('/api/generate-brief', async (req, res) => {
    const now = new Date();
    const generationDate = getIndianDateFormatted(now);
    const generationTimestamp = getIndianTimestampFormatted(now);
    const generationId = `gen_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const mode = req.body?.mode || 'live';

    console.log(`[API] Triggering brief generation (Mode: ${mode}) for IST date: ${generationDate} (ID: ${generationId})`);

    try {
      let rawAgentText = '';
      let responseTimeMs = 0;
      let agentOnline = false;

      if (mode === 'demo') {
        rawAgentText = generateDemonstrationBrief(generationDate);
        responseTimeMs = 250;
        agentOnline = false;
      } else {
        // 1. Send request to Anaconda Agent Studio MBA News Agent
        const agentResult = await callAnacondaMbaNewsAgent();

        if (!agentResult.success) {
          console.log(`[API] Anaconda Agent Studio unreachable at ${getAgentUrl()} (${agentResult.error}). Engaging Standby MBA Intelligence Engine.`);
          rawAgentText = generateDemonstrationBrief(generationDate);
          responseTimeMs = agentResult.durationMs || 300;
          agentOnline = false;
        } else {
          rawAgentText = agentResult.rawText || '';
          responseTimeMs = agentResult.durationMs || 0;
          agentOnline = true;
        }
      }

      // 2. Parse response into 3 structured MBA articles and takeaways
      const { articles, takeaways, status } = parseAgentBriefResponse(
        rawAgentText,
        generationId,
        generationDate,
        generationTimestamp
      );

      if (articles.length === 0) {
        console.error(`[API] Parser failed to extract articles from raw response`);
        const failedGen: BriefGeneration = {
          id: generationId,
          generation_date: generationDate,
          generation_timestamp: generationTimestamp,
          raw_agent_response: rawAgentText,
          takeaways: [],
          status: 'error',
          article_count: 0,
          sources: [],
        };
        await saveBriefGeneration(failedGen, []);

        const response: BriefApiResponse = {
          success: false,
          error: "The agent returned a response, but the application could not structure it correctly.",
          details: "Could not identify 3 distinct MBA case-study articles from the agent's textual output.",
          stage: 'parsing',
        };
        return res.status(422).json(response);
      }

      // Collect sources represented
      const sourceSet = new Set<string>();
      articles.forEach(a => {
        if (a.source) sourceSet.add(a.source);
      });
      const sources = Array.from(sourceSet);

      const briefGeneration: BriefGeneration = {
        id: generationId,
        generation_date: generationDate,
        generation_timestamp: generationTimestamp,
        raw_agent_response: rawAgentText,
        takeaways,
        status,
        article_count: articles.length,
        sources,
        articles,
      };

      // 3. Save to SQLite database
      await saveBriefGeneration(briefGeneration, articles);
      console.log(`[API] Saved ${articles.length} articles to SQLite database for brief ID: ${generationId}`);

      // 4. Return structured response to frontend
      const response: BriefApiResponse = {
        success: true,
        data: {
          generation: briefGeneration,
          articles,
          takeaways,
        },
        agentStatus: {
          connected: agentOnline,
          endpoint: getAgentUrl(),
          responseTimeMs,
        },
      };

      return res.json(response);
    } catch (err: any) {
      console.error(`[API] Unexpected error in /api/generate-brief:`, err);
      return res.status(500).json({
        success: false,
        error: "An unexpected server error occurred while processing the brief.",
        details: err?.message || String(err),
      });
    }
  });

  // Get Latest Generated Brief from DB
  app.get('/api/latest-brief', async (req, res) => {
    try {
      const latest = await getLatestBrief();
      if (!latest) {
        return res.json({ success: true, data: null });
      }
      return res.json({
        success: true,
        data: latest,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // History Endpoints
  app.get('/api/history', async (req, res) => {
    try {
      const historyGroups = await getHistoryGroups();
      return res.json({
        success: true,
        data: historyGroups,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get('/api/history/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const briefs = await getBriefsByDate(date);
      return res.json({
        success: true,
        data: briefs,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Single brief retrieval by generation ID (Pure DB lookup - NEVER calls agent)
  app.get('/api/brief/:generationId', async (req, res) => {
    try {
      const { generationId } = req.params;
      const brief = await getBriefById(generationId);
      if (!brief) {
        return res.status(404).json({ success: false, error: 'Brief record not found' });
      }
      return res.json({
        success: true,
        data: brief,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Ensure any unmatched /api/* route returns JSON 404, NEVER falling through to Vite HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.path}`,
    });
  });

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Middleware Error]:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal Server Error',
    });
  });

  // Vite middleware in dev / static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] "Today's MBA Business Brief" running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});
