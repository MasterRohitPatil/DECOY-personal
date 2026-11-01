import React from 'react';
import { Dimensions } from '../types';

interface DimensionBarsProps {
  dimensions: Dimensions;
  confidence: number;
}

export const DimensionBars: React.FC<DimensionBarsProps> = ({ dimensions, confidence }) => {
  const dims = [
    { key: 'S', label: 'Severity (CVSS)', val: dimensions.S, weight: '30%', desc: 'Base vulnerability flaw severity' },
    { key: 'E', label: 'Exploitation (KEV/PoC)', val: dimensions.E, weight: '30%', desc: 'Exploit ladder level L0–L5' },
    { key: 'X', label: 'Exposure Factor', val: dimensions.X, weight: '20%', desc: 'Internet-facing vs internal isolation' },
    { key: 'V', label: 'Velocity / Origins', val: dimensions.V, weight: '10%', desc: 'Reporting acceleration across sources' },
    { key: 'I', label: 'Impact / Criticality', val: dimensions.I, weight: '10%', desc: 'Asset tier & business dependencies' }
  ];

  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-800 dark:text-slate-200">
          5-Dimension Transparent Scoring
        </h4>
        <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 px-2 py-0.5 rounded font-semibold">
          Confidence: {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="space-y-2.5">
        {dims.map(d => {
          const pct = Math.min(Math.max(d.val * 100, 0), 100);
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-slate-100 dark:bg-slate-900 px-1 rounded text-[11px] border border-slate-200 dark:border-slate-800">{d.key}</span>
                  {d.label}
                  <span className="text-[10px] text-slate-400 font-mono">({d.weight})</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {d.val.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] flex justify-between items-center">
        <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">Section 3.4 Formula: S_EXVI = 0.35·C + 0.30·E + 0.20·A + 0.15·T</span>
        <span className="text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold">Deterministic</span>
      </div>
    </div>
  );
};

