import React from 'react';
import { Database, Search, GitCompare, Gauge, Bell, CheckCircle2 } from 'lucide-react';

interface PipelineStepperProps {
  currentStage: number; // 0 to 5 (0 = idle, 1 = ingest, 2 = extract, 3 = match, 4 = score, 5 = warn)
  stageLabel?: string;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentStage, stageLabel }) => {
  const steps = [
    { num: 1, label: 'Feed Ingest', icon: Database, desc: 'Cached NVD/CERT' },
    { num: 2, label: 'Entity Extract', icon: Search, desc: 'Regex & SemVer' },
    { num: 3, label: 'Version Match', icon: GitCompare, desc: 'Asset Inventory' },
    { num: 4, label: 'SEXVI Score', icon: Gauge, desc: 'Rules R1–R7' },
    { num: 5, label: 'Early Warning', icon: Bell, desc: 'Evidence Brief' }
  ];

  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
          <span className="text-xs uppercase font-semibold tracking-wider text-cyan-700 dark:text-cyan-400">Deterministic Threat Pipeline</span>
        </div>
        {stageLabel && (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
            {stageLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentStage > s.num;
          const isActive = currentStage === s.num;

          return (
            <div
              key={s.num}
              className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 glow-cyan scale-105'
                  : isDone
                  ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full mb-1.5 transition-colors">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-400'}`} />
                )}
              </div>
              <span className={`text-[12px] font-bold ${isActive ? 'text-cyan-700 dark:text-cyan-300' : isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {s.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5 hidden md:block">
                {s.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

