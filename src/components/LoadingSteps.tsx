import React, { useEffect, useState } from 'react';
import { Loader2, Radio, Search, BrainCircuit, FileText, Database, Check } from 'lucide-react';

interface LoadingStepsProps {
  stage?: string;
}

const STEPS = [
  { id: 'connecting', label: 'Connecting to MBA News Agent...', icon: Radio },
  { id: 'retrieving', label: "Retrieving today's business news from Mint, Economic Times, The Hindu...", icon: Search },
  { id: 'analyzing', label: 'Analyzing MBA implications & identifying core frameworks...', icon: BrainCircuit },
  { id: 'preparing', label: 'Preparing your business brief & management questions...', icon: FileText },
  { id: 'saving', label: "Saving today's brief into SQLite database...", icon: Database },
];

export const LoadingSteps: React.FC<LoadingStepsProps> = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Progress through visual steps while backend executes
    const intervals = [2500, 7000, 12000, 18000];
    const timers: NodeJS.Timeout[] = [];

    intervals.forEach((time, index) => {
      const timer = setTimeout(() => {
        setCurrentStepIndex(index + 1);
      }, time);
      timers.push(timer);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div id="loading-progress-card" className="max-w-2xl mx-auto my-8 bg-white border border-slate-200 p-8 shadow-xs">
      {/* Top spinner */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        
        <h3 className="text-lg font-bold font-serif text-slate-900">
          Synthesizing Today&apos;s MBA Business Brief
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          The <span className="font-semibold text-slate-700">MBA News Agent</span> is scanning Indian business feeds and structuring today&apos;s case studies.
        </p>
      </div>

      {/* Progress Steps List */}
      <div className="space-y-2.5 max-w-lg mx-auto">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2.5 border text-xs transition-colors ${
                isCurrent
                  ? 'bg-slate-50 border-slate-400 text-slate-900 font-semibold'
                  : isDone
                  ? 'bg-slate-50/50 border-slate-200 text-slate-700'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <div className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 bg-slate-200 text-slate-800 flex items-center justify-center animate-pulse">
                    <Icon className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Icon className="w-3 h-3" />
                  </div>
                )}
              </div>

              <span className="flex-1 leading-snug">
                {step.label}
              </span>

              {isCurrent && (
                <span className="text-[10px] font-mono text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  Running
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 font-mono">
          Endpoint: http://127.0.0.1:54321/api/agents/mba-news/chat
        </p>
      </div>
    </div>
  );
};

