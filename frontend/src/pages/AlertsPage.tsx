import React, { useState } from 'react';
import {
  Bell, MessageSquare, Mail, ExternalLink, Copy,
  Check, ShieldAlert, Radio, Clock, ShieldCheck
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const defaultWaMessage = `🚨 *SENTINEL GRID SECURITY ALERT*
━━━━━━━━━━━━━━━━━━━
• *Warning ID:* \`W-2026-001\`
• *Incident:* CRITICAL RCE in NGINX Ingress on Public Auth Gateway
• *Target Asset:* \`auth-srv-01.prod.sentinel\`
• *Attacker IP:* \`198.51.100.23\` (Known Scanner match)
• *Risk Priority:* *82.0* (HIGH) ➔ Dynamic KEV Escalation to *93.4* (CRITICAL)
• *Action:* Deploy WAF header rule & upgrade to NGINX >= 1.25.3
━━━━━━━━━━━━━━━━━━━
🔗 Review in SOC: http://localhost:5173`;

  const waDeepLink = `https://wa.me/?text=${encodeURIComponent(defaultWaMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultWaMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleLogs = [
    { ts: 'Just now', type: 'WHATSAPP_DISPATCH', text: 'Encrypted wa.me deep-link dispatched for W-2026-001 to on-call security rotation.' },
    { ts: '2 mins ago', type: 'EMAIL_DISPATCH', text: 'High-severity HTML incident brief sent to oncall-incident-response@sentinel-grid.internal.' },
    { ts: '5 mins ago', type: 'ATTACK_CORRELATED', text: '18 failed SSH auth events clustered into brute force alert on auth-srv-01.' },
    { ts: '12 mins ago', type: 'EXPOSURE_MATCH', text: 'Version-aware matcher flagged CVE-2026-4421 on auth-srv-01 (1.24.0 < 1.25.3).' }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            Multi-Channel Incident Dispatcher
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Incident Alert Center & Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            When high-risk exposures or active attack floods are identified, SENTINEL GRID dispatches structured incident notifications directly to on-call teams via official WhatsApp Web deep-links and email.
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 self-start md:self-auto">
          WhatsApp No-API: Active
        </span>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Channel Card */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">WhatsApp Incident Broadcast (No-API)</h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
              RFC 3986 wa.me Link
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Uses WhatsApp Web's universal deep-linking protocol. Allows instant broadcast to on-call engineers' mobile devices without needing paid Meta Business API accounts or third-party webhooks.
          </p>

          {/* Mobile Screen Mockup */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
              <span>📱 Secure Incident Channel</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">SecOps On-Call</span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-slate-800 dark:text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
              {defaultWaMessage}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl flex items-center gap-1.5 font-bold transition-all border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Email Channel Card */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">SOC Email Incident Dispatch</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded">
              HTML Email Template
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Formatted security advisory email dispatched to CISO, SOC leads, and automated ticketing queues (Jira/ServiceNow).
          </p>

          {/* Email Preview */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono shadow-inner">
            <div className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 space-y-0.5">
              <p><strong>From:</strong> soc-alerts@sentinel-grid.internal</p>
              <p><strong>To:</strong> ciso-distribution@sentinel-grid.internal</p>
              <p><strong>Subject:</strong> <span className="text-cyan-600 dark:text-cyan-400 font-bold">[CRITICAL] NGINX RCE Exposure on auth-srv-01</span></p>
            </div>
            <div className="pt-2 text-slate-700 dark:text-slate-300 space-y-2 text-xs">
              <p className="font-sans font-semibold text-slate-900 dark:text-white">
                A critical vulnerability has been correlated to an internet-facing production server.
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <p>• <strong>Affected Host:</strong> auth-srv-01.prod.sentinel</p>
                <p>• <strong>Vulnerability:</strong> CVE-2026-4421 (CVSS 8.8)</p>
                <p>• <strong>Calculated Priority:</strong> 93.4 Critical (KEV Weaponized)</p>
                <p>• <strong>Recommended Action:</strong> Apply WAF inspection rule BLOCK_OVERSIZED_HTTP_HEADERS.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            ✓ Email alerts include machine-readable JSON headers for direct SIEM ingestion.
          </div>
        </div>
      </div>

      {/* Real-Time Security Event Dispatch Log */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Recent Notification Dispatch Logs
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {sampleLogs.map((log, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-400 font-bold">
                  {log.type}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{log.text}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">{log.ts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
