import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import type { BriefGeneration, NewsArticle, HistoryGroup } from '../src/types.js';

const DB_FILE = path.join(process.cwd(), 'mba_news.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('[DB] Failed to load existing database file, creating fresh database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  persistDb();
  return dbInstance;
}

function persistDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[DB] Failed to write database to disk:', err);
  }
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS brief_generations (
      id TEXT PRIMARY KEY,
      generation_date TEXT NOT NULL,
      generation_timestamp TEXT NOT NULL,
      raw_agent_response TEXT,
      takeaways TEXT,
      status TEXT NOT NULL,
      article_count INTEGER DEFAULT 0,
      sources TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL,
      generation_date TEXT NOT NULL,
      generation_timestamp TEXT NOT NULL,
      article_number INTEGER NOT NULL,
      headline TEXT NOT NULL,
      source TEXT,
      publication_date TEXT,
      what_happened TEXT,
      why_it_matters TEXT,
      mba_concept TEXT,
      case_study_insight TEXT,
      management_question TEXT,
      article_url TEXT,
      raw_response_id TEXT,
      FOREIGN KEY (generation_id) REFERENCES brief_generations(id)
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_gen_id ON news_articles(generation_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_generations_date ON brief_generations(generation_date);`);

  // Check if initial seed data is needed
  const checkStmt = db.prepare(`SELECT COUNT(*) as count FROM brief_generations`);
  checkStmt.step();
  const count = Number(checkStmt.getAsObject().count || 0);
  checkStmt.free();

  if (count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database): void {
  const genId = 'gen_seed_initial';
  const genDate = '24 May 2024';
  const genTimestamp = '24 May 2024, 08:30 IST';
  const takeaways = [
    'Operational speed is becoming the primary differentiator in retail over pricing or product variety.',
    'Internal technical resiliency is no longer a back-office concern but a top-tier regulatory risk.',
    'Ecosystem integration provides a deeper moat than simple product superiority in nascent markets.'
  ];
  const sources = ['Economic Times', 'Mint', 'The Hindu'];

  db.run(
    `INSERT INTO brief_generations (id, generation_date, generation_timestamp, raw_agent_response, takeaways, status, article_count, sources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [genId, genDate, genTimestamp, 'Initial MBA Case Studies Seed', JSON.stringify(takeaways), 'success', 3, JSON.stringify(sources)]
  );

  const sampleArticles = [
    {
      id: `${genId}_art_1`,
      generation_id: genId,
      generation_date: genDate,
      generation_timestamp: genTimestamp,
      article_number: 1,
      headline: "Reliance Retail's Quick Commerce Pivot",
      source: 'Economic Times',
      publication_date: '24 May 2024',
      what_happened: 'Reliance Retail is preparing to launch a 10-minute delivery service via its JioMart app across top Indian metros, competing directly with Blinkit and Zepto.',
      why_it_matters: 'The move signifies a shift from warehousing models to hyper-local fulfillment, leveraging existing brick-and-mortar footprints as micro-fulfillment centers.',
      mba_concept: 'Last-Mile Operational Efficiency',
      case_study_insight: 'The move leverages existing retail network density to compress delivery radius, fundamentally altering unit economics without massive warehouse capex.',
      management_question: 'How does leveraging existing store infrastructure minimize customer acquisition and dark-store leasing costs compared to pure-play quick commerce players?',
      article_url: 'https://economictimes.indiatimes.com'
    },
    {
      id: `${genId}_art_2`,
      generation_id: genId,
      generation_date: genDate,
      generation_timestamp: genTimestamp,
      article_number: 2,
      headline: "HDFC Bank's Tech Stack Overhaul",
      source: 'Mint',
      publication_date: '24 May 2024',
      what_happened: 'Following RBI directives, HDFC Bank has accelerated its cloud-native migration to reduce system outages and improve digital banking throughput.',
      why_it_matters: 'Regulatory intervention has forced systemic legacy banking architectures into modern distributed microservices and continuous availability models.',
      mba_concept: 'Technical Debt vs. Scalability',
      case_study_insight: 'Regulatory pressure can act as a catalyst for overdue infrastructure investments, forcing a rip-and-replace strategy over incremental patches.',
      management_question: 'Is regulatory compliance an operational cost center or a strategic moat for legacy incumbents navigating digital disruption?',
      article_url: 'https://livemint.com'
    },
    {
      id: `${genId}_art_3`,
      generation_id: genId,
      generation_date: genDate,
      generation_timestamp: genTimestamp,
      article_number: 3,
      headline: 'Tata Motors EV Market Consolidation',
      source: 'The Hindu',
      publication_date: '24 May 2024',
      what_happened: 'Tata Motors reported a 22% jump in EV sales, solidifying their 70% market share despite entry of global competitors like Hyundai and Kia.',
      why_it_matters: 'Early domestic manufacturing positioning and proprietary charging infrastructure have created durable consumer lock-in and fleet advantages.',
      mba_concept: 'First-Mover Advantage Sustainability',
      case_study_insight: 'Aggressive ecosystem building (Tata Power charging stations) creates high switching costs for consumers, protecting the dominant market position.',
      management_question: 'Can horizontal ecosystem integration effectively block specialized global competitors entering price-sensitive emerging markets?',
      article_url: 'https://thehindu.com'
    }
  ];

  for (const a of sampleArticles) {
    db.run(
      `INSERT INTO news_articles (id, generation_id, generation_date, generation_timestamp, article_number, headline, source, publication_date, what_happened, why_it_matters, mba_concept, case_study_insight, management_question, article_url, raw_response_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.generation_id, a.generation_date, a.generation_timestamp, a.article_number, a.headline, a.source, a.publication_date, a.what_happened, a.why_it_matters, a.mba_concept, a.case_study_insight, a.management_question, a.article_url, a.id]
    );
  }
}

export async function saveBriefGeneration(
  generation: BriefGeneration,
  articles: NewsArticle[]
): Promise<void> {
  const db = await getDb();

  const takeawaysJson = JSON.stringify(generation.takeaways || []);
  const sourcesJson = JSON.stringify(generation.sources || []);

  db.run(
    `INSERT OR REPLACE INTO brief_generations 
     (id, generation_date, generation_timestamp, raw_agent_response, takeaways, status, article_count, sources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generation.id,
      generation.generation_date,
      generation.generation_timestamp,
      generation.raw_agent_response || '',
      takeawaysJson,
      generation.status,
      articles.length,
      sourcesJson,
    ]
  );

  for (const article of articles) {
    db.run(
      `INSERT OR REPLACE INTO news_articles
       (id, generation_id, generation_date, generation_timestamp, article_number, headline, source, publication_date, what_happened, why_it_matters, mba_concept, case_study_insight, management_question, article_url, raw_response_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.id,
        generation.id,
        article.generation_date,
        article.generation_timestamp,
        article.article_number,
        article.headline,
        article.source || 'Unknown',
        article.publication_date || article.generation_date,
        article.what_happened || '',
        article.why_it_matters || '',
        article.mba_concept || '',
        article.case_study_insight || '',
        article.management_question || '',
        article.article_url || '',
        article.raw_response_id || '',
      ]
    );
  }

  persistDb();
}

export async function getLatestBrief(): Promise<{ generation: BriefGeneration; articles: NewsArticle[]; takeaways: string[] } | null> {
  const db = await getDb();
  
  const stmt = db.prepare(`SELECT * FROM brief_generations ORDER BY generation_timestamp DESC LIMIT 1`);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  const generationId = String(row.id);
  const articles = await getArticlesForGeneration(generationId);
  
  let takeaways: string[] = [];
  try {
    takeaways = JSON.parse(String(row.takeaways || '[]'));
  } catch {
    takeaways = [];
  }

  let sources: string[] = [];
  try {
    sources = JSON.parse(String(row.sources || '[]'));
  } catch {
    sources = [];
  }

  const generation: BriefGeneration = {
    id: generationId,
    generation_date: String(row.generation_date),
    generation_timestamp: String(row.generation_timestamp),
    raw_agent_response: String(row.raw_agent_response || ''),
    takeaways,
    status: row.status as 'success' | 'error' | 'partial',
    article_count: Number(row.article_count || articles.length),
    sources,
    articles,
  };

  return { generation, articles, takeaways };
}

export async function getBriefById(generationId: string): Promise<{ generation: BriefGeneration; articles: NewsArticle[]; takeaways: string[] } | null> {
  const db = await getDb();
  
  const stmt = db.prepare(`SELECT * FROM brief_generations WHERE id = ?`);
  stmt.bind([generationId]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  const articles = await getArticlesForGeneration(generationId);
  
  let takeaways: string[] = [];
  try {
    takeaways = JSON.parse(String(row.takeaways || '[]'));
  } catch {
    takeaways = [];
  }

  let sources: string[] = [];
  try {
    sources = JSON.parse(String(row.sources || '[]'));
  } catch {
    sources = [];
  }

  const generation: BriefGeneration = {
    id: String(row.id),
    generation_date: String(row.generation_date),
    generation_timestamp: String(row.generation_timestamp),
    raw_agent_response: String(row.raw_agent_response || ''),
    takeaways,
    status: row.status as 'success' | 'error' | 'partial',
    article_count: Number(row.article_count || articles.length),
    sources,
    articles,
  };

  return { generation, articles, takeaways };
}

export async function getArticlesForGeneration(generationId: string): Promise<NewsArticle[]> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM news_articles WHERE generation_id = ? ORDER BY article_number ASC`);
  stmt.bind([generationId]);
  
  const articles: NewsArticle[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    articles.push({
      id: String(row.id),
      generation_id: String(row.generation_id),
      generation_date: String(row.generation_date),
      generation_timestamp: String(row.generation_timestamp),
      article_number: Number(row.article_number),
      headline: String(row.headline),
      source: String(row.source),
      publication_date: String(row.publication_date),
      what_happened: String(row.what_happened),
      why_it_matters: String(row.why_it_matters),
      mba_concept: String(row.mba_concept),
      case_study_insight: String(row.case_study_insight),
      management_question: String(row.management_question),
      article_url: String(row.article_url || ''),
      raw_response_id: String(row.raw_response_id || ''),
    });
  }
  stmt.free();
  return articles;
}

export async function getHistoryGroups(): Promise<HistoryGroup[]> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM brief_generations ORDER BY generation_timestamp DESC`);
  
  const allGenerations: BriefGeneration[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    let takeaways: string[] = [];
    try {
      takeaways = JSON.parse(String(row.takeaways || '[]'));
    } catch {
      takeaways = [];
    }

    let sources: string[] = [];
    try {
      sources = JSON.parse(String(row.sources || '[]'));
    } catch {
      sources = [];
    }

    allGenerations.push({
      id: String(row.id),
      generation_date: String(row.generation_date),
      generation_timestamp: String(row.generation_timestamp),
      raw_agent_response: String(row.raw_agent_response || ''),
      takeaways,
      status: row.status as 'success' | 'error' | 'partial',
      article_count: Number(row.article_count || 0),
      sources,
    });
  }
  stmt.free();

  // Populate articles for each generation
  for (const gen of allGenerations) {
    gen.articles = await getArticlesForGeneration(gen.id);
  }

  // Group by date
  const groupsMap = new Map<string, BriefGeneration[]>();
  for (const gen of allGenerations) {
    const dateKey = gen.generation_date;
    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, []);
    }
    groupsMap.get(dateKey)!.push(gen);
  }

  const groups: HistoryGroup[] = [];
  for (const [date, generations] of groupsMap.entries()) {
    groups.push({ date, generations });
  }

  return groups;
}

export async function getBriefsByDate(date: string): Promise<BriefGeneration[]> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM brief_generations WHERE generation_date = ? ORDER BY generation_timestamp DESC`);
  stmt.bind([date]);

  const generations: BriefGeneration[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    let takeaways: string[] = [];
    try {
      takeaways = JSON.parse(String(row.takeaways || '[]'));
    } catch {
      takeaways = [];
    }
    let sources: string[] = [];
    try {
      sources = JSON.parse(String(row.sources || '[]'));
    } catch {
      sources = [];
    }

    generations.push({
      id: String(row.id),
      generation_date: String(row.generation_date),
      generation_timestamp: String(row.generation_timestamp),
      raw_agent_response: String(row.raw_agent_response || ''),
      takeaways,
      status: row.status as 'success' | 'error' | 'partial',
      article_count: Number(row.article_count || 0),
      sources,
    });
  }
  stmt.free();

  for (const gen of generations) {
    gen.articles = await getArticlesForGeneration(gen.id);
  }

  return generations;
}

export async function getDbStats(): Promise<{ totalGenerations: number; totalArticles: number; dbFileSize: number; dbPath: string }> {
  const db = await getDb();
  const genStmt = db.prepare(`SELECT COUNT(*) as count FROM brief_generations`);
  genStmt.step();
  const totalGenerations = Number(genStmt.getAsObject().count || 0);
  genStmt.free();

  const artStmt = db.prepare(`SELECT COUNT(*) as count FROM news_articles`);
  artStmt.step();
  const totalArticles = Number(artStmt.getAsObject().count || 0);
  artStmt.free();

  let dbFileSize = 0;
  if (fs.existsSync(DB_FILE)) {
    dbFileSize = fs.statSync(DB_FILE).size;
  }

  return {
    totalGenerations,
    totalArticles,
    dbFileSize,
    dbPath: DB_FILE,
  };
}
