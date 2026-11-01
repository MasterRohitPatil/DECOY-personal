import React, { useState, useEffect } from 'react';
import {
  Flame, ShieldAlert, ShieldCheck, Zap, Lock, Skull,
  Radio, Server, Database, Globe, User, ArrowRight,
  ExternalLink, Copy, Check, AlertTriangle, ShieldX,
  RefreshCw, Info, Cpu, Send, Mail, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { AssetItem, AttackResult, KillChainStep, SmtpStatusResponse } from '../types';

interface AttackScenario {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  protocol: string;
  defaultHost: string;
  desc: string;
  damage: string;
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'brute-force',
    title: 'SSH Auth Brute Force',
    icon: Flame,
    protocol: 'SSH (Port 22)',
    defaultHost: 'auth-srv-01.prod.sentinel',
    desc: 'High-frequency credential stuffing against port 22. Ingests raw auth failure events and evaluates target SSH exposure.',
    damage: 'Root shell compromise on authentication cluster and credential exfiltration.'
  },
  {
    id: 'dos',
    title: 'Layer 7 HTTP/2 Rapid Reset',
    icon: Zap,
    protocol: 'HTTP/2 (Port 443)',
    defaultHost: 'edge-proxy-01.prod.sentinel',
    desc: 'Multiplexed stream cancellation flood targeting web ingress. Tests connection pool saturation and gateway resiliency.',
    damage: 'Ingress proxy buffer exhaustion leading to total API downtime.'
  },
  {
    id: 'malicious-ip',
    title: 'C2 Botnet Beaconing',
    icon: Skull,
    protocol: 'TLS Reverse Shell (Port 4444)',
    defaultHost: 'vpn-gw-01.prod.sentinel',
    desc: 'Outbound command-and-control communication matched against abuse.ch Feodo/Mirai threat intelligence feeds.',
    damage: 'Persistence established inside perimeter subnet enabling lateral movement.'
  },
  {
    id: 'phishing',
    title: 'Spear-Phishing Credential Harvester',
    icon: Radio,
    protocol: 'HTTPS (Port 443)',
    defaultHost: 'web-portal-01.prod.sentinel',
    desc: 'Deceptive credential harvesting lure targeting employee workstation pool and SSO authentication tokens.',
    damage: 'Corporate employee credentials stolen, leading to unauthorized portal session takeover.'
  },
  {
    id: 'ransomware',
    title: 'Supply Chain Memory Injection',
    icon: Skull,
    protocol: 'Raw Memory Hook',
    defaultHost: 'auth-srv-01.prod.sentinel',
    desc: 'Unauthorized hook inside sshd process memory space matching upstream backdoor pattern (CVE-2024-3094).',
    damage: 'SSHD daemon takeover, memory payload staging, and catastrophic host key leakage.'
  }
];

interface AttackLabPageProps {
  onRefresh?: () => void;
  onSelectWarning?: (warningId: string) => void;
}

export const AttackLabPage: React.FC<AttackLabPageProps> = ({
  onRefresh,
  onSelectWarning
}) => {
  const [selectedAttack, setSelectedAttack] = useState<string>('brute-force');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedHost, setSelectedHost] = useState<string>('auth-srv-01.prod.sentinel');
  const [result, setResult] = useState<AttackResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [assetsLoading, setAssetsLoading] = useState<boolean>(true);
  const [isMitigated, setIsMitigated] = useState<boolean>(false);
  const [mitigating, setMitigating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SMTP Email Dispatch State
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusResponse | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);

  // Load assets on mount
  useEffect(() => {
    async function loadAssetsAndSmtp() {
      setAssetsLoading(true);
      try {
        const [assetList, smtp] = await Promise.all([
          api.getAssets(),
          api.getSmtpStatus().catch(() => null)
        ]);
        setAssets(assetList);
        if (smtp) {
          setSmtpStatus(smtp);
          if (smtp.from_address) setEmailRecipient(smtp.from_address);
        }
        if (assetList.length > 0 && !assetList.some(a => a.hostname === selectedHost)) {
          setSelectedHost(assetList[0].hostname);
        }
      } catch (e: any) {
        setErrorMsg('Failed to fetch enterprise assets: ' + e.message);
      } finally {
        setAssetsLoading(false);
      }
    }
    loadAssetsAndSmtp();
  }, []);

  // Run attack simulation
  const handleFireAttack = async (attackType?: string, targetHost?: string, syncGlobal: boolean = true) => {
    const atk = attackType || selectedAttack;
    const host = targetHost || selectedHost;
    setSelectedAttack(atk);
    setSelectedHost(host);
    setLoading(true);
    setIsMitigated(false);
    setErrorMsg(null);
    setEmailSentStatus(null);

    try {
      const response = await api.triggerAttack(atk, host);
      setResult(response.result);
      if (syncGlobal && onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation if not yet run and assets are loaded
  useEffect(() => {
    if (assets.length > 0 && !result && !loading) {
      handleFireAttack('brute-force', 'auth-srv-01.prod.sentinel', false);
    }
  }, [assets]);

  // Handle mitigation via border block
  const handleMitigate = async () => {
    if (!result) return;
    setMitigating(true);
    setErrorMsg(null);
    try {
      const res = await api.blockIp(result.source_ip);
      setIsMitigated(true);
      if (res && res.new_score !== undefined) {
        setResult({
          ...result,
          score: res.new_score,
          severity: res.new_band as any,
          rules_fired: [...result.rules_fired, 'R7_COMPENSATING_CONTROL_MITIGATION']
        });
      }
      if (onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      setErrorMsg('Mitigation failed: ' + (e.message || 'Unable to apply firewall drop rule.'));
    } finally {
      setMitigating(false);
    }
  };

  // Handle real SMTP email alert dispatch
  const handleSendEmail = async () => {
    if (!result) return;
    setSendingEmail(true);
    setEmailSentStatus(null);
    try {
      const res = await api.sendRealEmail({
        to_email: emailRecipient,
        warning_id: result.warning_id,
        title: result.attack_type.replace('-', ' ').toUpperCase(),
        target_hostname: result.target_hostname,
        source_ip: result.source_ip,
        risk_score: result.score,
        band: result.severity,
        recommended_action: 'Automated iptables border drop rule executed via SENTINEL GRID.'
      });
      setEmailSentStatus(`Dispatched live email via SMTP to ${res.recipient} (Subject: ${res.subject})`);
    } catch (e: any) {
      setEmailSentStatus('Failed to send email: ' + (e.message || 'Check SMTP configuration'));
    } finally {
      setSendingEmail(false);
    }
  };

  const currentScenario = ATTACK_SCENARIOS.find(a => a.id === selectedAttack) || ATTACK_SCENARIOS[0];
  const targetAsset = assets.find(a => a.hostname === selectedHost);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://decoy-personal.vercel.app';

  // WhatsApp Alert Text
  const waMessage = result ? `🚨 *SENTINEL GRID INCIDENT ALERT*
━━━━━━━━━━━━━━━━━━━
• *Attack:* ${result.attack_type.replace('-', ' ').toUpperCase()}
• *Target Asset:* \`${result.target_hostname}\` (${result.target_asset.environment})
• *Product:* \`${result.target_asset.product} ${result.target_asset.version}\`
• *Attacker Origin:* \`${result.source_ip}\`
• *Calculated Priority:* ${result.score}/100 (${result.severity})
• *Exposure Reality:* ${result.exposure_status}
• *Status:* ${isMitigated ? 'MITIGATED (Rule R7 Active)' : 'ACTIVE THREAT DETECTED'}
━━━━━━━━━━━━━━━━━━━
👉 Live Console: ${originUrl}` : '';

  const waDeepLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    if (!waMessage) return;
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" /> Live Telemetry Lab & Section 3.4 Correlator
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Dynamic Attack Simulation & Visual Kill Chain
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Simulate realistic raw security events (timestamps, source IPs, targets) flowing through the <strong>Section 3.4 Priority Formula</strong>. Outcomes dynamically compute from actual target asset exposure—never scripted or hardcoded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMitigated ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Rule R7 Compensating Barrier Active
            </span>
          ) : result ? (
            <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm ${
              result.severity === 'CRITICAL'
                ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse'
                : result.severity === 'HIGH'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              Priority Score: {result.score} ({result.severity})
            </span>
          ) : null}
        </div>
      </div>

      {/* Target Asset Selector & Judge Demo Presets */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Target Monitored Enterprise Asset (From Live Inventory):
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select any asset in your infrastructure to test how reachability, internet exposure, and running software affect the threat score.
            </p>
          </div>

          {/* Quick Demo Switcher for Judges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 font-semibold mr-1">Judge Quick-Test:</span>
            <button
              onClick={() => handleFireAttack(selectedAttack, 'auth-srv-01.prod.sentinel')}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedHost === 'auth-srv-01.prod.sentinel'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-400 text-red-700 dark:text-red-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔥 Vulnerable Prod (auth-srv-01)
            </button>
            <button
              onClick={() => handleFireAttack(selectedAttack, 'isolated-backup-san.sentinel')}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedHost === 'isolated-backup-san.sentinel'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🛡️ Airgapped DB (isolated-backup-san)
            </button>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="md:col-span-2">
            <select
              value={selectedHost}
              onChange={(e) => handleFireAttack(selectedAttack, e.target.value)}
              disabled={loading || assetsLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {assetsLoading ? (
                <option>Loading asset inventory from database...</option>
              ) : (
                assets.map(a => (
                  <option key={a.id} value={a.hostname}>
                    {a.hostname} [{a.environment}] — {a.product} {a.version} ({a.internet_facing ? 'INTERNET-FACING' : 'INTERNAL/AIRGAPPED'}, Criticality: {a.criticality}/5)
                  </option>
                ))
              )}
            </select>
          </div>

          {targetAsset && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                targetAsset.internet_facing
                  ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {targetAsset.internet_facing ? 'INTERNET FACING (V=1.0)' : 'INTERNAL TIER (V=0.5)'}
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-400 truncate">
                {targetAsset.product} • Crit: {targetAsset.criticality}/5
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attack Scenario Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ATTACK_SCENARIOS.map(atk => {
          const Icon = atk.icon;
          const isSelected = atk.id === selectedAttack;
          return (
            <button
              key={atk.id}
              onClick={() => handleFireAttack(atk.id, selectedHost)}
              disabled={loading}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-red-50 dark:bg-slate-900 border-red-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-red-400'
                  : 'bg-white dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono text-slate-400">{atk.protocol.split(' ')[0]}</span>
              </div>
              <h4 className="font-bold text-xs line-clamp-2 min-h-[32px] leading-snug">{atk.title}</h4>
              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{atk.protocol}</span>
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => handleFireAttack()}
            className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-500 text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Correlating Telemetry Against Asset Inventory...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Ingesting raw packet telemetry, verifying software applicability on <code>{selectedHost}</code>, evaluating active CVE exposures, and computing Section 3.4 formula.
            </p>
          </div>
        </div>
      )}

      {/* REAL RESULTS VIEW */}
      {!loading && result && (
        <>
          {/* THE DYNAMIC VISUAL KILL CHAIN */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Dynamic MITRE ATT&CK Kill Chain Impact
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Constructed dynamically from actual packet telemetry correlated against <code>{result.target_hostname}</code>
                </p>
              </div>

              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${
                isMitigated
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : result.severity === 'CRITICAL'
                  ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}>
                {isMitigated ? 'STATUS: MITIGATED VIA RULE R7' : `SEVERITY: ${result.severity} (${result.score}/100)`}
              </span>
            </div>

            {/* 4-Node Dynamic Kill Chain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {result.kill_chain.map((node: KillChainStep, idx: number) => {
                const isStep1 = idx === 0;
                const isStep2 = idx === 1;
                const isStep3 = idx === 2;
                const isStep4 = idx === 3;

                return (
                  <div
                    key={node.step}
                    className={`p-4 rounded-xl border transition-all relative ${
                      isMitigated && isStep2
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                        : isMitigated
                        ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        : node.status === 'COMPROMISED' || node.status === 'ATTACKED' || node.status === 'EXPOSED' || node.status === 'AT_RISK'
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-500/80 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Barrier Flag if Mitigated at Node 2 */}
                    {isMitigated && isStep2 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                        FIREWALL BARRIER ACTIVE
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                      <span>Step {node.step}: {node.node}</span>
                      {isStep1 && <Globe className="w-4 h-4 text-red-500" />}
                      {isStep2 && <Lock className="w-4 h-4 text-amber-500" />}
                      {isStep3 && <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                      {isStep4 && <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>

                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold mb-2 ${
                      isMitigated && isStep2
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400'
                        : node.status === 'COMPROMISED' || node.status === 'ATTACKED' || node.status === 'EXPOSED' || node.status === 'AT_RISK'
                        ? 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}>
                      {isStep1 && <Skull className="w-5 h-5" />}
                      {isStep2 && <User className="w-5 h-5" />}
                      {isStep3 && <Server className="w-5 h-5" />}
                      {isStep4 && <Database className="w-5 h-5" />}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{node.phase}</h4>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 mt-1 font-semibold break-words">
                      {node.entity}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {node.detail}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400">{node.mitre_id}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        isMitigated && isStep2
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : node.status === 'COMPROMISED' || node.status === 'EXPOSED' || node.status === 'AT_RISK'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {isMitigated && isStep2 ? 'SHIELDED' : node.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Impact Analysis & Mitigation Control */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Section 3.4 Impact Explanation:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200">
                  {isMitigated ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      ✓ CONTAINED: Automated iptables drop rule applied for {result.source_ip}. Risk score attenuated by 20% (Rule R7).
                    </span>
                  ) : result.target_asset.internet_facing && result.is_software_applicable ? (
                    <span className="text-red-700 dark:text-red-300 font-bold">
                      ⚠️ CRITICAL EXPOSURE: Asset <code>{result.target_hostname}</code> is internet-facing (V=1.0) and running matching software (<code>{result.target_asset.product}</code>). Active attack vector elevates risk to {result.score}/100.
                    </span>
                  ) : !result.target_asset.internet_facing ? (
                    <span className="text-blue-700 dark:text-blue-300 font-bold">
                      🛡️ AIRGAPPED / INTERNAL ATTENUATION: Asset <code>{result.target_hostname}</code> has no direct internet reachability (V=0.5). Risk score is contained to {result.score}/100 ({result.severity}).
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300 font-bold">
                      ⚠️ PROBED: Asset is reachable, but vector does not match vulnerable software. Base score attenuated to {result.score}/100.
                    </span>
                  )}
                </p>
              </div>

              {/* Action Buttons: Mitigate & Open 3-Pillar Playbook */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleMitigate}
                  disabled={mitigating || isMitigated}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 ${
                    isMitigated
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-200 dark:shadow-none'
                  }`}
                >
                  {mitigating ? (
                    'Deploying Rule...'
                  ) : isMitigated ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Firewall Rule Deployed (Mitigated)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Deploy Automated Perimeter Block (Rule R7)
                    </>
                  )}
                </button>

                {result.warning_id && onSelectWarning && (
                  <button
                    type="button"
                    onClick={() => onSelectWarning(result.warning_id)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Open 3-Pillar Playbook</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3.4 FORMULA DIMENSIONAL BREAKDOWN & TELEMETRY LOG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mathematical Scoring Card */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Section 3.4 SEXVI Formula Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded font-bold">
                  Score: {result.score} / 100
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">S (Severity)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.dimensions.S}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">E (Exploit)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.dimensions.E}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">X (Exposure)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.dimensions.X}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">V (Reach)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.dimensions.V}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">I (Impact)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.dimensions.I}</span>
                </div>
              </div>

              {/* Rules Fired */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Rules Fired During Evaluation:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.rules_fired.map(rule => (
                    <span key={rule} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Telemetry Record Ingested to Database */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Raw Security Event Record (DB Persisted)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {result.event_id.slice(0, 8)}...
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                <p className="text-slate-400 text-[11px]">// Live telemetry payload from packet capture</p>
                <p className="mt-1"><span className="text-cyan-400">origin_ip:</span> "{result.source_ip}"</p>
                <p><span className="text-cyan-400">target_host:</span> "{result.target_hostname}"</p>
                <p><span className="text-cyan-400">event_type:</span> "{result.attack_type.toUpperCase()}"</p>
                <p className="mt-1 text-slate-300">"{result.raw_payload}"</p>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ✓ Recorded in <code>security_event</code> table with cryptographic SHA-256 Merkle audit trail entry.
              </p>
            </div>
          </div>

          {/* MULTI-CHANNEL INCIDENT DISPATCHER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp Card */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Instant WhatsApp Incident Dispatch</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
                  No-API (wa.me)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opens pre-filled incident dispatch directly to the incident response team without Meta developer API credentials.
              </p>

              {/* Phone Mockup */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-inner">
                <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                  <span>📱 Incident Notification Channel</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">SecOps Team</span>
                </div>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {waMessage}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={waDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp Web (wa.me)
                </a>
                <button
                  onClick={handleCopy}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Email Card (With Real SMTP Dispatch) */}
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">SOC Email Incident Dispatch</h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  smtpStatus?.configured
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}>
                  {smtpStatus?.configured ? 'Real SMTP Connected' : 'Preview Only — SMTP Unconfigured'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dispatches a formatted incident advisory to SOC lead engineers via authenticated TLS SMTP.
              </p>

              {/* Recipient Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 font-bold block">
                  Alert Recipient Email:
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="analyst@domain.com"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono shadow-inner">
                <p><strong>Subject:</strong> <span className="text-cyan-600 dark:text-cyan-400 font-bold">[{result.severity}] {result.attack_type.replace('-', ' ').toUpperCase()} on {result.target_hostname}</span></p>
                <p><strong>Origin IP:</strong> <span className="text-red-600 dark:text-red-400 font-bold">{result.source_ip}</span></p>
                <p><strong>Section 3.4 Score:</strong> <span className="font-bold">{result.score}/100</span></p>
              </div>

              {emailSentStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-mono ${
                  emailSentStatus.startsWith('Dispatched')
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  {emailSentStatus}
                </div>
              )}

              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !smtpStatus?.configured}
                className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all ${
                  smtpStatus?.configured
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Email via SMTP...
                  </>
                ) : smtpStatus?.configured ? (
                  <>
                    <Send className="w-4 h-4" />
                    Dispatch Live Email Alert via SMTP
                  </>
                ) : (
                  'SMTP Not Configured (Set SMTP_USER & APP_PASSWORD in .env)'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
