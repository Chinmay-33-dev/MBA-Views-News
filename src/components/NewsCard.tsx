import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { NewsArticle } from '../types.js';

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, index }) => {
  const caseNumber = String(article.article_number || index + 1).padStart(2, '0');
  const sourceName = article.source || 'Business Press';

  return (
    <article
      id={`news-card-${article.article_number || index + 1}`}
      className="bg-white border border-slate-200 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs"
    >
      <div>
        {/* Card Header: Case number & Source */}
        <div className="flex justify-between items-center mb-3.5">
          <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 font-bold tracking-tighter font-mono">
            {caseNumber}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {sourceName}
            </span>
            {article.article_url && (
              <a
                href={article.article_url}
                target="_blank"
                rel="noreferrer"
                title="Read original source article"
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Headline */}
        <h3 className="font-serif text-lg font-bold leading-tight mb-4 text-slate-900">
          {article.headline}
        </h3>

        {/* Structural Sections */}
        <div className="space-y-3.5 text-xs leading-relaxed">
          {/* What Happened */}
          {article.what_happened && (
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
                What Happened
              </span>
              <p className="text-slate-700">
                {article.what_happened}
              </p>
            </div>
          )}

          {/* Why It Matters */}
          {article.why_it_matters && (
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
                Why It Matters
              </span>
              <p className="text-slate-700">
                {article.why_it_matters}
              </p>
            </div>
          )}

          {/* MBA Concept */}
          {article.mba_concept && (
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
                MBA Concept
              </span>
              <p className="font-medium text-slate-900 italic font-serif">
                {article.mba_concept}
              </p>
            </div>
          )}

          {/* Case-Study Insight */}
          {article.case_study_insight && (
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
                Case-Study Insight
              </span>
              <p className="text-slate-700">
                {article.case_study_insight}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Management Question / Boardroom debate at bottom */}
      {article.management_question && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
            Management Question
          </span>
          <p className="text-[11px] italic text-slate-600 font-serif leading-snug">
            &ldquo;{article.management_question}&rdquo;
          </p>
        </div>
      )}
    </article>
  );
};
