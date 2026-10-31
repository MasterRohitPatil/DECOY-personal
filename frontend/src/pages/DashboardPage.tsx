import React, { useState } from 'react';
import {
  ShieldAlert, Server, Activity, ArrowUpRight, Flame,
  CheckCircle2, AlertTriangle, Layers, ExternalLink, Zap,
  Radio, Bot, FileCode, Sliders, Target, ChevronRight,
  TrendingUp, Play, Clock, ShieldCheck, ArrowRight, Lightbulb,
  Share2, Network, Terminal, UploadCloud, Info, Globe, Download
} from 'lucide-react';
import { OverviewData, WarningItem } from '../types';
import { generatePdfThreatReport } from '../utils/pdfReport';

interface DashboardPageProps {
  overview: OverviewData | null;
  warnings: WarningItem[];
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
  const [activeStep, setActiveStep] = useState<number>(3); // 1 to 5
  const [simulating, setSimulating] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('Brute Force (SSH)');

  // Dynamic threat feed derived directly from ingested warnings
  const fallbackThreatFeed = [
    {
      id: 'CVE-2024-3094',
      warningId: 'W-2026-001',
      title: 'XZ Utils Upstream Backdoor RCE',
      src: 'CISA KEV',
      time: '1 min ago',
      sev: 'Critical',
      score: 98.2,
      asset: 'auth-srv-01.prod',
      ip: '185.220.101.5',
      policy: 'R2_KEV_ESCALATION',
      status: 'CONFIRMED_EXPOSED',
      vector: 'SSH Port 22 Handshake',
      color: '#EF4444',
      product: 'xz-utils 5.6.0',
      action: 'Downgrade to xz 5.4.6 or apply upstream patch immediately.'
    },
    {
      id: 'CVE-2024-11878',
      warningId: 'W-2026-002',
      title: 'WinRAR Shell Memory Corruption',
      src: 'CISA KEV',
      time: '3 mins ago',
      sev: 'Critical',
      score: 93.4,
      asset: 'workstation-dev-12',
      ip: '198.51.100.23',
      policy: 'R2_ACTIVE_EXPLOIT',
      status: 'CONFIRMED_EXPOSED',
      vector: 'Malicious .rar Processing',
      color: '#EF4444',
      product: 'winrar 6.20',
      action: 'Deploy WinRAR 6.23 update across all Windows workstations.'
    },
    {
      id: 'CVE-2024-28995',
      warningId: 'W-2026-003',
      title: 'SolarWinds Serv-U Path Traversal',
      src: 'NVD (NIST)',
      time: '6 mins ago',
      sev: 'High',
      score: 82.0,
      asset: 'storage-srv-02.prod',
      ip: '203.0.113.45',
      policy: 'R3_HIGH_EXPOSURE',
      status: 'CONFIRMED_EXPOSED',
      vector: 'HTTP Directory Traversal',
      color: '#F97316',
      product: 'serv-u 15.3.0',
      action: 'Block relative path traversal regex & patch Serv-U to 15.4.2.'
    },
    {
      id: 'CVE-2023-44487',
      warningId: 'W-2026-004',
      title: 'HTTP/2 Rapid Reset DDoS Flood',
      src: 'CERT-In',
      time: '10 mins ago',
      sev: 'High',
      score: 78.5,
      asset: 'edge-proxy-01.prod',
      ip: '45.33.32.156',
      policy: 'R7_WAF_BLOCK',
      status: 'MITIGATED',
      vector: 'TCP Stream Reset Flood',
      color: '#F97316',
      product: 'nginx 1.24.0',
      action: 'Enforce keepalive_timeout and limit_req HTTP/2 frame limits.'
    }
  ];

  const dynamicThreatFeed = warnings.length > 0 ? warnings.map(w => {
    const isKev = w.rules_fired && w.rules_fired.some(r => r.includes('KEV'));
    const src = isKev ? 'CISA KEV' : (w.rules_fired && w.rules_fired.some(r => r.includes('WAF')) ? 'CERT-In' : 'NVD (NIST)');
    const cveMatch = w.title.match(/CVE-\d{4}-\d+/i);
    const cveId = cveMatch ? cveMatch[0].toUpperCase() : (w.id.startsWith('W-') ? w.id : `CVE-2024-${w.id.slice(-4)}`);
    
    return {
      id: cveId,
      warningId: w.id,
      title: w.title,
      src,
      time: 'Just now',
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
  }) : fallbackThreatFeed;

  const [selectedThreatIdx, setSelectedThreatIdx] = useState<number>(0);
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);

  const activeThreat = dynamicThreatFeed[selectedThreatIdx] || dynamicThreatFeed[0];

  // Spotlight Warning (Top Priority Item)
  const spotlightWarning = warnings[0] || {
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
  };

  const handleRunSimulation = (scenario: string) => {
    setSelectedScenario(scenario);
    setSimulating(true);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 700);
    setTimeout(() => setActiveStep(3), 1400);
    setTimeout(() => setActiveStep(4), 2100);
    setTimeout(() => {
      setActiveStep(5);
      setSimulating(false);
    }, 2800);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      
      {/* 1. Header Banner & Quick Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
              AI-Powered Cyber Threat Early Warning System
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
            Enterprise Threat Posture & Early Warning Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Correlating live national threat advisories with installed software inventory to eliminate noise and predict attacks before impact.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 shadow-xs transition-all"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Upload CSV Dataset</span>
            </button>
          )}

          <button
            onClick={() => generatePdfThreatReport(spotlightWarning, overview)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Executive PDF</span>
          </button>

          <button
            onClick={onNavigateToAttacks}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Attack Lab & Kill Chain</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (Clean, High-Contrast & Dynamic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Threats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-red-400/60 dark:hover:border-red-500/50 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +20%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {criticalCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
              Critical Threats
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Weaponized exploits targeting active hosts
          </p>
        </div>

        {/* Card 2: Active Warnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {activeWarningsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
              Active Warnings
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Early signals mapped to confirmed packages
          </p>
        </div>

        {/* Card 3: Monitored Assets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +5%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalAssets}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
              Monitored Assets
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Cloud gateways, DBs & SCADA hosts
          </p>
        </div>

        {/* Card 4: System Health & Noise Filter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-400/60 dark:hover:border-emerald-500/50 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +0.1%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              99.7%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
              System Health (Zero Noise)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Uninstalled CVE noise eliminated
          </p>
        </div>
      </div>

      {/* 3. Hero Row: Threat Activity Trend + EARLY WARNING Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Threat Activity Trend (24h Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
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

          {/* Smooth Interactive SVG Curve Area Chart */}
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

              {/* Background grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />

              {/* Total Threats Area & Line (Blue) */}
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

              {/* Critical Threats Area & Line (Red) */}
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

              {/* Highlight Peak Marker */}
              <circle cx="280" cy="45" r="4.5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <line x1="280" y1="45" x2="280" y2="150" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2 2" />
            </svg>

            {/* Interactive Tooltip Badge */}
            <div className="absolute top-4 left-[52%] -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg shadow-lg border border-slate-700 pointer-events-none">
              <span className="font-bold text-cyan-300">{activeWarningsCount} Active Signals</span> ({criticalCount} Critical)
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2 px-1">
              <span>12AM</span>
              <span>4AM</span>
              <span>8AM</span>
              <span>12PM</span>
              <span>4PM</span>
              <span>8PM</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: EARLY WARNING Spotlight Card (Exact Match to Reference Image 1) */}
        <div className="bg-gradient-to-br from-red-50/60 via-white to-white dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>EARLY WARNING</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                {spotlightWarning.band}
              </span>
            </div>

            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
              {spotlightWarning.title}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Targeting <code className="text-red-600 dark:text-red-400 font-mono font-bold">{spotlightWarning.target_hostname}</code>. Priority score evaluated by Section 3.4 formula.
            </p>

            {/* Circular Risk Score Gauge + Why this matters */}
            <div className="mt-4 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-red-100 dark:border-slate-800">
              {/* Radial Score Gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.5"
                    className="dark:stroke-slate-800"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    strokeDasharray={`${spotlightWarning.risk_score.toFixed(1)}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white block leading-none font-mono">
                    {spotlightWarning.risk_score.toFixed(1)}
                  </span>
                  <span className="text-[8px] font-bold text-red-600 dark:text-red-400 uppercase">
                    Risk
                  </span>
                </div>
              </div>

              {/* Bullet points: Why this matters? */}
              <div className="text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                  Why this matters?
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span>Confirmed version-constraint match</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span>Internet-facing perimeter exposure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span>Rule R1 & R2 Escalations fired</span>
                </div>
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Recommended Action:</span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                {spotlightWarning.brief_summary || 'Deploy immediate perimeter IP block and upgrade upstream package to verified patched revision.'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => generatePdfThreatReport(spotlightWarning, overview)}
              className="py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>

            <button
              onClick={() => onSelectWarning(spotlightWarning.id)}
              className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>View Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Attack Simulation Stepper + AI Threat Summary Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Attack Simulation Pipeline
            </h3>
            <span className="text-xs text-slate-400">({selectedScenario})</span>
          </div>

          <div className="flex items-center gap-2">
            {simulating && (
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800 animate-pulse">
                Running Simulation...
              </span>
            )}
            <button
              onClick={() => handleRunSimulation('SSH Brute Force')}
              disabled={simulating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              <span>Rerun Pipeline</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          {/* Stepper (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                ></div>
              </div>

              {[
                { step: 1, label: 'Simulation Started' },
                { step: 2, label: 'Event Generated' },
                { step: 3, label: 'AI Analysis' },
                { step: 4, label: 'Risk Scored' },
                { step: 5, label: 'Alert Dispatched' }
              ].map(item => (
                <div key={item.step} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      activeStep >= item.step
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {activeStep > item.step ? '✓' : item.step}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium text-center max-w-[70px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>
                <strong>Pipeline Telemetry:</strong> Ingested 18 authentication events on auth-srv-01 &rarr; correlated with CVE-2024-3094.
              </span>
            </div>
          </div>

          {/* AI Threat Summary Box (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>AI Threat Assessment Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Confidence: 96%
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">
              Coordinated authentication brute force attack detected targeting public gateway. Matches known scanner behavior; automated isolation rule staged.
            </p>

            <div className="mt-3 pt-2 border-t border-blue-200/50 dark:border-blue-900/50 flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span>S: 0.95 | E: 1.00</span>
              <span>X: 1.00 | V: 0.80</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Score: 93.4 (CRITICAL)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DYNAMIC THREAT INTELLIGENCE FEED & INTERACTIVE ATTACK CORRELATION GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Threat Intelligence Feed (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Threat Intelligence Feed
                </h4>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Click any advisory to pivot the correlation graph &rarr;
                </span>
              </div>
            </div>

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-bold text-[10px] border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-all"
              >
                <UploadCloud className="w-3 h-3" />
                Upload CSV
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs max-h-[460px] overflow-y-auto pr-1">
            {dynamicThreatFeed.map((item, idx) => {
              const isSelected = selectedThreatIdx === idx;
              return (
                <div
                  key={item.id + idx}
                  onClick={() => {
                    setSelectedThreatIdx(idx);
                    setInspectedNode(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-slate-800 border-blue-500 dark:border-cyan-500 shadow-xs ring-1 ring-blue-400 dark:ring-cyan-500'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.src}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {item.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.sev === 'Critical'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      }`}>
                        {item.sev}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-cyan-400 animate-pulse font-mono">
                          ● PIVOTED
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {item.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span>Target: <strong className="text-slate-700 dark:text-slate-300">{item.asset}</strong></span>
                    <span>Risk: <strong className="text-red-600 dark:text-red-400">{item.score.toFixed(1)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Truly Dynamic Attack Correlation Radial Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Attack Correlation Radial Graph (Interactive)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Live topology for <strong className="text-blue-600 dark:text-cyan-400 font-mono">{activeThreat.id}</strong>. Click any node to inspect.
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

          {/* SVG Radial Graph Visual Canvas */}
          <div className="relative bg-slate-50/70 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[340px] flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 460 300" className="w-full max-w-[460px] h-72">
              {/* Connecting lines from center to satellite nodes */}
              <line x1="230" y1="150" x2="80" y2="70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="230" y1="150" x2="380" y2="70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="230" y1="150" x2="60" y2="180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="230" y1="150" x2="400" y2="180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="230" y1="150" x2="140" y2="250" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="230" y1="150" x2="320" y2="250" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Central Threat Node */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('THREAT')}>
                <circle cx="230" cy="150" r="32" fill="#EF4444" opacity="0.2" className="animate-ping" />
                <circle cx="230" cy="150" r="26" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                <text x="230" y="148" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
                  {activeThreat.id.length > 13 ? activeThreat.id.slice(0, 11) + '..' : activeThreat.id}
                </text>
                <text x="230" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="8" opacity="0.9">
                  {activeThreat.score.toFixed(1)}
                </text>
              </g>

              {/* Node 1: Target Asset (Blue) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('ASSET')}>
                <circle cx="80" cy="70" r="18" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5" />
                <text x="80" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Asset</text>
                <text x="80" y="98" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.asset.split('.')[0]}
                </text>
              </g>

              {/* Node 2: Intel Source (Amber) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('INTEL')}>
                <circle cx="380" cy="70" r="18" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                <text x="380" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Source</text>
                <text x="380" y="98" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.src}
                </text>
              </g>

              {/* Node 3: Attacker IP (Rose) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('IP')}>
                <circle cx="60" cy="180" r="18" fill="#EC4899" stroke="#DB2777" strokeWidth="1.5" />
                <text x="60" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">IP IOC</text>
                <text x="60" y="208" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.ip}
                </text>
              </g>

              {/* Node 4: Policy Rule (Emerald) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('POLICY')}>
                <circle cx="400" cy="180" r="18" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
                <text x="400" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Policy</text>
                <text x="400" y="208" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.policy.split('_')[0]}
                </text>
              </g>

              {/* Node 5: Vector / Product (Cyan) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('VECTOR')}>
                <circle cx="140" cy="250" r="18" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" />
                <text x="140" y="254" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Product</text>
                <text x="140" y="278" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.product}
                </text>
              </g>

              {/* Node 6: State Machine Status (Purple) */}
              <g className="cursor-pointer" onClick={() => setInspectedNode('STATUS')}>
                <circle cx="320" cy="250" r="18" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5" />
                <text x="320" y="254" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">Status</text>
                <text x="320" y="278" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">
                  {activeThreat.status}
                </text>
              </g>
            </svg>

            {/* Clicked Node Detail Card Overlay */}
            {inspectedNode && (
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

            <div className="flex gap-2">
              <button
                onClick={() => onSelectWarning(activeThreat.warningId)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <span>Investigate Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
