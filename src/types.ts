export interface NewsArticle {
  id: string;
  generation_id: string;
  generation_date: string;
  generation_timestamp: string;
  article_number: number;
  headline: string;
  source: string;
  publication_date: string;
  what_happened: string;
  why_it_matters: string;
  mba_concept: string;
  case_study_insight: string;
  management_question: string;
  article_url?: string;
  raw_response_id?: string;
}

export interface BriefGeneration {
  id: string;
  generation_date: string;
  generation_timestamp: string;
  raw_agent_response: string;
  takeaways: string[];
  status: 'success' | 'error' | 'partial';
  article_count: number;
  sources: string[];
  articles?: NewsArticle[];
}

export interface BriefApiResponse {
  success: boolean;
  data?: {
    generation: BriefGeneration;
    articles: NewsArticle[];
    takeaways: string[];
  };
  error?: string;
  details?: string;
  stage?: string;
  agentStatus?: {
    connected: boolean;
    endpoint: string;
    responseTimeMs?: number;
  };
}

export interface HistoryGroup {
  date: string;
  generations: BriefGeneration[];
}

export interface AgentConfig {
  endpoint: string;
  status: 'online' | 'offline' | 'checking';
  lastChecked?: string;
}
