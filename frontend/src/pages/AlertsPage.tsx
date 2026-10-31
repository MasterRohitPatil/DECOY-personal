import React, { useState, useEffect } from 'react';
import {
  Bell, MessageSquare, Mail, ExternalLink, Copy,
  Check, ShieldAlert, Radio, Clock, ShieldCheck,
  Send, Phone, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { WarningItem, SmtpStatusResponse, SendEmailResponse } from '../types';

interface AlertsPageProps {
  warnings?: WarningItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  warnings = [],
  loading = false,
  error = null,
  onRefresh
}) => {
  // Target inputs
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedWarningId, setSelectedWarningId] = useState<string>('');

  // SMTP Service State
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusResponse | null>(null);
  const [checkingSmtp, setCheckingSmtp] = useState(true);
  const [smtpCheckError, setSmtpCheckError] = useState<string | null>(null);

  // Email dispatch execution state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<SendEmailResponse | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // WhatsApp state
  const [copied, setCopied] = useState(false);

  // Query SMTP status on mount
  const checkSmtp = async () => {
    setCheckingSmtp(true);
    setSmtpCheckError(null);
    try {
      const status = await api.getSmtpStatus();
      setSmtpStatus(status);
      if (status.from_address && !targetEmail) {
        setTargetEmail(status.from_address);
      }
    } catch (e: any) {
      setSmtpCheckError(e.message || 'Failed to verify SMTP server status');
    } finally {
      setCheckingSmtp(false);
    }
  };

  useEffect(() => {
    checkSmtp();
  }, []);

  useEffect(() => {
    if (warnings.length > 0 && !selectedWarningId) {
      setSelectedWarningId(warnings[0].id);
    }
  }, [warnings, selectedWarningId]);

  const selectedWarning = warnings.find(w => w.id === selectedWarningId) || warnings[0];

  const handleSendRealEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setEmailError('Please enter a recipient email address.');
      return;
    }
    if (!selectedWarning) {
      setEmailError('Please select a valid warning to dispatch.');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const res = await api.sendRealEmail({
        to_email: targetEmail.trim(),
        warning_id: selectedWarning.id,
        title: selectedWarning.title,
        target_hostname: selectedWarning.target_hostname || 'enterprise-host',
        source_ip: '185.220.101.5',
        risk_score: selectedWarning.risk_score,
        band: selectedWarning.band,
        recommended_action: selectedWarning.brief_summary || 'Execute perimeter IP block and deploy patch.'
      });
      setEmailSuccess(res);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to dispatch email over SMTP.');
    } finally {
      setSendingEmail(false);
    }
  };

  // WhatsApp deep-link generation
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const waMessage = selectedWarning
    ? `🚨 *SENTINEL GRID SECURITY ALERT*
━━━━━━━━━━━━━━━━━━━
• *Warning ID:* \`${selectedWarning.id}\`
• *Incident:* ${selectedWarning.title}
• *Target Asset:* \`${selectedWarning.target_hostname || 'auth-srv-01'}\`
• *Severity:* *${selectedWarning.band}* (Score: ${selectedWarning.risk_score.toFixed(1)}/100)
• *Action Required:* ${selectedWarning.brief_summary || 'Isolate host at perimeter firewall.'}
━━━━━━━━━━━━━━━━━━━
🔗 SOC Portal: http://localhost:5173`
    : `🚨 *SENTINEL GRID SECURITY ALERT* - Active telemetry monitoring enabled.`;

  const waDeepLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
            Incident Alert & Notification Dispatcher
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Emergency Incident Alert Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Dispatch verified incident advisories to on-call security teams via genuine SMTP email and direct WhatsApp Web links.
          </p>
        </div>

        {/* Live SMTP Server Status Indicator */}
        <div className="flex items-center space-x-2">
          {checkingSmtp ? (
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>Verifying SMTP...</span>
            </span>
          ) : smtpStatus?.configured ? (
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>SMTP Active ({smtpStatus.host}:{smtpStatus.port})</span>
            </span>
          ) : (
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>SMTP Unconfigured (Preview Mode)</span>
            </span>
          )}
        </div>
      </div>

      {/* Incident Selection Dropdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Select Active Threat Advisory to Alert On:
        </label>
        {warnings.length === 0 ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500">
            No active warnings available. Ingest a threat feed or run an attack simulation first.
          </div>
        ) : (
          <select
            value={selectedWarningId}
            onChange={(e) => setSelectedWarningId(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {warnings.map(w => (
              <option key={w.id} value={w.id}>
                [{w.band}] {w.id} - {w.title} ({w.target_hostname || 'auth-srv-01'}) - Score: {w.risk_score.toFixed(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Two-Column Dispatch View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Real SMTP Email Dispatch */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Email Incident Dispatch (SMTP)
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                smtpStatus?.configured
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {smtpStatus?.configured ? 'Live SMTP' : 'Preview Mode'}
              </span>
            </div>

            {!smtpStatus?.configured && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>SMTP Credentials Not Detected</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  To send genuine emails, configure <code>SMTP_USER</code> and <code>SMTP_PASSWORD</code> in <code>backend/.env</code>.
                </p>
              </div>
            )}

            {emailError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Email Dispatch Failed:</span>
                  <p className="text-[11px] mt-0.5">{emailError}</p>
                </div>
              </div>
            )}

            {emailSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Email Dispatched Successfully!</span>
                  <p className="text-[11px] mt-0.5">
                    Delivered to <strong>{emailSuccess.recipient}</strong> via <code>{emailSuccess.smtp_server}</code>.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendRealEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. your_email@gmail.com"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Email Content Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Subject:</span> [{selectedWarning?.band || 'HIGH'}] SENTINEL GRID Alert: {selectedWarning?.title}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Format:</span> HTML + Plain Text Multipart</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Target Host:</span> {selectedWarning?.target_hostname || 'auth-srv-01'}</div>
              </div>

              <button
                type="submit"
                disabled={sendingEmail || !smtpStatus?.configured}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting & Dispatching via SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Real Email via SMTP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: WhatsApp Web Direct Deep-Link */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  WhatsApp Direct Dispatch (No-API)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
                RFC 3986 wa.me Link
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Opens WhatsApp Web or mobile app with a pre-filled incident brief ready for manual send. Uses genuine universal deep-linking without requiring external third-party API accounts.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Mobile Screen Mockup */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-inner">
              <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                <span>📱 Destination: {phoneNumber}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">WhatsApp Direct</span>
              </div>
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {waMessage}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <a
              href={waDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch WhatsApp Chat</span>
            </a>
            <button
              onClick={handleCopy}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl flex items-center gap-1.5 font-bold transition-all border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
