import React, { useState } from 'react';
import { X, Shield, FileText, CheckCircle, ArrowRight, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { WarningDetail } from '../types';
import { RiskGauge } from './RiskGauge';
import { DimensionBars } from './DimensionBars';
import { ExposureGraph } from './ExposureGraph';
import { api } from '../api';

interface WarningDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: WarningDetail | null;
  onKevEscalated: (newScore: number) => void;
  onApproved: () => void;
}

export const WarningDetailModal: React.FC<WarningDetailModalProps> = ({
  isOpen,
  onClose,
  warning,
  onKevEscalated,
  onApproved
}) => {
  const [escalating, setEscalating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedState, setApprovedState] = useState(false);

  if (!isOpen || !warning) return null;

  const handleKevClick = async () => {
    setEscalating(true);
    try {
      const cve = warning.threat?.cve_ids?.[0] || 'CVE-2026-9901';
      const res = await api.escalateKev(cve);
      onKevEscalated(res.new_score);
    } finally {
      setEscalating(false);
    }
  };

  const handleApproveClick = async () => {
    setApproving(true);
    try {
      await api.approveWarning(warning.id);
      setApprovedState(true);
      onApproved();
    } finally {
      setApproving(false);
    }
  };

  const statuses = [
    'NEW', 'TRIAGED', 'MATCHED', 'EVALUATED', 'PENDING_APPROVAL',
    'APPROVED', 'PATCH_SIMULATED', 'VERIFICATION', 'CLOSED'
  ];

  const currentIdx = approvedState ? 6 : Math.max(statuses.indexOf(warning.status), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-soc-card border border-soc-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                {warning.id}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                warning.band === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {warning.band} Priority
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Asset: <strong className="text-white">{warning.target_hostname}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{warning.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Row: Gauge & 5-Dimension Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 flex flex-col justify-between">
              <RiskGauge score={warning.risk_score} band={warning.band} />

              {/* Demo Action: Add to KEV button */}
              <button
                onClick={handleKevClick}
                disabled={escalating || warning.risk_score >= 90}
                className="mt-3 w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all glow-red"
              >
                <Zap className="w-4 h-4" />
                {escalating ? 'Escalating...' : warning.risk_score >= 90 ? 'Listed in CISA KEV (93.4 Critical)' : 'Simulate: Add to CISA KEV'}
              </button>
            </div>

            <div className="md:col-span-2">
              <DimensionBars dimensions={warning.dimensions} confidence={warning.confidence} />
            </div>
          </div>

          {/* Visual Blast-Radius Exposure Graph */}
          <ExposureGraph
            cveId={warning.threat?.cve_ids?.[0] || 'CVE-2026-4421'}
            product={warning.asset?.product || 'nginx'}
            hostname={warning.asset?.hostname || warning.target_hostname || 'target-host'}
            isInternetFacing={warning.asset?.internet_facing ?? true}
            score={warning.risk_score}
          />

          {/* Rules Fired & Brief Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Fired Deterministic Rules
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {warning.rules_fired.map((r, i) => (
                  <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {warning.brief_summary}
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Evidence Citations ([REF-1])
              </h4>
              <div className="space-y-2">
                {warning.evidence.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-mono font-bold text-emerald-400">{ev.citation_key}</span>{' '}
                    <span className="text-slate-300">{ev.citation_text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remediation Playbook */}
          {warning.playbook && (
            <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">
                Remediation Playbook: <span className="text-white">{warning.playbook.title}</span> (v{warning.playbook.version})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {warning.playbook.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900/60 text-xs text-slate-300 font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14-Status State Machine Stepper */}
          <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs uppercase font-bold text-slate-400">
                14-Status Lifecycle & Governance Loop
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Current: <strong className="text-cyan-400">{approvedState ? 'PATCH_SIMULATED' : warning.status}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1 text-[11px]">
              {statuses.map((st, idx) => {
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div
                    key={st}
                    className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap border transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-black font-bold border-cyan-400 scale-105'
                        : isPassed
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {st}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-3 pt-3 border-t border-slate-900">
              <button
                onClick={handleApproveClick}
                disabled={approving || approvedState}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                  approvedState
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-black'
                }`}
              >
                {approving ? 'Executing...' : approvedState ? '✓ Simulated Patch Applied (CLOSED READY)' : 'SecOps Lead: Approve Simulated Patch'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

