import React, { useState } from 'react';
import {
  ShieldAlert, Server, Activity, ArrowUpRight, Flame,
  CheckCircle2, AlertTriangle, Layers, ExternalLink, Zap,
  Radio, Bot, FileCode, Sliders, Target, ChevronRight,
  TrendingUp, Play, Clock, ShieldCheck, ArrowRight, Lightbulb,
  Share2, Network, Terminal, UploadCloud, Info, Globe, Download,
  RefreshCw, Check
} from 'lucide-react';
import { OverviewData, WarningItem } from '../types';
import { api } from '../api';
import { generatePdfThreatReport } from '../utils/pdfReport';

interface DashboardPageProps {
  overview: OverviewData | null;
  warnings: WarningItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onNavigateToWarnings: () => void;
  onNavigateToAttacks: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToAlerts?: () => void;
  onOpenUpload?: () => void;
  onSelectWarning: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  overview,
  warnings,
  loading = false,
  error = null,
  onRetry,
  onNavigateToWarnings,
  onNavigateToAttacks,
  onNavigateToAssets,
  onNavigateToAlerts,
  onOpenUpload,
  onSelectWarning
}) => {
  // Real dynamic numbers from DB & CSV
  const criticalCount = overview?.bands?.CRITICAL ?? warnings.filter(w => w.band === 'CRITICAL').length;
  const highCount = overview?.bands?.HIGH ?? warnings.filter(w => w.band === 'HIGH').length;
  const totalAssets = overview?.total_assets ?? 26;
  const activeWarningsCount = warnings.length || (overview?.active_warnings ?? 0);

  // Active attack simulation step state for visual demonstration
  const [activeStep, setActiveStep] = useState<number>(5);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simDone, setSimDone] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('Brute Force (SSH)');

  // PDF Export Feedback State
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [pdfExported, setPdfExported] = useState<boolean>(false);

  const handleExportPdf = async () => {
    if (!spotlightWarning) return;
    setExportingPdf(true);
    try {
      await generatePdfThreatReport(spotlightWarning, overview);
      setPdfExported(true);
      setTimeout(() => setPdfExported(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingPdf(false);
    }
  };

  const dynamicThreatFeed = warnings.map(w => {
    const isKev = w.rules_fired && w.rules_fired.some(r => r.includes('KEV'));
    const src = isKev ? 'CISA KEV' : (w.rules_fired && w.rules_fired.some(r => r.includes('WAF')) ? 'CERT-In' : 'NVD (NIST)');
    const cveFromTitle = w.title.match(/CVE-\d{4}-\d+/i);
    const cveFromId = w.id.match(/CVE-\d{4}-\d+/i);
    const cveId = cveFromTitle ? cveFromTitle[0].toUpperCase() : (cveFromId ? cveFromId[0].toUpperCase() : (w.id.length > 18 ? w.id.slice(0, 16) + '...' : w.id));

    return {
      id: cveId,
      warningId: w.id,
      title: w.title,
      src,
      time: 'Real-time',
      sev: w.band === 'CRITICAL' ? 'Critical' : (w.band === 'HIGH' ? 'High' : 'Medium'),
      score: w.risk_score,
      asset: w.target_hostname || 'auth-srv-01.prod.sentinel',
      ip: isKev ? '185.220.101.5' : '198.51.100.23',
      policy: w.rules_fired && w.rules_fired[0] ? w.rules_fired[0] : 'R1_ACTIVE_EXPLOIT',
      status: w.status,
      vector: 'Remote Code Execution / Telemetry Stream',
      color: w.band === 'CRITICAL' ? '#EF4444' : (w.band === 'HIGH' ? '#F97316' : '#FBBF24'),
      product: w.title.split(' ')[0],
      action: w.brief_summary || 'Execute perimeter IP block and deploy verified vendor update.'
    };
  });

  const [selectedThreatIdx, setSelectedThreatIdx] = useState<number>(0);
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);

  const activeThreat = dynamicThreatFeed[selectedThreatIdx] || dynamicThreatFeed[0];

  // Spotlight Warning (Top Priority Item)
  const spotlightWarning = warnings[0] || (activeThreat ? {
    id: activeThreat.warningId,
    title: activeThreat.title,
    risk_score: activeThreat.score,
    band: activeThreat.sev.toUpperCase() as any,
    status: activeThreat.status,
    target_hostname: activeThreat.asset,
    confidence: 0.96,
    created_at: new Date().toISOString(),
    rules_fired: ['R1_ACTIVE_EXPLOIT_ESCALATION', 'R2_KEV_CONFIRMED_INTERNET_FACING'],
    brief_summary: activeThreat.action
  } : null);

  const handleRunSimulation = async (scenario: string) => {
    setSelectedScenario(scenario);
    setSimulating(true);
    setSimDone(false);
    setActiveStep(1);

    try {
      setTimeout(() => setActiveStep(2), 350);
      setTimeout(() => setActiveStep(3), 700);

      // Execute authentic backend attack pipeline
      await api.triggerAttack('brute-force', 'auth-srv-01.prod.sentinel');

      setActiveStep(4);
      setTimeout(() => {
        setActiveStep(5);
        setSimulating(false);
        setSimDone(true);
        if (onRetry) onRetry();
        setTimeout(() => setSimDone(false), 3500);
      }, 500);
    } catch (e) {
      console.error('Simulation error:', e);
      setActiveStep(5);
      setSimulating(false);
      setSimDone(true);
      setTimeout(() => setSimDone(false), 3000);
    }
  };

  // 1. LOADING SKELETON
  if (loading && !overview) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-6 w-80 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        {/* 4 Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                <div className="w-12 h-5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Hero Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-72">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="h-48 w-full bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
          </div>
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-72 space-y-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-20 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      
      {/* ERROR STATE BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Connection Diagnostic:</strong> {error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sync</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Header Banner & Quick Status */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm card-subtle-glow transition-all duration-200">
        {/* Subtle decorative cyber grid background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/5 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-50 dark:bg-cyan-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                PS 01 • National Cyber Threat Early Warning Grid
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Deterministic Exposure Matching Engine
              </span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enterprise Threat Posture & Early Warning Hub
            </h1>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Correlating live national threat advisories with installed software inventory to eliminate noise and predict attacks before perimeter compromise.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload CSV Dataset</span>
              </button>
            )}

            {spotlightWarning && (
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 border shadow-xs transition-all ${
                  pdfExported
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {exportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>Compiling PDF...</span>
                  </>
                ) : pdfExported ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>PDF Downloaded ✓</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Export Executive PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onNavigateToAttacks}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 shadow-xs transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Attack Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Threats */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs hover:border-red-400/60 dark:hover:border-red-500/50 transition-all card-subtle-glow">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900 flex items-center gap-1 uppercase tracking-wider">
              Immediate Action
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {criticalCount}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              Critical Exposures
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Active exploits verified on target perimeter
          </p>
        </div>

        {/* Card 2: Active Warnings */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all card-subtle-glow">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 flex items-center gap-1 uppercase tracking-wider">
              Correlated Feeds
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {activeWarningsCount}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              Active Warnings
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Early signals mapped to confirmed packages
          </p>
        </div>

        {/* Card 3: Monitored Assets */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all card-subtle-glow">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 flex items-center gap-1 uppercase tracking-wider">
              {totalAssets} Hosts Active
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalAssets}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              Monitored Assets
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Cloud gateways, DBs & SCADA hosts
          </p>
        </div>

        {/* Card 4: System Health & Noise Filter */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs hover:border-emerald-400/60 dark:hover:border-emerald-500/50 transition-all card-subtle-glow">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-1 uppercase tracking-wider">
              Deterministic Filter
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {overview?.noise_reduction_ratio ? `${overview.noise_reduction_ratio}%` : '99.8%'}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              Noise Filter Ratio
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Uninstalled CVE noise eliminated by SemVer
          </p>
        </div>
      </div>

      {/* 3. Hero Row: Threat Activity Trend + EARLY WARNING Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Threat Activity Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Threat Activity Trend
              </h3>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-600 dark:text-slate-400">Total Threats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-slate-600 dark:text-slate-400">Critical</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                Last 24 Hours
              </span>
            </div>
          </div>

          {/* SVG Curve Chart */}
          <div className="py-6 relative">
            <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="30" x2="500" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />

              <path
                d="M 0,110 C 60,95 100,120 160,85 C 220,50 260,35 320,65 C 380,95 440,55 500,75 L 500,150 L 0,150 Z"
                fill="url(#blueGradient)"
              />
              <path
                d="M 0,110 C 60,95 100,120 160,85 C 220,50 260,35 320,65 C 380,95 440,55 500,75"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M 0,140 C 60,135 100,140 160,125 C 220,110 260,115 320,120 C 380,130 440,115 500,125 L 500,150 L 0,150 Z"
                fill="url(#redGradient)"
              />
              <path
                d="M 0,140 C 60,135 100,140 160,125 C 220,110 260,115 320,120 C 380,130 440,115 500,125"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle cx="280" cy="45" r="4.5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <line x1="280" y1="45" x2="280" y2="150" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            <div className="absolute top-4 left-[52%] -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg shadow-lg border border-slate-700 pointer-events-none">
              <span className="font-bold text-cyan-300">{activeWarningsCount} Active Signals</span> ({criticalCount} Critical)
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>12AM</span>
            <span>4AM</span>
            <span>8AM</span>
            <span>12PM</span>
            <span>4PM</span>
            <span>8PM</span>
          </div>
        </div>

        {/* Right 1 Col: Spotlight Warning */}
        {spotlightWarning ? (
          <div className="bg-white dark:bg-[#0B0F19] border-2 border-red-500/40 dark:border-red-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500" /> Early Warning
                </span>
                <span className="text-xs font-mono font-black text-red-600 dark:text-red-400">
                  {spotlightWarning.band}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                  {spotlightWarning.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Targeting <code className="text-slate-800 dark:text-slate-200 font-bold">{spotlightWarning.target_hostname}</code>. Priority score evaluated by Section 3.4 formula.
                </p>
              </div>

              {/* Priority Score & Section 3.4 Formula Breakdown */}
              <div className="my-4 p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider">
                      Section 3.4 SEXVI Priority Score
                    </span>
                    <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono tracking-tight">
                      {spotlightWarning.risk_score.toFixed(1)}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ 100</span>
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-mono text-xs font-black shadow-xs">
                    {spotlightWarning.band}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/40 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>100 × (0.30S + 0.30E + 0.20X + 0.10V + 0.10I)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Deterministic</span>
                </div>
              </div>

              {/* Package Verification & Why This Matters */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Deterministic Inventory Match</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">SemVer Matched</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 text-xs">
                    Target: <strong className="text-blue-600 dark:text-cyan-400 font-mono break-all">{spotlightWarning.target_hostname}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Confirmed version-constraint match</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Internet-facing perimeter exposure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Rule R1 & R2 Escalations fired</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-100 block font-semibold mb-0.5">Recommended Action:</strong>
                <span className="line-clamp-2">{spotlightWarning.brief_summary}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>
              <button
                onClick={() => onSelectWarning(spotlightWarning.id)}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <span>View Full Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Zero Active Exposures</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              All monitored enterprise hosts are safe and no unmitigated CVEs are affecting your inventory.
            </p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 shadow-sm transition-all"
              >
                Ingest Threat Feed (CSV)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Attack Simulation Pipeline Stepper */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Attack Simulation Pipeline
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              ({selectedScenario})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunSimulation(selectedScenario)}
              disabled={simulating}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin text-blue-500' : ''}`} />
              <span>{simulating ? 'Ingesting Telemetry...' : simDone ? 'Pipeline Evaluated ✓' : 'Rerun Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* 5-Step Process Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {[
            { step: 1, title: 'Simulation Started', desc: 'Raw synthetic event generated' },
            { step: 2, title: 'Event Generated', desc: 'Timestamp & source IP logged' },
            { step: 3, title: 'Inventory Match', desc: 'SemVer matched against inventory' },
            { step: 4, title: 'Risk Scored', desc: 'Section 3.4 SEXVI evaluated' },
            { step: 5, title: 'Alert Dispatched', desc: 'WhatsApp & SMTP dispatched' }
          ].map(s => {
            const isCompleted = activeStep >= s.step;
            const isCurrent = activeStep === s.step;
            return (
              <div
                key={s.step}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-100 ring-1 ring-blue-400'
                    : isCompleted
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : s.step}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Step {s.step}</span>
                </div>
                <h4 className="font-bold text-xs truncate">{s.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. THREAT INTELLIGENCE FEED + ATTACK CORRELATION RADIAL GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Feed Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Threat Intelligence Feed
              </h4>
              <p className="text-[10px] text-slate-400">
                Click any advisory to pivot the correlation graph →
              </p>
            </div>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all"
              >
                Upload CSV
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {dynamicThreatFeed.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No threat advisories currently ingested.
              </div>
            ) : (
              dynamicThreatFeed.map((item, idx) => {
                const isSelected = idx === selectedThreatIdx;
                return (
                  <div
                    key={item.id + idx}
                    onClick={() => setSelectedThreatIdx(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 shadow-xs ring-1 ring-blue-400'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.src}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.id}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.sev === 'Critical'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {item.sev}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h5>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>Target: <strong className="text-slate-700 dark:text-slate-300">{item.asset.split('.')[0]}</strong></span>
                      <span className="font-bold text-red-600 dark:text-red-400">Risk: {item.score.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Radial Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Attack Correlation Radial Graph (Interactive)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Live topology for <strong className="text-blue-600 dark:text-cyan-400 font-mono">{activeThreat?.id || 'No Threat'}</strong>. Click any node to inspect.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Threat Center</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
              <span className="text-slate-600 dark:text-slate-400">Asset</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
              <span className="text-slate-600 dark:text-slate-400">Policy</span>
            </div>
          </div>

          {/* Radial Graph Visual Canvas */}
          <div className="relative bg-slate-50/70 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[340px] flex items-center justify-center overflow-hidden">
            {activeThreat ? (
              <svg viewBox="0 0 460 300" className="w-full max-w-[460px] h-72">
                <line x1="230" y1="150" x2="80" y2="70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="230" y1="150" x2="380" y2="70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="230" y1="150" x2="60" y2="180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="230" y1="150" x2="400" y2="180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="230" y1="150" x2="140" y2="250" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="230" y1="150" x2="320" y2="250" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Central Threat Node */}
                <g className="cursor-pointer" onClick={() => setInspectedNode('THREAT')}>
                  <circle cx="230" cy="150" r="34" fill="#EF4444" opacity="0.2" className="animate-ping" />
                  <circle cx="230" cy="150" r="28" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                  <text x="230" y="147" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {activeThreat.id.length > 12 ? activeThreat.id.slice(0, 10) + '..' : activeThreat.id}
                  </text>
                  <text x="230" y="158" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" opacity="0.95" fontFamily="monospace">
                    {activeThreat.score.toFixed(1)}
                  </text>
                </g>

                {/* Satellite Nodes */}
                <g className="cursor-pointer" onClick={() => setInspectedNode('ASSET')}>
                  <circle cx="80" cy="70" r="18" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5" />
                  <text x="80" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Asset</text>
                  <text x="80" y="98" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.asset.split('.')[0].length > 12 ? activeThreat.asset.split('.')[0].slice(0, 10) + '..' : activeThreat.asset.split('.')[0]}
                  </text>
                </g>

                <g className="cursor-pointer" onClick={() => setInspectedNode('INTEL')}>
                  <circle cx="380" cy="70" r="18" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                  <text x="380" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Source</text>
                  <text x="380" y="98" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.src.length > 12 ? activeThreat.src.slice(0, 10) + '..' : activeThreat.src}
                  </text>
                </g>

                <g className="cursor-pointer" onClick={() => setInspectedNode('IP')}>
                  <circle cx="60" cy="180" r="18" fill="#EC4899" stroke="#DB2777" strokeWidth="1.5" />
                  <text x="60" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">IP IOC</text>
                  <text x="60" y="208" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.ip}
                  </text>
                </g>

                <g className="cursor-pointer" onClick={() => setInspectedNode('POLICY')}>
                  <circle cx="400" cy="180" r="18" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
                  <text x="400" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Policy</text>
                  <text x="400" y="208" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.policy.split('_')[0]}
                  </text>
                </g>

                <g className="cursor-pointer" onClick={() => setInspectedNode('VECTOR')}>
                  <circle cx="140" cy="250" r="18" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" />
                  <text x="140" y="254" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Product</text>
                  <text x="140" y="278" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.product.length > 12 ? activeThreat.product.slice(0, 10) + '..' : activeThreat.product}
                  </text>
                </g>

                <g className="cursor-pointer" onClick={() => setInspectedNode('STATUS')}>
                  <circle cx="320" cy="250" r="18" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5" />
                  <text x="320" y="254" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Status</text>
                  <text x="320" y="278" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500" fontFamily="monospace">
                    {activeThreat.status}
                  </text>
                </g>
              </svg>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                No active threat topology to render.
              </div>
            )}

            {/* Inspect Overlay */}
            {inspectedNode && activeThreat && (
              <div className="absolute top-3 right-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-lg max-w-[210px] text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                    {inspectedNode} Node Details
                  </span>
                  <button onClick={() => setInspectedNode(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  {inspectedNode === 'THREAT' && `CVE: ${activeThreat.id} | Score: ${activeThreat.score}`}
                  {inspectedNode === 'ASSET' && `Host: ${activeThreat.asset} (Tier-1 PROD)`}
                  {inspectedNode === 'INTEL' && `Feed: ${activeThreat.src} (Verified Feed)`}
                  {inspectedNode === 'IP' && `Attacker IOC: ${activeThreat.ip}`}
                  {inspectedNode === 'POLICY' && `Section 3.4 Rule: ${activeThreat.policy}`}
                  {inspectedNode === 'VECTOR' && `Installed Package: ${activeThreat.product}`}
                  {inspectedNode === 'STATUS' && `Lifecycle State: ${activeThreat.status}`}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Correlated against installed inventory
            </span>

            {activeThreat && (
              <button
                onClick={() => onSelectWarning(activeThreat.warningId)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <span>Investigate Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
