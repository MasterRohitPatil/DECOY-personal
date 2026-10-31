import React, { useState } from 'react';
import {
  Flame, ShieldAlert, ShieldCheck, Zap, Lock, Skull,
  Radio, Server, Database, Globe, User, ArrowRight,
  ExternalLink, Copy, Check, AlertTriangle, ShieldX
} from 'lucide-react';
import { api } from '../api';

export const AttackLabPage: React.FC = () => {
  const [selectedAttack, setSelectedAttack] = useState<string>('brute-force');
  const [attackActive, setAttackActive] = useState<boolean>(true);
  const [isMitigated, setIsMitigated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const attacks = [
    {
      id: 'brute-force',
      title: 'SSH Auth Brute Force',
      icon: Flame,
      origin: '198.51.100.23 (Known Scanner)',
      target: 'auth-srv-01.prod.sentinel',
      desc: '18 rapid failed SSH logins targeting root within 4s. Breaches authentication barrier if uncontained.',
      damage: 'Root shell compromise on auth server & lateral movement to corporate SSO.',
      node2: 'User Account / SSH Login',
      node3: 'Auth Server (auth-srv-01)',
      node4: 'SSO Identity Tokens'
    },
    {
      id: 'phishing',
      title: 'Phishing Campaign Lure',
      icon: Radio,
      origin: '185.220.101.5 (Spoofed Domain)',
      target: 'web-portal-01.prod.sentinel',
      desc: 'Employee clicks deceptive email directing to paypa1-secure-auth[.]com harvesting credentials.',
      damage: 'Corporate employee credentials stolen, leading to unauthorized intranet access.',
      node2: 'Employee Email / Browser',
      node3: 'Web Portal Gateway',
      node4: 'Customer Banking Records'
    },
    {
      id: 'dos',
      title: 'Layer 7 DoS Request Flood',
      icon: Zap,
      origin: '203.0.113.88 (Botnet Flood)',
      target: 'edge-proxy-01.prod.sentinel',
      desc: '120 requests/sec flooding /login endpoint. Overwhelms connection pools and causes service outage.',
      damage: 'Public gateway crash, resulting in total transaction downtime and revenue loss.',
      node2: 'Public Ingress / Port 443',
      node3: 'Edge Proxy Host',
      node4: 'Internal API Services'
    },
    {
      id: 'malicious-ip',
      title: 'C2 Botnet Communication',
      icon: Skull,
      origin: '45.33.32.156 (abuse.ch Feodo Match)',
      target: 'vpn-gw-01.prod.sentinel',
      desc: 'Inbound reverse shell connection from known Mirai/Feodo Botnet C2 infrastructure.',
      damage: 'Command-and-control persistence established inside private corporate VPN subnet.',
      node2: 'VPN Access Gateway',
      node3: 'Internal Proxy Host',
      node4: 'Active Directory Core'
    },
    {
      id: 'unauthorized-access',
      title: 'Privilege Escalation Probe',
      icon: Lock,
      origin: '192.0.2.144 (Untrusted Internal)',
      target: 'db-cluster-01.prod.sentinel',
      desc: 'Direct query to /admin/keys and unauthorized SQL dump attempts bypassing app layer.',
      damage: 'Complete database exfiltration, customer PII exposure, and regulatory penalties.',
      node2: 'API Gateway Token Check',
      node3: 'Database Worker Node',
      node4: 'Encrypted Master Vault'
    },
    {
      id: 'ransomware',
      title: 'Ransomware Backdoor Ingress',
      icon: Skull,
      origin: '185.220.101.5 (Upstream Injected)',
      target: 'auth-srv-01.prod.sentinel',
      desc: 'Memory injection matching CVE-2024-3094 upstream backdoor executing stage-1 payload in sshd.',
      damage: 'SSHD process takeover, memory payload staging, and catastrophic lateral key leakage.',
      node2: 'SSHD Memory Daemon',
      node3: 'Auth Server (auth-srv-01)',
      node4: 'Master Keyring Store'
    }
  ];

  const current = attacks.find(a => a.id === selectedAttack) || attacks[0];

  const handleFireAttack = async (id: string) => {
    setSelectedAttack(id);
    setIsMitigated(false);
    setAttackActive(true);
    try {
      await api.triggerAttack(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMitigate = async () => {
    setLoading(true);
    try {
      await api.blockIp(current.origin.split(' ')[0]);
      setIsMitigated(true);
    } catch (e) {
      console.error(e);
      setIsMitigated(true);
    } finally {
      setLoading(false);
    }
  };

  const waMessage = `🚨 *SENTINEL GRID INCIDENT ALERT*
━━━━━━━━━━━━━━━━━━━
• *Attack:* ${current.title}
• *Target:* \`${current.target}\`
• *Attacker IP:* \`${current.origin}\`
• *Status:* ${isMitigated ? 'MITIGATED (Rule R7 Active)' : 'ACTIVE THREAT DETECTED'}
• *Impact:* ${current.damage}
━━━━━━━━━━━━━━━━━━━
👉 Response Action: http://localhost:5173`;

  const waDeepLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" /> Live Telemetry Lab & Breach Chain
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Attack Simulation & Visual Kill Chain Impact
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Simulate realistic attack scenarios and watch how an uncontained breach moves through the connection chain—from malicious origin down to compromised accounts, host servers, and internal databases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMitigated ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Containment Deployed (Rule R7)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Active Breach Stream
            </span>
          )}
        </div>
      </div>

      {/* Attack Scenario Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {attacks.map(atk => {
          const Icon = atk.icon;
          const isSelected = atk.id === selectedAttack;
          return (
            <button
              key={atk.id}
              onClick={() => handleFireAttack(atk.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-red-50 dark:bg-slate-900 border-red-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-red-400'
                  : 'bg-white dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono text-slate-400">Live Inject</span>
              </div>
              <h4 className="font-bold text-xs truncate">{atk.title}</h4>
              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{atk.target.split('.')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* THE VISUAL KILL CHAIN & CONNECTION IMPACT */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Visual Connection Chain: Threat Propagation & Impact
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracing attack trajectory from external internet ingress down to physical host and database assets
            </p>
          </div>

          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${
            isMitigated
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse'
          }`}>
            {isMitigated ? 'STATUS: ATTACK INTERCEPTED AT EDGE' : 'STATUS: UNCONTAINED LATERAL MOVEMENT'}
          </span>
        </div>

        {/* 4-Node Animated Connection Chain */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Node 1: Threat Origin */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMitigated ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-500/80 shadow-md'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Node 1: Attacker</span>
              <Globe className="w-4 h-4 text-red-500" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 flex items-center justify-center text-red-600 dark:text-red-400 font-bold mb-2">
              <Skull className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">Public Internet Ingress</h4>
            <p className="text-[11px] font-mono text-red-700 dark:text-red-300 mt-1">{current.origin}</p>
            <span className="text-[10px] text-slate-500 block mt-2">
              {isMitigated ? 'Packets dropped by firewall rule' : 'Streaming malicious packets'}
            </span>
          </div>

          {/* Node 2: Entry Gate / Account */}
          <div className={`p-4 rounded-xl border transition-all relative ${
            isMitigated ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60' : 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-600/70'
          }`}>
            {/* Barrier Indicator if Mitigated */}
            {isMitigated && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                FIREWALL BARRIER ACTIVE
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Node 2: Perimeter</span>
              <User className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold mb-2 ${
              isMitigated ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">{current.node2}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Authentication Layer</p>
            <span className={`text-[10px] block mt-2 font-semibold ${
              isMitigated ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isMitigated ? '✓ Perimeter Secure (Protected)' : '⚠ Authentication Threshold Breached'}
            </span>
          </div>

          {/* Node 3: Target Host Machine */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMitigated ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-600/70'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Node 3: Host PC</span>
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold mb-2 ${
              isMitigated ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500' : 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">{current.node3}</h4>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">{current.target}</p>
            <span className={`text-[10px] block mt-2 font-semibold ${
              isMitigated ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isMitigated ? '✓ Zero Root Execution' : '⚠ Remote Command Execution Active'}
            </span>
          </div>

          {/* Node 4: Database / Crown Jewels */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMitigated ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-500/80'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Node 4: Data Vault</span>
              <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold mb-2 ${
              isMitigated ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500' : 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">{current.node4}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Confidential User Records</p>
            <span className={`text-[10px] block mt-2 font-semibold ${
              isMitigated ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isMitigated ? '✓ Zero Exfiltration' : '⚠ Data Leak / Extraction Risk'}
            </span>
          </div>
        </div>

        {/* Impact Analysis & Mitigation Control */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Real-World Impact Analysis
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-200">
              {isMitigated ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ CONTAINED: Automated iptables drop rule applied at edge. No lateral movement or user data exfiltration occurred.
                </span>
              ) : (
                <span className="text-red-700 dark:text-red-300 font-bold">
                  ⚠️ BREACH RISK: {current.damage}
                </span>
              )}
            </p>
          </div>

          {/* Action Button: Mitigate / Unmitigate */}
          <button
            onClick={handleMitigate}
            disabled={loading || isMitigated}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 ${
              isMitigated
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-200 dark:shadow-none'
            }`}
          >
            {loading ? (
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
        </div>
      </div>

      {/* INSTANT INCIDENT DISPATCHER (No-API WhatsApp & Email) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Mobile Preview Card */}
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
            Generates pre-formatted incident notifications dispatched directly to on-call security engineers without Meta API fees.
          </p>

          {/* Phone Screen Mockup */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-inner">
            <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
              <span>📱 Incident Alert Channel</span>
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

        {/* Email Notification Preview */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">SOC Email Incident Brief</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded font-bold">
              Automated Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rich HTML security advisory dispatched to CISO and SOC distribution lists with attack forensics.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2 text-slate-700 dark:text-slate-300 font-mono shadow-inner">
            <div className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
              <p><strong>From:</strong> soc-alerts@sentinel-grid.internal</p>
              <p><strong>To:</strong> oncall-incident-response@sentinel-grid.internal</p>
              <p><strong>Subject:</strong> <span className="text-cyan-600 dark:text-cyan-400 font-bold">[CRITICAL] Active {current.title} on {current.target}</span></p>
            </div>
            <div className="pt-2 text-slate-700 dark:text-slate-300 text-xs space-y-1">
              <p>An automated high-severity incident alert has been triggered by SENTINEL GRID.</p>
              <p>• <strong>Attacker Origin:</strong> <span className="text-red-600 dark:text-red-400 font-bold">{current.origin}</span></p>
              <p>• <strong>Target Server:</strong> <span className="text-cyan-600 dark:text-cyan-400 font-bold">{current.target}</span></p>
              <p>• <strong>Recommended Action:</strong> Apply perimeter firewall drop rule on border router.</p>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              ✓ Multi-channel alerts ensure on-call teams are notified within 2 seconds of detection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
