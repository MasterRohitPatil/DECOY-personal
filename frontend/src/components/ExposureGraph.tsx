import React from 'react';
import { ShieldAlert, Server, Box, Globe, Skull } from 'lucide-react';

interface ExposureGraphProps {
  cveId: string;
  product: string;
  hostname: string;
  attackerIp?: string;
  isInternetFacing: boolean;
  score: number;
}

export const ExposureGraph: React.FC<ExposureGraphProps> = ({
  cveId,
  product,
  hostname,
  attackerIp = '198.51.100.23',
  isInternetFacing,
  score
}) => {
  return (
    <div className="bg-soc-card border border-soc-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Visual Exposure & Blast Radius Graph
          </h4>
          <p className="text-[11px] text-slate-500">Relational topology linking external threat telemetry to internal enterprise infrastructure</p>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
          Active Path Glowing
        </span>
      </div>

      <div className="relative w-full h-44 bg-slate-950/80 rounded-lg border border-slate-900 flex items-center justify-between px-6 overflow-hidden">
        {/* Subtle connecting lines */}
        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500 opacity-60"></div>

        {/* Node 1: Attacker / Feed */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-11 h-11 rounded-lg bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-lg glow-red">
            <Skull className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-red-300 mt-2">Threat Origin</span>
          <span className="text-[10px] text-slate-400 font-mono">{attackerIp}</span>
        </div>

        {/* Node 2: CVE / Vulnerability */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-11 h-11 rounded-lg bg-amber-950/80 border border-amber-500/80 flex items-center justify-center text-amber-400 shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-300 mt-2">{cveId}</span>
          <span className="text-[10px] text-slate-400 font-mono">CVSS Flaw</span>
        </div>

        {/* Node 3: Software Product */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-11 h-11 rounded-lg bg-cyan-950/80 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shadow-md glow-cyan">
            <Box className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-300 mt-2">{product}</span>
          <span className="text-[10px] text-slate-400 font-mono">Software Spec</span>
        </div>

        {/* Node 4: Target Asset Hostname */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-11 h-11 rounded-lg bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center text-emerald-400 shadow-md">
            <Server className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-300 mt-2">{hostname}</span>
          <span className="text-[10px] text-slate-400 font-mono">{isInternetFacing ? 'Public Gateway' : 'Internal Node'}</span>
        </div>

        {/* Exposure Status Pill */}
        <div className="absolute right-4 bottom-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
          Exposure: <span className="text-emerald-400 font-bold">CONFIRMED_EXPOSED</span> (Score: {score.toFixed(1)})
        </div>
      </div>
    </div>
  );
};

