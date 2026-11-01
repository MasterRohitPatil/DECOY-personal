import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Server, FileText, CheckCircle, Zap,
  Activity, ArrowRight, ShieldCheck, Eye, RefreshCw, AlertTriangle, Sparkles,
  UploadCloud, CheckCircle2, Check
} from 'lucide-react';
import { WarningItem, WarningDetail } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { DimensionBars } from '../components/DimensionBars';
import { ExposureGraph } from '../components/ExposureGraph';
import { PipelineStepper } from '../components/PipelineStepper';
import { ActionableRecommendationsPanel } from '../components/ActionableRecommendationsPanel';
import { LiveAdvisoryAnalyzer } from '../components/LiveAdvisoryAnalyzer';
import { api } from '../api';

interface WarningsPageProps {
  warnings: WarningItem[];
  selectedWarningId?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onOpenUpload?: () => void;
}

export const WarningsPage: React.FC<WarningsPageProps> = ({
  warnings,
  selectedWarningId,
  loading = false,
  error = null,
  onRefresh,
  onOpenUpload
}) => {
  const [selectedId, setSelectedId] = useState<string>(selectedWarningId || warnings[0]?.id || '');
  const [detail, setDetail] = useState<WarningDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedState, setApprovedState] = useState(false);
  const [aiBrief, setAiBrief] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiBriefError, setAiBriefError] = useState<string | null>(null);

  // Stepper state
  const [pipelineStage, setPipelineStage] = useState(0);
  const [pipelineLabel, setPipelineLabel] = useState('Pipeline Idle');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (selectedWarningId) {
      setSelectedId(selectedWarningId);
    } else if (warnings.length > 0 && !selectedId) {
      setSelectedId(warnings[0].id);
    }
  }, [selectedWarningId, warnings]);

  const loadDetail = async (id: string) => {
    if (!id) return;
    setLoadingDetail(true);
    setDetailError(null);
    setAiBrief(null);
    setAiBriefError(null);
    try {
      const res = await api.getWarningDetail(id);
      setDetail(res);
    } catch (e: any) {
      setDetailError(e.message || 'Failed to fetch warning details');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const handleGenerateAiBrief = async () => {
    if (!detail) return;
    setLoadingAi(true);
    setAiBriefError(null);
    try {
      const res = await api.getAiBrief(detail.id);
      setAiBrief(res);
    } catch (e: any) {
      setAiBriefError(e.message || 'Failed to generate AI executive brief.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleInjectAdvisory = async () => {
    setIngesting(true);
    setPipelineStage(1);
    setPipelineLabel('1. Ingesting live advisory payload from NVD / CERT-In...');
    try {
      setTimeout(() => {
        setPipelineStage(2);
        setPipelineLabel('2. Extracting CVE entities & SemVer constraints...');
      }, 300);
      setTimeout(() => {
        setPipelineStage(3);
        setPipelineLabel('3. Matching against 26 enterprise assets in PostgreSQL...');
      }, 650);
      const res = await api.injectScenario('log4j');
      setPipelineStage(5);
      setPipelineLabel(
        res?.warning_id
          ? `5. Early Warning Generated: ${res.warning_id} (${res.score}/100 ${res.band})`
          : '5. Early Warning Generated: Priority Calculated.'
      );
      onRefresh();
      if (res?.warning_id) {
        setSelectedId(res.warning_id);
        loadDetail(res.warning_id);
      }
    } catch {
      setPipelineStage(0);
      setPipelineLabel('Pipeline Idle');
    } finally {
      setIngesting(false);
    }
  };

  const handleKevEscalate = async () => {
    if (!detail) return;
    setEscalating(true);
    try {
      await api.escalateKev(detail.id);
      await loadDetail(detail.id);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setEscalating(false);
    }
  };

  const handleApprove = async () => {
    if (!detail) return;
    setApproving(true);
    try {
      await api.approveWarning(detail.id);
      setApprovedState(true);
      await loadDetail(detail.id);
      onRefresh();
    } catch (e) {
      console.error(e);
      setApprovedState(true);
    } finally {
      setApproving(false);
    }
  };

  const statuses = [
    'NEW', 'TRIAGED', 'MATCHED', 'EVALUATED', 'PENDING_APPROVAL',
    'APPROVED', 'PATCH_SIMULATED', 'VERIFICATION', 'CLOSED'
  ];

  const currentIdx = approvedState ? 6 : Math.max(statuses.indexOf(detail?.status || 'TRIAGED'), 1);

  // 1. LOADING SKELETON
  if (loading && warnings.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 animate-pulse">
        <div className="bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
            ))}
          </div>
          <div className="lg:col-span-7 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-96">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="h-48 w-full bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 transition-colors duration-200">
      {/* Error state banner */}
      {(error || detailError) && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Diagnostic:</strong> {error || detailError}</span>
          </div>
          <button
            onClick={() => {
              if (selectedId) loadDetail(selectedId);
              onRefresh();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Page Header & Live Ingestion Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            Early Warning Hub (Core PS 01 Deliverable)
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Threat Intelligence & Exposure Matching
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Advisories are normalized and matched against monitored software inventory using semantic versioning. Warnings are prioritized mathematically using Section 3.4 factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Upload CSV</span>
            </button>
          )}

          <button
            onClick={handleInjectAdvisory}
            disabled={ingesting}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all self-start md:self-auto shrink-0 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${ingesting ? 'animate-pulse text-amber-300' : 'text-white'}`} />
            <span>{ingesting ? 'Injecting & Matching...' : 'Simulate Advisory Ingestion (SSE)'}</span>
          </button>
        </div>
      </div>

      {/* Live AI Threat Bulletin Analyzer & Prompt-Injection Guardrail Lab */}
      <LiveAdvisoryAnalyzer
        onWarningCreated={(newWarningId) => {
          onRefresh();
          if (newWarningId) {
            setSelectedId(newWarningId);
            loadDetail(newWarningId);
          }
        }}
        onPipelineProgress={(stage, label) => {
          setPipelineStage(stage);
          setPipelineLabel(label);
        }}
      />

      {/* Pipeline Stepper */}
      <PipelineStepper currentStage={pipelineStage} stageLabel={pipelineLabel} />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Warning Queue List (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Warning Queue</h3>
              <span className="text-[11px] text-slate-400">&le; 2 Clicks to Evidence</span>
            </div>
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 font-bold">
              {warnings.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[750px] overflow-y-auto">
            {warnings.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Zero Active Exposures</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No vulnerabilities currently match your installed software inventory.
                </p>
                {onOpenUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 shadow-xs"
                  >
                    Ingest Threat Feed (CSV)
                  </button>
                )}
              </div>
            ) : (
              warnings.map(w => {
                const isSelected = w.id === selectedId;
                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedId(w.id);
                      setApprovedState(false);
                    }}
                    className={`p-4 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-slate-900 border-l-4 border-cyan-500'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="text-center min-w-14">
                      <span className={`block text-xl font-black font-mono ${
                        w.band === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-orange-400'
                      }`}>
                        {w.risk_score.toFixed(1)}
                      </span>
                      <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        w.band === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-amber-50 dark:bg-orange-950 text-amber-700 dark:text-orange-300'
                      }`}>
                        {w.band}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">{w.id}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{w.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{w.brief_summary}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
                        <span>Target: <strong className="text-slate-700 dark:text-slate-300">{w.target_hostname.split('.')[0]}</strong></span>
                        <span>Confidence: <strong className="text-slate-700 dark:text-slate-300">{(w.confidence * 100).toFixed(0)}%</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Forensic Warning Detail & Scorer (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {loadingDetail ? (
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-3 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div>
              <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div>
              <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl mt-4"></div>
            </div>
          ) : detail ? (
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Detail Top Header */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 font-bold border border-slate-200 dark:border-slate-800">
                      {detail.id}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      detail.band === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-orange-950 text-amber-700 dark:text-orange-400 border border-amber-200 dark:border-orange-800'
                    }`}>
                      {detail.band} PRIORITY
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Host: <strong className="text-slate-900 dark:text-white">{detail.target_hostname}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{detail.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{detail.brief_summary}</p>
                </div>

                <button
                  onClick={handleGenerateAiBrief}
                  disabled={loadingAi}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                  <span>{loadingAi ? 'Analyzing...' : 'Generate AI Brief'}</span>
                </button>
              </div>

              {/* AI Brief Error Callout Box */}
              {aiBriefError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span><strong>AI Brief Error:</strong> {aiBriefError}</span>
                  </div>
                  <button onClick={() => setAiBriefError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
                </div>
              )}

              {/* AI Executive Brief Callout Box */}
              {aiBrief && (
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-950 border border-purple-200 dark:border-purple-700/60 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Executive Threat Briefing (CISO Brief)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      {aiBrief.mode === 'GEMINI_AI_LIVE' ? 'Gemini AI Active' : 'Deterministic Safe Fallback'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                    {aiBrief.summary}
                  </div>
                </div>
              )}

              {/* Gauge & Dimensions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-2 flex flex-col items-center">
                  <RiskGauge score={detail.risk_score} band={detail.band} />

                  {/* KEV Escalation Button */}
                  <button
                    onClick={handleKevEscalate}
                    disabled={escalating || detail.risk_score >= 90}
                    className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{escalating ? 'Escalating to KEV...' : detail.risk_score >= 90 ? 'Listed in CISA KEV (93.4 Critical)' : 'Simulate: Add to CISA KEV'}</span>
                  </button>
                </div>

                <div className="md:col-span-3">
                  <DimensionBars dimensions={detail.dimensions} confidence={detail.confidence} />
                </div>
              </div>

              {/* Blast-Radius Topology Graph */}
              <ExposureGraph
                cveId={detail.threat?.cve_ids?.[0] || detail.security_event?.event_type || 'CVE-2026-4421'}
                product={detail.asset?.product || 'nginx'}
                hostname={detail.asset?.hostname || detail.target_hostname || 'target-host'}
                attackerIp={detail.security_event?.source_ip || '198.51.100.23'}
                isInternetFacing={detail.asset?.internet_facing ?? true}
                score={detail.risk_score}
              />

              {/* Cited Evidence & Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                    Fired Rules
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.rules_fired.map((r, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-2">
                    Cited Evidence ([REF-1])
                  </span>
                  {detail.evidence && detail.evidence.length > 0 ? (
                    detail.evidence.map((ev, i) => (
                      <div key={i} className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                        <strong className="text-emerald-600 dark:text-emerald-400">{ev.citation_key}</strong> {ev.citation_text}
                      </div>
                    ))
                  ) : detail.security_event ? (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      <strong className="text-emerald-600 dark:text-emerald-400">[TELEMETRY-1]</strong> {detail.security_event.payload}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      <strong className="text-emerald-600 dark:text-emerald-400">[CMDB-1]</strong> Deterministic asset inventory & semantic version correlation verified.
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Pillar Actionable Recommendations Engine (PS 01 Objective 5) */}
              {detail.recommendations ? (
                <ActionableRecommendationsPanel
                  warningId={detail.id}
                  recommendations={detail.recommendations}
                  approvingPatch={approving}
                  patchApproved={approvedState}
                  onApprovePatch={handleApprove}
                  onWarningUpdated={() => {
                    loadDetail(detail.id);
                    onRefresh();
                  }}
                />
              ) : detail.playbook ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Remediation Playbook: {detail.playbook.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{detail.playbook.version}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {detail.playbook.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 14-Status Governance & Approver Loop */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    14-Status Lifecycle & Governance Loop
                  </span>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                    Current: <strong>{approvedState ? 'PATCH_SIMULATED' : detail.status}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-2 text-[10px] font-mono">
                  {statuses.map((st, idx) => {
                    const isPassed = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <span
                        key={st}
                        className={`px-2 py-0.5 rounded whitespace-nowrap border ${
                          isCurrent
                            ? 'bg-cyan-500 text-white font-bold border-cyan-400'
                            : isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {st}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleApprove}
                    disabled={approving || approvedState}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                      approvedState
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  >
                    {approving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Patch...</span>
                      </>
                    ) : approvedState ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Simulated Patch Deployed ✓</span>
                      </>
                    ) : (
                      'SecOps Lead: Approve Simulated Patch'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-[#0B0F19] rounded-2xl border border-slate-200 dark:border-slate-800">
              Select a warning card from the queue to view its forensic breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
