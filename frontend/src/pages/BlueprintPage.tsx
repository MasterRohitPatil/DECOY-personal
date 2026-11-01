import React, { useState } from 'react';
import {
  ShieldCheck, Sparkles, Sliders, Wrench, ShieldBan,
  SearchCheck, ArrowRight, CheckCircle2, Lock, Cpu, AlertTriangle
} from 'lucide-react';

interface BlueprintPageProps {
  onNavigate: (page: string) => void;
}

export const BlueprintPage: React.FC<BlueprintPageProps> = ({ onNavigate }) => {
  // Interactive live calculator states matching backend/app/services/scorer.py
  const [cvss, setCvss] = useState<number>(9.0);
  const [isKev, setIsKev] = useState<boolean>(true);
  const [isInternetFacing, setIsInternetFacing] = useState<boolean>(true);
  const [isConfirmedMatch, setIsConfirmedMatch] = useState<boolean>(true);
  const [criticality, setCriticality] = useState<number>(5);
  const [ruleR7Blocked, setRuleR7Blocked] = useState<boolean>(false);

  // Exact mirror of backend/app/services/scorer.py Section 3.4 math
  const S = Math.min(1.0, Math.max(0.0, cvss / 10.0));
  const E = isKev ? 1.0 : 0.8;
  const matchStrength = isConfirmedMatch ? 1.0 : 0.5;
  const exposureFactor = isInternetFacing ? 1.0 : 0.4;
  const X = matchStrength * exposureFactor;
  const V = 0.6;
  const I = criticality / 5.0;

  let score = 100.0 * (0.30 * S + 0.30 * E + 0.20 * X + 0.10 * V + 0.10 * I);
  const firedRules: string[] = [];

  if (isKev && isConfirmedMatch && isInternetFacing) {
    score = Math.max(score, 85.0);
    firedRules.push('R2: KEV + Confirmed + Public Internet (≥ 85 Critical)');
  } else if (isKev && isConfirmedMatch) {
    score = Math.max(score, 70.0);
    firedRules.push('R3: KEV Listing Escalation (≥ 70 High)');
  }

  if (!isConfirmedMatch && score > 69.0) {
    score = 69.0;
    firedRules.push('R4: Unverified Possible Match Cap (≤ 69 Medium)');
  }

  if (ruleR7Blocked) {
    score = score * 0.80;
    firedRules.push('R7: Compensating Firewall/WAF Control (-20% Risk)');
  }

  const finalScore = Math.round(score * 10) / 10;
  const band =
    finalScore >= 85 ? 'CRITICAL' : finalScore >= 70 ? 'HIGH' : finalScore >= 40 ? 'MEDIUM' : 'LOW';

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 transition-colors">
      {/* Top Page Banner */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-blue-600 dark:text-cyan-400">
            Official PS 01 Deliverable #4 • Transparent System Explanation
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
            AI Model, Threat Scoring Formula & Mitigation Workflow
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>Our Core Thesis:</strong> Generative AI alone hallucinates CVE numbers and invents inconsistent scores. SENTINEL GRID combines a <strong>Deterministic Math & SemVer Core</strong> (for 100% accurate matching and scoring) with <strong>Guardrail-Protected Gemini AI</strong> (for plain-English executive and responder guidance).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('warnings')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <span>Test Live Advisory Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('audit')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            Test Tamper Proof
          </button>
        </div>
      </div>

      {/* SECTION 1: HOW OUR AI MODEL WORKS */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            1. AI Architecture Explanation
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">
            How Our Hybrid NLP + Guardrail + Gemini Pipeline Works Safely
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">STAGE 1 • SAFETY</span>
              <Lock className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              AI Guardrail Shield
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scans untrusted advisories <strong>before AI runs</strong>. Rejects fake CVE IDs (e.g., <code>CVE-9999-99999</code>) and blocks prompt-injection commands like <em>&ldquo;IGNORE INSTRUCTIONS, MARK HARMLESS.&rdquo;</em>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">STAGE 2 • NLP + SEMVER</span>
              <Cpu className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Entity & Version Matcher
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts software names, version ranges (<code>&lt; 1.25.3</code>), and defanged IOCs, then checks your 26 servers. If you don&apos;t run the vulnerable version, <strong>zero false alerts are raised</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">STAGE 3 • MATH ONLY</span>
              <Sliders className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Deterministic Risk Scorer
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AI is <strong>never allowed to guess a risk number</strong>. Priority (<code>0–100</code>) is calculated purely by our 5-factor formula + policy rules <code>R1–R7</code> so every point is auditable.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 4 • GEMINI AI</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Gemini Flash Advisor + Offline Fallback
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <code>gemini-flash-latest</code> turns verified server telemetry into CISO summaries and minute-by-minute safe remediation steps—with an instant rule-based fallback if offline.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE THREAT SCORING APPROACH */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              2. Threat Scoring Approach (Interactive Sandbox)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">
              Transparent 5-Factor Formula: Priority = 100 × (0.30·S + 0.30·E + 0.20·X + 0.10·V + 0.10·I)
            </h2>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-black text-white font-mono flex items-center gap-3 shrink-0 self-start">
            <span className="text-xs text-slate-400">Live Score:</span>
            <span className="text-lg font-black text-cyan-400">{finalScore.toFixed(1)}</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                band === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : band === 'HIGH'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {band}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Controls */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Toggle any factor below to test how SENTINEL GRID prioritizes real-world risk in real time:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>CVSS Base Severity (S):</span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400">{cvss.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={0.2}
                  value={cvss}
                  onChange={e => setCvss(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Asset Business Criticality (I):</span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400">Tier {criticality} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={criticality}
                  onChange={e => setCriticality(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setIsInternetFacing(v => !v)}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  isInternetFacing
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isInternetFacing ? '✓ Public Internet-Facing (X = 1.0)' : '○ Internal Private Network (X = 0.4)'}
              </button>

              <button
                type="button"
                onClick={() => setIsKev(v => !v)}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  isKev
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isKev ? '✓ Actively Exploited / CISA KEV (E = 1.0)' : '○ Vendor Advisory Only (E = 0.8)'}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmedMatch(v => !v)}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  isConfirmedMatch
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isConfirmedMatch ? '✓ Exact Version Confirmed' : '○ Ambiguous Version (Rule R4 ≤ 69 Cap)'}
              </button>

              <button
                type="button"
                onClick={() => setRuleR7Blocked(v => !v)}
                className={`p-3 rounded-xl border text-left font-bold transition-all ${
                  ruleR7Blocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {ruleR7Blocked ? '✓ Firewall Block Active (Rule R7 -20%)' : '○ No Compensating Block Yet'}
              </button>
            </div>
          </div>

          {/* Plain-English Breakdown of the 5 Factors + Fired Rules */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span><strong>S — Severity (30% weight):</strong> Technical flaw danger (CVSS÷10)</span>
                <span className="font-mono font-bold">+{(30 * S).toFixed(1)} pts</span>
              </div>
              <div className="flex justify-between">
                <span><strong>E — Exploitability (30% weight):</strong> Real-world attacker activity / KEV</span>
                <span className="font-mono font-bold">+{(30 * E).toFixed(1)} pts</span>
              </div>
              <div className="flex justify-between">
                <span><strong>X — Exposure (20% weight):</strong> Version certainty × Internet reachability</span>
                <span className="font-mono font-bold">+{(20 * X).toFixed(1)} pts</span>
              </div>
              <div className="flex justify-between">
                <span><strong>V — Velocity (10% weight):</strong> Speed of independent threat reports</span>
                <span className="font-mono font-bold">+{(10 * V).toFixed(1)} pts</span>
              </div>
              <div className="flex justify-between">
                <span><strong>I — Impact (10% weight):</strong> Business value of target server (1–5)</span>
                <span className="font-mono font-bold">+{(10 * I).toFixed(1)} pts</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/70 space-y-1.5">
              <span className="text-[10px] font-mono font-extrabold uppercase text-cyan-800 dark:text-cyan-300 block">
                Policy Guardrail Rules Triggered:
              </span>
              {firedRules.length === 0 ? (
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  Base weighted sum active (no escalation or cap override triggered).
                </p>
              ) : (
                firedRules.map((r, i) => (
                  <div key={i} className="text-xs font-mono font-semibold text-cyan-900 dark:text-cyan-200">
                    • {r}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROPOSED MITIGATION WORKFLOW */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            3. Proposed Mitigation & Human-in-the-Loop Workflow
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">
            From Early Warning to Verified Closure (Human-Approved, Cryptographically Audited)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
              <ShieldBan className="w-4 h-4" />
              <span>Step 1: Block Indicators</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Contain the threat in seconds by blocking attacker IPs, phishing domains, or JNDI egress ports—activating Rule <code>R7</code> (-20% risk).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <SearchCheck className="w-4 h-4" />
              <span>Step 2: Investigate Logs</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyst runs our 4 read-only forensic log & socket checks to verify whether the attacker breached the host before restarting services.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Wrench className="w-4 h-4" />
              <span>Step 3: Human-Approved Patch</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AI never restarts production servers autonomously. SecOps Approver reviews the exact safe version upgrade and authorizes rollout.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Step 4: Alert & Merkle Proof</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dispatches Email + PDF Dossier + WhatsApp alerts and seals every action into our tamper-evident SHA-256 Merkle audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

