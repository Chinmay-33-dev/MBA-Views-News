import type { NewsArticle, BriefGeneration } from '../src/types.js';

interface RawParsedResult {
  articles: Array<{
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
  }>;
  takeaways: string[];
}

/**
 * Extracts raw assistant text from OpenAI-compatible Chat completion response
 */
export function extractAssistantMessage(responseBody: any): string {
  if (typeof responseBody === 'string') {
    try {
      const parsed = JSON.parse(responseBody);
      return extractAssistantMessage(parsed);
    } catch {
      return responseBody;
    }
  }

  if (responseBody?.choices && Array.isArray(responseBody.choices) && responseBody.choices.length > 0) {
    const choice = responseBody.choices[0];
    if (choice?.message?.content) {
      return typeof choice.message.content === 'string' ? choice.message.content : JSON.stringify(choice.message.content);
    }
    if (choice?.text) {
      return choice.text;
    }
  }

  if (responseBody?.message?.content) {
    return responseBody.message.content;
  }

  if (responseBody?.content) {
    return typeof responseBody.content === 'string' ? responseBody.content : JSON.stringify(responseBody.content);
  }

  if (responseBody?.response) {
    return typeof responseBody.response === 'string' ? responseBody.response : JSON.stringify(responseBody.response);
  }

  return JSON.stringify(responseBody, null, 2);
}

/**
 * Deterministic parser for the Anaconda MBA News Agent response
 */
export function parseAgentBriefResponse(
  rawText: string,
  generationId: string,
  generationDate: string,
  generationTimestamp: string
): { articles: NewsArticle[]; takeaways: string[]; status: 'success' | 'partial' | 'error' } {
  let parsedResult: RawParsedResult = {
    articles: [],
    takeaways: [],
  };

  // 1. Check if the text contains a JSON block
  const jsonMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || rawText.match(/(\{[\s\S]*"articles"[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      if (Array.isArray(jsonData.articles) && jsonData.articles.length > 0) {
        parsedResult.articles = jsonData.articles.map((item: any, idx: number) => ({
          article_number: item.article_number || item.number || idx + 1,
          headline: cleanText(item.headline || item.title || `Business Brief #${idx + 1}`),
          source: cleanText(item.source || item.publication || 'Indian Business News'),
          publication_date: cleanText(item.publication_date || item.date || generationDate),
          what_happened: cleanText(item.what_happened || item.summary || item.happened || ''),
          why_it_matters: cleanText(item.why_it_matters || item.impact || item.matters || ''),
          mba_concept: cleanText(item.mba_concept || item.concept || ''),
          case_study_insight: cleanText(item.case_study_insight || item.case_insight || item.insight || ''),
          management_question: cleanText(item.management_question || item.question || ''),
          article_url: item.article_url || item.url || '',
        }));

        if (Array.isArray(jsonData.takeaways)) {
          parsedResult.takeaways = jsonData.takeaways.map((t: any) => cleanText(String(t))).filter(Boolean);
        }
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  // 2. If JSON extraction didn't yield articles, parse formatted Markdown / Text
  if (parsedResult.articles.length === 0) {
    parsedResult = parseMarkdownFormat(rawText, generationDate);
  }

  // Convert to full typed NewsArticle records
  const articles: NewsArticle[] = parsedResult.articles.map((art, idx) => ({
    id: `${generationId}_art_${idx + 1}`,
    generation_id: generationId,
    generation_date: generationDate,
    generation_timestamp: generationTimestamp,
    article_number: art.article_number || idx + 1,
    headline: art.headline,
    source: art.source,
    publication_date: art.publication_date || generationDate,
    what_happened: art.what_happened,
    why_it_matters: art.why_it_matters,
    mba_concept: art.mba_concept,
    case_study_insight: art.case_study_insight,
    management_question: art.management_question,
    article_url: art.article_url,
    raw_response_id: generationId,
  }));

  const takeaways = parsedResult.takeaways.length > 0
    ? parsedResult.takeaways
    : extractDefaultTakeawaysFromArticles(articles);

  const status: 'success' | 'partial' | 'error' =
    articles.length >= 3 ? 'success' : articles.length > 0 ? 'partial' : 'error';

  return { articles, takeaways, status };
}

function parseMarkdownFormat(text: string, defaultDate: string): RawParsedResult {
  const articles: RawParsedResult['articles'] = [];
  let takeaways: string[] = [];

  // Separate the takeaways section if present
  let mainContent = text;
  const takeawayHeaderRegex = /(?:3\s+MBA\s+TAKEAWAYS|MBA\s+TAKEAWAYS|OVERALL\s+MBA\s+TAKEAWAYS|EXECUTIVE\s+TAKEAWAYS|KEY\s+TAKEAWAYS)[\s\S]*$/i;
  const takeawayMatch = text.match(takeawayHeaderRegex);

  if (takeawayMatch) {
    const takeawayText = takeawayMatch[0];
    mainContent = text.substring(0, takeawayMatch.index);
    takeaways = parseTakeawaysList(takeawayText);
  }

  // Split text into article blocks
  // Common dividers:
  // "### ARTICLE 1", "## Article 1", "### 1.", "---", "ARTICLE 1:", etc.
  const articleBlocks = splitIntoArticleBlocks(mainContent);

  for (let i = 0; i < articleBlocks.length; i++) {
    const block = articleBlocks[i];
    const parsedArticle = parseSingleArticleBlock(block, i + 1, defaultDate);
    if (parsedArticle && (parsedArticle.headline || parsedArticle.what_happened)) {
      articles.push(parsedArticle);
    }
  }

  // If takeaways weren't extracted from the bottom header, check if takeaways are anywhere in the text
  if (takeaways.length === 0) {
    const inlineTakeaways = text.match(/(?:(?:^|\n)(?:\d+\.|\*|\-)\s*(?:Takeaway|Insight|Point|Executive).*)+/gim);
    if (inlineTakeaways) {
      takeaways = parseTakeawaysList(inlineTakeaways.join('\n'));
    }
  }

  return { articles, takeaways };
}

function splitIntoArticleBlocks(text: string): string[] {
  // Try splitting by article headers
  const headerSplit = text.split(/(?=(?:^|\n)(?:#{1,4}\s*(?:ARTICLE\s*\d+|STORY\s*\d+|\d+\.)|(?:\*{1,2}|_{1,2})?(?:ARTICLE\s*\d+|STORY\s*\d+)(?:\*{1,2}|_{1,2})?[:\s]))/im);
  const cleanHeaderBlocks = headerSplit.map(b => b.trim()).filter(b => b.length > 30);

  if (cleanHeaderBlocks.length >= 2) {
    return cleanHeaderBlocks;
  }

  // Try splitting by horizontal rules
  const hrSplit = text.split(/(?:^|\n)(?:-{3,}|\*{3,}|_{3,})(?:\n|$)/);
  const cleanHrBlocks = hrSplit.map(b => b.trim()).filter(b => b.length > 50);
  if (cleanHrBlocks.length >= 2) {
    return cleanHrBlocks;
  }

  // Try splitting by double newlines if 3 major chunks
  const paragraphBlocks = text.split(/\n{3,}/).map(b => b.trim()).filter(b => b.length > 80);
  if (paragraphBlocks.length >= 2) {
    return paragraphBlocks;
  }

  return [text];
}

function parseSingleArticleBlock(block: string, fallbackNumber: number, defaultDate: string) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Extract headline
  let headline = '';
  const headlineMatch = block.match(/(?:HEADLINE|TITLE|STORY|ARTICLE\s*\d*)[:\s*-]*([^\n]+)/i) ||
                        block.match(/^(?:#{1,4}\s*|\*{1,2}\s*)([^\n]+)/m);
  if (headlineMatch) {
    headline = cleanHeaderTitle(headlineMatch[1]);
  } else if (lines.length > 0) {
    headline = cleanHeaderTitle(lines[0]);
  }

  // Extract source
  let source = 'Indian Business News';
  const sourceMatch = block.match(/(?:SOURCE|PUBLICATION|MEDIA|OUTLET)[:\s*-]*([^\n]+)/i);
  if (sourceMatch) {
    source = cleanText(sourceMatch[1]);
  } else {
    // Look for standard Indian business sources mentioned in block
    if (/Mint|Livemint/i.test(block)) source = 'Mint';
    else if (/Economic\s*Times|ET/i.test(block)) source = 'Economic Times';
    else if (/The\s*Hindu/i.test(block)) source = 'The Hindu';
    else if (/Business\s*Standard/i.test(block)) source = 'Business Standard';
  }

  // Extract publication date
  let publication_date = defaultDate;
  const dateMatch = block.match(/(?:PUBLICATION\s*DATE|PUBLISHED\s*DATE|DATE)[:\s*-]*([^\n]+)/i);
  if (dateMatch) {
    publication_date = cleanText(dateMatch[1]);
  }

  // Extract sections:
  const what_happened = extractField(block, [
    /WHAT\s+HAPPENED\??[:\s*-]*([\s\S]*?)(?=(?:WHY\s+(?:DOES\s+IT\s+)?MATTER|MBA\s+CONCEPT|MBA\s+CASE|MANAGEMENT\s+QUESTION|$))/i,
    /SUMMARY[:\s*-]*([\s\S]*?)(?=(?:WHY\s+(?:DOES\s+IT\s+)?MATTER|IMPACT|MBA\s+CONCEPT|$))/i,
  ]);

  const why_it_matters = extractField(block, [
    /WHY\s+(?:DOES\s+IT\s+)?MATTER\??[:\s*-]*([\s\S]*?)(?=(?:MBA\s+CONCEPT|MBA\s+CASE|MANAGEMENT\s+QUESTION|KEY\s+LEARNING|$))/i,
    /BUSINESS\s+IMPACT[:\s*-]*([\s\S]*?)(?=(?:MBA\s+CONCEPT|MBA\s+CASE|MANAGEMENT\s+QUESTION|$))/i,
  ]);

  const mba_concept = extractField(block, [
    /MBA\s+CONCEPT[:\s*-]*([^\n]+)/i,
    /KEY\s+CONCEPT[:\s*-]*([^\n]+)/i,
    /CORE\s+FRAMEWORK[:\s*-]*([^\n]+)/i,
  ]);

  const case_study_insight = extractField(block, [
    /MBA\s+CASE-?STUDY\s+INSIGHT[:\s*-]*([\s\S]*?)(?=(?:MANAGEMENT\s+QUESTION|DISCUSSION\s+QUESTION|$))/i,
    /CASE-?STUDY\s+INSIGHT[:\s*-]*([\s\S]*?)(?=(?:MANAGEMENT\s+QUESTION|DISCUSSION\s+QUESTION|$))/i,
    /STRATEGIC\s+INSIGHT[:\s*-]*([\s\S]*?)(?=(?:MANAGEMENT\s+QUESTION|$))/i,
  ]);

  const management_question = extractField(block, [
    /MANAGEMENT\s+QUESTION[:\s*-]*([\s\S]*?)(?=(?:ARTICLE\s*\d+|STORY\s*\d+|3\s+MBA\s+TAKEAWAYS|$))/i,
    /BOARDROOM\s+QUESTION[:\s*-]*([\s\S]*?)(?=(?:ARTICLE\s*\d+|STORY\s*\d+|$))/i,
    /DISCUSSION\s+QUESTION[:\s*-]*([\s\S]*?)(?=(?:ARTICLE\s*\d+|STORY\s*\d+|$))/i,
  ]);

  const urlMatch = block.match(/(?:URL|LINK|SOURCE\s*URL)[:\s*-]*(https?:\/\/[^\s\)]+)/i);
  const article_url = urlMatch ? urlMatch[1] : undefined;

  return {
    article_number: fallbackNumber,
    headline: headline || `Business Case ${fallbackNumber}`,
    source,
    publication_date,
    what_happened: what_happened || block.slice(0, 300),
    why_it_matters: why_it_matters || '',
    mba_concept: mba_concept || 'Strategic Management',
    case_study_insight: case_study_insight || '',
    management_question: management_question || '',
    article_url,
  };
}

function extractField(text: string, regexList: RegExp[]): string {
  for (const regex of regexList) {
    const match = text.match(regex);
    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }
  return '';
}

function cleanHeaderTitle(title: string): string {
  return title
    .replace(/^#+\s*/, '')
    .replace(/^\*{1,3}|\*{1,3}$/g, '')
    .replace(/^(?:Article|Story|Case)\s*\d+[:\-.]*\s*/i, '')
    .replace(/^Headline[:\-.]*\s*/i, '')
    .trim();
}

function cleanText(val: string): string {
  if (!val) return '';
  return val
    .replace(/^\*{1,3}|\*{1,3}$/g, '')
    .replace(/^[:\-–—]\s*/, '')
    .trim();
}

function parseTakeawaysList(takeawayText: string): string[] {
  const lines = takeawayText.split('\n');
  const items: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Skip the header itself
    if (/^(?:3\s+MBA\s+TAKEAWAYS|MBA\s+TAKEAWAYS|OVERALL|KEY\s+TAKEAWAYS)/i.test(line.replace(/[*#]/g, '').trim())) {
      continue;
    }

    // Match numbered list or bullet points
    const bulletMatch = line.match(/^(?:(?:\d+\.|\*|-|•)\s*)(.*)/);
    if (bulletMatch && bulletMatch[1].trim()) {
      items.push(cleanText(bulletMatch[1]));
    } else if (line.length > 20 && !line.startsWith('#')) {
      items.push(cleanText(line));
    }
  }

  return items.slice(0, 3);
}

function extractDefaultTakeawaysFromArticles(articles: NewsArticle[]): string[] {
  const takeaways: string[] = [];
  for (const art of articles) {
    if (art.mba_concept && art.case_study_insight) {
      takeaways.push(`${art.mba_concept}: ${art.case_study_insight.slice(0, 140)}...`);
    } else if (art.why_it_matters) {
      takeaways.push(art.why_it_matters.slice(0, 140));
    }
  }
  return takeaways;
}
