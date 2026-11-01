import React, { useState, useEffect } from 'react';
import {
  Bell, MessageSquare, Mail, ExternalLink, Copy,
  Check, ShieldAlert, Radio, Clock, ShieldCheck,
  Send, Phone, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  FileText, Download, Paperclip, Users, Info, Shield
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
  // On-Call multi-analyst phone numbers
  const [primaryPhone, setPrimaryPhone] = useState('+91 98765 43210');
  const [secondaryPhone, setSecondaryPhone] = useState('+91 91234 56789');
  
  // Target email
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
  const [batchLaunched, setBatchLaunched] = useState(false);

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
  const activeSourceIp = selectedWarning?.source_ip || '185.220.101.5';
  const activeProductSpec = selectedWarning?.product
    ? `${selectedWarning.product}${selectedWarning.version ? ` ${selectedWarning.version}` : ''}`
    : 'Enterprise Service';

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
        source_ip: activeSourceIp,
        risk_score: selectedWarning.risk_score,
        band: selectedWarning.band,
        recommended_action:
          selectedWarning.brief_summary ||
          `Execute 3-Pillar Playbook on ${selectedWarning.target_hostname}: Patch ${activeProductSpec}, Block ${activeSourceIp} (Rule R7), and Verify forensic logs.`
      });
      setEmailSuccess(res);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to dispatch email over SMTP.');
    } finally {
      setSendingEmail(false);
    }
  };

  // WhatsApp deep-link generation
  const cleanPrimary = primaryPhone.replace(/[^0-9]/g, '');
  const cleanSecondary = secondaryPhone.replace(/[^0-9]/g, '');
  
  const cveId = selectedWarning
    ? (selectedWarning.cve_id || selectedWarning.id.match(/CVE-\d{4}-\d+/i)?.[0] || selectedWarning.title.match(/CVE-\d{4}-\d+/i)?.[0] || selectedWarning.id)
    : 'CVE-2021-44228';

  const pdfDownloadUrl = selectedWarning
    ? api.getWarningPdfUrl(selectedWarning.id)
    : 'http://localhost:8000/api/warnings/W-INCIDENT/pdf';

  const waMessage = selectedWarning
    ? `🚨 *SENTINEL GRID SECURITY ALERT*
━━━━━━━━━━━━━━━━━━━
• *Advisory / CVE:* \`${cveId}\`
• *Incident:* ${selectedWarning.title}
• *Target Asset:* \`${selectedWarning.target_hostname || 'auth-srv-01'}\` (${selectedWarning.environment || 'PROD'})
• *Software Spec:* \`${activeProductSpec}\`
• *Attacker IOC:* \`${activeSourceIp}\`
• *Severity:* *${selectedWarning.band}* (Score: ${selectedWarning.risk_score.toFixed(1)}/100)
• *3-Pillar Action:* ${selectedWarning.brief_summary || 'Patch package, Block IOC at perimeter (Rule R7), and Audit host.'}
━━━━━━━━━━━━━━━━━━━
📄 *Download PDF Dossier:* ${pdfDownloadUrl}
🔗 *SOC Portal:* http://localhost:5173/warnings`
    : `🚨 *SENTINEL GRID SECURITY ALERT* - Active telemetry monitoring enabled.`;

  const primaryWaLink = cleanPrimary
    ? `https://wa.me/${cleanPrimary}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const secondaryWaLink = cleanSecondary
    ? `https://wa.me/${cleanSecondary}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchBoth = () => {
    setBatchLaunched(true);
    if (cleanPrimary) {
      window.open(primaryWaLink, '_blank');
    }
    if (cleanSecondary) {
      setTimeout(() => {
        window.open(secondaryWaLink, '_blank');
      }, 400);
    }
    setTimeout(() => setBatchLaunched(false), 3000);
  };

  if (loading && warnings.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 animate-pulse">
        <div className="bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-28"></div>
        <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 h-20"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-80"></div>
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-80"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full min-w-0 transition-colors duration-200">
      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Sync Diagnostic:</strong> {error}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* SMTP Check Diagnostic Error */}
      {smtpCheckError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>SMTP Notice:</strong> {smtpCheckError}</span>
          </div>
          <button
            onClick={checkSmtp}
            className="px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[11px] font-bold hover:bg-amber-300"
          >
            Retry Check
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
            Multi-Channel Incident Dispatcher
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Emergency Incident Alert Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Dispatch verified incident advisories with attached cryptographic PDF reports via SMTP email and direct WhatsApp links to primary and secondary on-call contacts.
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

      {/* Incident Selection Dropdown + Download PDF Toolbar */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Select Active Threat Advisory to Alert On:
          </label>
          {selectedWarning && (
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-all shadow-2xs self-start sm:self-auto"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Download Executive Report (PDF)</span>
            </a>
          )}
        </div>

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
        
        {/* Column 1: Real SMTP Email Dispatch with Attached PDF */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Email Incident Dispatch (SMTP + PDF)
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
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email Dispatched with Cryptographic PDF Report!</span>
                </div>
                <p className="text-[11px]">
                  Delivered to <strong>{emailSuccess.recipient}</strong> via <code>{emailSuccess.smtp_server}</code>.
                </p>
                {emailSuccess.pdf_attached && (
                  <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Report Attached: <strong>SENTINEL_GRID_{selectedWarning?.id}.pdf</strong></span>
                  </div>
                )}
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
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Subject:</span> [{selectedWarning?.band || 'HIGH'}] SENTINEL GRID Alert: {selectedWarning?.title}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Target Host:</span> {selectedWarning?.target_hostname || 'auth-srv-01'} ({activeProductSpec})</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-200">Attacker IOC:</span> {activeSourceIp} • CVE: {cveId}</div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-sans font-semibold text-[11px]">
                  <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Auto-Attached: <code>SENTINEL_GRID_{selectedWarning?.id || 'INCIDENT'}.pdf</code> (Includes 3-Pillar Playbook)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingEmail || !smtpStatus?.configured}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating PDF & Dispatching via SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Incident Email with Attached PDF</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: WhatsApp Multi-Analyst Dispatch */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  WhatsApp Direct Dispatch (On-Call Multi-Target)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
                1 or 2 On-Call Contacts
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pre-fills the incident advisory and official PDF download URL for designated on-call security contacts.
            </p>

            {/* Multi-Number Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Primary On-Call Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Secondary On-Call Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="+91 91234 56789"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Message Preview Mockup */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-inner">
              <div className="flex justify-between items-center text-[10.5px] text-slate-500 pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-2">
                <span>📱 Targets: {primaryPhone || 'None'}{secondaryPhone ? `, ${secondaryPhone}` : ''}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">WhatsApp Payload</span>
              </div>
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-mono text-[10.5px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {waMessage}
              </div>
            </div>
          </div>

          {/* Action Buttons for WhatsApp */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={primaryWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Open Primary ({primaryPhone || 'Unset'})</span>
              </a>

              <a
                href={secondaryWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Open Secondary ({secondaryPhone || 'Unset'})</span>
              </a>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDispatchBoth}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Users className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>{batchLaunched ? 'Dispatching Both...' : 'Dispatch Alert to Both Numbers'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl flex items-center gap-1.5 font-bold transition-all border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Automation & Security Policy Callout Card */}
      <div className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white">
              WhatsApp Automated Delivery Architecture: Universal Web vs Meta Cloud API
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>1. Browser-Based Delivery (No-API mode):</strong> When clicking &quot;Open WhatsApp&quot;, the system formats the incident advisory and report download URL into RFC 3986 deep links. Meta&apos;s browser sandbox strictly requires the operator to tap the green &quot;Send&quot; arrow to prevent unauthorized web-borne spam.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>2. 100% Zero-Intervention Headless Delivery:</strong> To dispatch messages to 1 or 2 numbers completely automatically without opening WhatsApp Web or requiring manual clicks, the system supports Meta&apos;s <code>WhatsApp Business Cloud API</code> (requires an approved Meta Business Account token and registered template). Both architectures are designed into SENTINEL GRID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
