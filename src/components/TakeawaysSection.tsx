import React from 'react';

interface TakeawaysSectionProps {
  takeaways: string[];
}

export const TakeawaysSection: React.FC<TakeawaysSectionProps> = ({ takeaways }) => {
  if (!takeaways || takeaways.length === 0) {
    return null;
  }

  return (
    <section id="mba-takeaways-section" className="mt-8 mb-4">
      <div className="bg-slate-900 text-white rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center shadow-xs">
        {/* Left header column */}
        <div className="border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-8 md:mr-8 flex-shrink-0 w-full md:w-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Executive Summary
          </div>
          <div className="text-lg font-serif italic text-white font-semibold">
            3 MBA Takeaways
          </div>
        </div>

        {/* Right 3-column takeaway grid */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 md:pt-0 w-full">
          {takeaways.map((takeaway, idx) => (
            <div key={idx} className="text-xs flex space-x-3 items-start">
              <span className="text-slate-500 font-bold font-mono text-[11px] pt-0.5">
                0{idx + 1}
              </span>
              <p className="text-slate-300 leading-relaxed font-sans">
                {takeaway}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

