import React, { useState } from 'react';
import { X, MessageSquare, Mail, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';
import { api } from '../api';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alertData: {
    whatsapp?: any;
    email?: any;
  } | null;
  onMitigated?: () => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  alertData,
  onMitigated
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [mitigating, setMitigating] = useState(false);
  const [mitigated, setMitigated] = useState(false);

  if (!isOpen || !alertData) return null;

  const wa = alertData.whatsapp;
  const email = alertData.email;

  const handleCopyText = () => {
    if (wa?.formatted_text) {
      navigator.clipboard.writeText(wa.formatted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFirewallBlock = async () => {
    setMitigating(true);
    try {
      // Extract IP or use default
      const ip = '198.51.100.23';
      await api.blockIp(ip);
      setMitigated(true);
      if (onMitigated) onMitigated();
    } finally {
      setMitigating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-soc-card border-l border-soc-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <h3 className="font-bold text-white text-sm">Security Incident Dispatcher</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            No-API Multi-Channel
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2">
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp (No-API)
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'email'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          SOC Email Inbox
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'whatsapp' ? (
          <div className="space-y-4">
            {/* Phone Screen Mockup */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span>📱 WhatsApp Incident Broadcast</span>
                <span className="text-emerald-400 font-mono">SecOps On-Call</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-xl p-3 text-slate-100 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {wa?.formatted_text || 'No active WhatsApp alert.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <a
                href={wa?.wa_deep_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg glow-cyan"
              >
                <ExternalLink className="w-4 h-4" />
                Open WhatsApp Web (wa.me)
              </a>
              <button
                onClick={handleCopyText}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
              <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <p><strong>From:</strong> {email?.sender || 'soc-alerts@sentinel-grid.internal'}</p>
                <p><strong>To:</strong> {email?.recipient || 'security-leads@sentinel-grid.internal'}</p>
                <p><strong>Subject:</strong> <span className="text-cyan-400">{email?.subject || 'Alert'}</span></p>
              </div>

              <div
                className="pt-2 text-slate-300"
                dangerouslySetInnerHTML={{ __html: email?.html_body || '<p>No email content.</p>' }}
              />
            </div>
          </div>
        )}

        {/* 1-Click Closed Loop Mitigation Action */}
        <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/30 space-y-2 mt-4">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Closed-Loop Mitigation (Rule R7)
          </div>
          <p className="text-[11px] text-slate-400">
            Apply automated compensating control to drop attacker packets at the edge firewall and lower priority by 20%.
          </p>
          <button
            onClick={handleFirewallBlock}
            disabled={mitigating || mitigated}
            className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-md ${
              mitigated
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-black'
            }`}
          >
            {mitigating ? 'Applying Firewall Rule...' : mitigated ? '✓ IP Dropped in Perimeter Firewall (MITIGATED)' : 'Approve Perimeter Firewall IP Block'}
          </button>
        </div>
      </div>
    </div>
  );
};

