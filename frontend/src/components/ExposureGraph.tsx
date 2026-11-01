import React from 'react';
import { ShieldAlert, ShieldCheck, Server, Box, Skull } from 'lucide-react';

interface ExposureGraphProps {
  cveId?: string;
  product?: string;
  version?: string;
  environment?: string;
  hostname?: string;
  attackerIp?: string;
  isInternetFacing?: boolean;
  score?: number;
  isMitigated?: boolean;
  mitigationLabel?: string;
}

export const ExposureGraph: React.FC<ExposureGraphProps> = ({
  cveId = 'CVE-2024-UNKNOWN',
  product = 'Software Package',
  version,
  environment = 'PROD',
  hostname = 'target-host.prod.sentinel',
  attackerIp = '198.51.100.23',
  isInternetFacing = false,
  score = 50.0,
  isMitigated = false,
  mitigationLabel = 'Rule R7 / Patch Barrier Active'
}) => {
  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-900 dark:text-white">
            Visual Exposure & Blast Radius Graph
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Relational topology linking external threat telemetry to internal enterprise infrastructure
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isMitigated ? (
            <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              SHIELD ACTIVE — PATH SEVERED
            </span>
          ) : (
            <span className="text-[10px] font-mono bg-blue-50 dark:bg-cyan-950 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800 px-2 py-0.5 rounded-full font-semibold shrink-0">
              Path Confirmed
            </span>
          )}
          <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
            Score: {score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="relative w-full py-6 px-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {/* Subtle connecting line */}
        <div
          className={`hidden sm:block absolute inset-x-12 top-[46px] h-0.5 ${
            isMitigated
              ? 'bg-gradient-to-r from-red-400 via-emerald-500 to-emerald-500 opacity-80'
              : 'bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 opacity-60'
          }`}
        ></div>

        {/* 4 Nodes in a clean grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          {/* Node 1: Attacker / Feed */}
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-600 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm shrink-0">
              <Skull className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400 mt-2 truncate max-w-full">
              Threat Origin
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-full" title={attackerIp}>
              {attackerIp}
            </span>
          </div>

          {/* Node 2: CVE / Vulnerability */}
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-600 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 mt-2 truncate max-w-full">
              {cveId}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {isMitigated ? 'Blocked Vector' : 'CVSS Flaw'}
            </span>
          </div>

          {/* Node 3: Software Product */}
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-cyan-950/80 border border-blue-300 dark:border-cyan-600 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-sm shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-cyan-400 mt-2 truncate max-w-full">
              {product}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {version ? `v${version}` : 'Software Spec'}
            </span>
          </div>

          {/* Node 4: Target Asset Hostname */}
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              {isMitigated ? <ShieldCheck className="w-5 h-5" /> : <Server className="w-5 h-5" />}
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate max-w-[120px]" title={hostname || 'target-host'}>
              {(hostname || 'target-host').split('.')[0]}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {environment} • {isInternetFacing ? 'Public Ingress' : 'Internal Host'}
            </span>
          </div>
        </div>

        {isMitigated && (
          <div className="mt-4 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              CONTAINED: {mitigationLabel}
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold">
              Host Protected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

