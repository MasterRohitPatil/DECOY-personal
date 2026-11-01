import React, { useState, useEffect } from 'react';
import {
  Wrench, ShieldBan, SearchCheck, Sparkles, Copy, Check,
  CheckCircle2, Clock, RefreshCw, Terminal, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { ActionableRecommendations, AiRecommendationsAdvice } from '../types';
import { api } from '../api';

interface ActionableRecommendationsPanelProps {
  warningId: string;
  recommendations: ActionableRecommendations;
  approvingPatch?: boolean;
  patchApproved?: boolean;
  onApprovePatch: () => void;
  onWarningUpdated: () => void;
}

export const ActionableRecommendationsPanel: React.FC<ActionableRecommendationsPanelProps> = ({
  warningId,
  recommendations,
  approvingPatch = false,
  patchApproved = false,
  onApprovePatch,
  onWarningUpdated,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [blockFeedback, setBlockFeedback] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>(
    recommendations.investigation.completed_steps || []
  );
  const [togglingStep, setTogglingStep] = useState<string | null>(null);

  const [aiAdvice, setAiAdvice] = useState<AiRecommendationsAdvice | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCompletedSteps(recommendations.investigation.completed_steps || []);
    setBlockFeedback(null);
    setAiAdvice(null);
    setActionError(null);
  }, [warningId, recommendations.investigation.completed_steps]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBlockIndicator = async () => {
    setBlocking(true);
    setActionError(null);
    try {
      const res = await api.blockWarningIndicator(warningId);
      setBlockFeedback(
        `Rule R7 Active: Priority reduced from ${res.old_score ?? recommendations.blocking.current_score} → ${res.new_score} (${res.new_band})`
      );
      onWarningUpdated();
    } catch (e: any) {
      setActionError(e.message || 'Failed to apply indicator containment block.');
    } finally {
      setBlocking(false);
    }
  };

  const handleToggleStep = async (stepId: string, stepTitle: string) => {
    const nextState = !completedSteps.includes(stepId);
    setTogglingStep(stepId);
    setActionError(null);
    // Optimistic update for snappy UX
    setCompletedSteps(prev =>
      nextState ? [...prev, stepId] : prev.filter(id => id !== stepId)
    );
    try {
      const res = await api.toggleInvestigationStep(warningId, stepId, stepTitle, nextState);
      setCompletedSteps(res.completed_steps);
    } catch (e: any) {
      // Revert if request failed
      setCompletedSteps(recommendations.investigation.completed_steps || []);
      setActionError(e.message || 'Could not record investigation step in audit log.');
    } finally {
      setTogglingStep(null);
    }
  };

  const handleFetchAiGuidance = async () => {
    setLoadingAi(true);
    setActionError(null);
    try {
      const res = await api.getAiRecommendations(warningId);
      setAiAdvice(res);
    } catch (e: any) {
      setActionError(e.message || 'Failed to load AI tactical guidance.');
    } finally {
      setLoadingAi(false);
    }
  };

  const isPatchDone = patchApproved || recommendations.patching.completed;
  const isBlockDone = Boolean(blockFeedback) || recommendations.blocking.completed;
  const totalInvSteps = recommendations.investigation.steps.length;
  const isInvDone = totalInvSteps > 0 && completedSteps.length >= totalInvSteps;
  const pillarsCompleted = [isPatchDone, isBlockDone, isInvDone].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 min-w-0 w-full transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Actionable Recommendations
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold">
              {pillarsCompleted}/3 Response Pillars Completed
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
            Suggested Mitigation & Incident Response Workflow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Tailored measures to <strong>patch vulnerable software</strong>, <strong>block malicious indicators</strong>, and <strong>investigate suspicious activity</strong>—every action is logged to the cryptographic audit ledger.
          </p>
        </div>

        <button
          onClick={handleFetchAiGuidance}
          disabled={loadingAi}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-all disabled:opacity-50 self-start"
        >
          <Sparkles className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
          <span>{loadingAi ? 'Consulting Gemini...' : aiAdvice ? 'Refresh AI Action Plan' : 'AI Step-by-Step Guide'}</span>
        </button>
      </div>

      {/* Diagnostic error if any */}
      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 font-bold shrink-0">✕</button>
        </div>
      )}

      {/* Optional Gemini AI Step-by-Step Tactical Execution Box */}
      {aiAdvice && (
        <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Recommended Execution Sequence (Safe Production Order)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
              {aiAdvice.mode === 'GEMINI_AI_LIVE' ? 'Gemini AI Live' : 'Deterministic Safe Advisor'}
            </span>
          </div>
          <div className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
            {aiAdvice.guidance}
          </div>
        </div>
      )}

      {/* PILLAR 1: PATCHING VULNERABLE SYSTEMS */}
      <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
        isPatchDone
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70'
          : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                1. Patch Vulnerable System
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {recommendations.patching.headline}
              </h4>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <Clock className="w-3 h-3" />
            {recommendations.patching.sla_window}
          </span>
        </div>

        {/* Version Comparison Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Installed Now:</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400 truncate">
              {recommendations.patching.product} {recommendations.patching.current_version}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Safe Target:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate" title={recommendations.patching.target_safe_version}>
              {recommendations.patching.target_safe_version}
            </span>
          </div>
        </div>

        {/* Zero-downtime hotfix note */}
        <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <strong className="text-blue-700 dark:text-blue-400">Zero-Downtime Hotfix (Before Reboot): </strong>
          {recommendations.patching.zero_downtime_hotfix}
        </div>

        {/* CLI Upgrade Command + Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 bg-slate-900 dark:bg-black text-slate-100 px-3 py-2 rounded-lg border border-slate-700 font-mono text-[11px]">
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">{recommendations.patching.cli_command}</span>
            </div>
            <button
              onClick={() => handleCopy('patch_cmd', recommendations.patching.cli_command)}
              className="text-slate-300 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800"
              title="Copy upgrade command"
            >
              {copiedKey === 'patch_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onApprovePatch}
            disabled={approvingPatch || isPatchDone}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs ${
              isPatchDone
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {approvingPatch ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deploying Patch...</span>
              </>
            ) : isPatchDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Patch Approved ✓</span>
              </>
            ) : (
              <span>Approve & Simulate Patch</span>
            )}
          </button>
        </div>
      </div>

      {/* PILLAR 2: BLOCKING KNOWN MALICIOUS INDICATORS */}
      <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
        isBlockDone
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70'
          : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0">
              <ShieldBan className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                2. Block Known Malicious Indicators
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {recommendations.blocking.headline}
              </h4>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold shrink-0 self-start sm:self-auto">
            {isBlockDone
              ? 'Rule R7 Active (-20% Risk Applied)'
              : `Rule R7 Impact: ${recommendations.blocking.current_score} → ${recommendations.blocking.projected_score_after_block}`}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {recommendations.blocking.indicator_type}:
          </span>
          <span className="font-mono font-bold text-red-600 dark:text-red-400 break-all">
            {recommendations.blocking.indicator_value}
          </span>
        </div>

        {blockFeedback && (
          <div className="p-2.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{blockFeedback}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 bg-slate-900 dark:bg-black text-slate-100 px-3 py-2 rounded-lg border border-slate-700 font-mono text-[11px]">
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
              <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">{recommendations.blocking.firewall_command}</span>
            </div>
            <button
              onClick={() => handleCopy('block_cmd', recommendations.blocking.firewall_command)}
              className="text-slate-300 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800"
              title="Copy firewall block rule"
            >
              {copiedKey === 'block_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={handleBlockIndicator}
            disabled={blocking || isBlockDone}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs ${
              isBlockDone
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {blocking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Blocking...</span>
              </>
            ) : isBlockDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Indicator Blocked ✓</span>
              </>
            ) : (
              <span>Block Indicator Now</span>
            )}
          </button>
        </div>
      </div>

      {/* PILLAR 3: INVESTIGATING SUSPICIOUS ACTIVITY */}
      <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
        isInvDone
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70'
          : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <SearchCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                3. Investigate Suspicious Activity
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {recommendations.investigation.headline}
              </h4>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold shrink-0 self-start sm:self-auto">
            {completedSteps.length}/{totalInvSteps} Forensic Checks Verified
          </span>
        </div>

        <div className="space-y-2">
          {recommendations.investigation.steps.map((step, index) => {
            const checked = completedSteps.includes(step.id);
            const busy = togglingStep === step.id;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all ${
                  checked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleStep(step.id, step.title)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-600 hover:border-purple-500'
                    }`}
                    title={checked ? 'Mark check as incomplete' : 'Mark forensic check verified (logs to Audit Trail)'}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        onClick={() => handleToggleStep(step.id, step.title)}
                        className={`text-xs font-bold cursor-pointer select-none ${
                          checked
                            ? 'line-through text-emerald-800 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        Step {index + 1}: {step.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {step.why_it_matters}
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 dark:bg-black text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 font-mono text-[10px]">
                      <span className="overflow-x-auto whitespace-nowrap">{step.command}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(step.id, step.command)}
                        className="text-slate-400 hover:text-white shrink-0"
                        title="Copy investigation command"
                      >
                        {copiedKey === step.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

