import React, { useState } from 'react';
import {
  Bell, MessageSquare, Mail, ExternalLink, Copy,
  Check, ShieldAlert, Radio, Clock, ShieldCheck, Key,
  Send, Phone, User, CheckCircle2, Lock, AlertTriangle, X
} from 'lucide-react';
import { api } from '../api';
import { WarningItem } from '../types';

interface AlertsPageProps {
  warnings?: WarningItem[];
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ warnings = [] }) => {
  // Target credentials
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [targetEmail, setTargetEmail] = useState('ciso-alert@infra.gov.in');
  const [selectedWarningId, setSelectedWarningId] = useState(warnings[0]?.id || 'W-2026-001');
  const [incidentTitle, setIncidentTitle] = useState('Critical XZ Utils RCE on Public Auth Gateway');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH'>('CRITICAL');

  // OTP Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [previewOtp, setPreviewOtp] = useState('739201');
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Dispatch Result State
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync title when warning selected
  const handleSelectWarning = (wId: string) => {
    setSelectedWarningId(wId);
    const found = warnings.find(w => w.id === wId);
    if (found) {
      setIncidentTitle(found.title);
      setSeverity(found.band === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
    }
  };

  const handleOpenOtpModal = async () => {
    setOtpError(null);
    setOtpCode('');
    setIsOtpModalOpen(true);
    try {
      const res = await api.requestAlertOtp();
      if (res.preview_otp_for_hackathon) {
        setPreviewOtp(res.preview_otp_for_hackathon);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyAndDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpLoading(true);

    try {
      // 1. Verify OTP with backend
      const verifyRes = await api.verifyAlertOtp(otpCode.trim());
      setAuthToken(verifyRes.token);

      // 2. Dispatch Emergency Alert to WhatsApp & Email
      const dispatchRes = await api.dispatchEmergencyAlert({
        phone: phoneNumber.trim(),
        email: targetEmail.trim(),
        warning_id: selectedWarningId,
        title: incidentTitle,
        risk_score: severity === 'CRITICAL' ? 93.4 : 82.0,
        auth_token: verifyRes.token
      });

      setDispatchResult(dispatchRes);
      setIsOtpModalOpen(false);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid 6-digit OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAutofillOtp = () => {
    setOtpCode(previewOtp);
  };

  const defaultWaMessage = `🚨 *SENTINEL GRID SECURITY ALERT*
━━━━━━━━━━━━━━━━━━━
• *Warning ID:* \`${selectedWarningId}\`
• *Incident:* ${incidentTitle}
• *Target Asset:* \`auth-srv-01.prod.sentinel\`
• *Severity Band:* *${severity}* (Risk Score: 93.4/100)
• *Authorized By:* Rohit Patil (Senior Analyst)
• *Action Required:* Execute immediate perimeter firewall drop & revoke tokens.
━━━━━━━━━━━━━━━━━━━
🔗 Review in SOC: http://localhost:5173`;

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const activeWaLink = dispatchResult?.whatsapp?.deep_link ||
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWaMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultWaMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
            Multi-Channel Incident Dispatcher
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Emergency Alert Center & 2FA Paging
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Authorize and broadcast encrypted incident warnings directly to specified on-call phone numbers (WhatsApp) and emails, safeguarded by Gmail 2FA/OTP authentication.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            2FA Gateway: Armed
          </span>
        </div>
      </div>

      {/* Dispatch Configuration Form & Target Inputs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
          <Send className="w-4 h-4 text-blue-600" />
          <span>Configure Emergency Alert Broadcast</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient WhatsApp Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Include country code (e.g. +91, +1)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="ciso@infra.gov.in"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Official SecOps or CISO inbox</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Threat / Incident
            </label>
            <select
              value={selectedWarningId}
              onChange={(e) => handleSelectWarning(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {warnings.length > 0 ? (
                warnings.map(w => (
                  <option key={w.id} value={w.id}>[{w.band}] {w.id} - {w.title.slice(0, 24)}...</option>
                ))
              ) : (
                <option value="W-2026-001">[CRITICAL] W-2026-001 - XZ Utils RCE</option>
              )}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Pulls live telemetry from warning</p>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleOpenOtpModal}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Authenticate & Dispatch</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">Requires 2FA Gmail OTP</p>
          </div>
        </div>

        {dispatchResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Broadcast Dispatched Successfully!
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Dispatched to WhatsApp ({phoneNumber}) & Email ({targetEmail}) with authorized cryptographic token.
                </p>
              </div>
            </div>

            <a
              href={activeWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 shadow-xs transition-colors self-start md:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch WhatsApp Chat</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Channel Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                WhatsApp Emergency Dispatch Preview
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
              RFC 3986 wa.me Link
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Targeting phone number <span className="font-bold text-slate-900 dark:text-white font-mono">{phoneNumber}</span>. Clicking the dispatch link opens WhatsApp Web or mobile app with the pre-filled emergency briefing.
          </p>

          {/* Mobile Screen Mockup */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
              <span>📱 Recipient: {phoneNumber}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">SecOps Emergency</span>
            </div>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-slate-800 dark:text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-xs">
              {defaultWaMessage}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <a
              href={activeWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in WhatsApp ({phoneNumber})</span>
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

        {/* Email Dispatch Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Official CISO Email Dispatch
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
              Gov-SMTP TLS 1.3
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Targeting executive inbox <span className="font-bold text-slate-900 dark:text-white font-mono">{targetEmail}</span>. Generates standardized CISO Executive Threat Summaries ready for distribution.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner space-y-3 font-mono text-xs">
            <div className="space-y-1 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div><span className="font-bold">To:</span> {targetEmail}</div>
              <div><span className="font-bold">From:</span> secops-alerts@sentinelgrid.gov.in</div>
              <div><span className="font-bold">Subject:</span> [URGENT] {severity} National Threat Advisory: {selectedWarningId}</div>
            </div>

            <div className="text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-red-600 dark:text-red-400">
                ⚠️ CRITICAL INFRASTRUCTURE EXPOSURE DETECTED
              </p>
              <p>
                An automated telemetry spike has triggered Section 3.4 Early Warning Rule R1 & R2. Remote execution vulnerability identified on production gateway.
              </p>
              <div className="p-2 bg-slate-200/50 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-800 text-[11px]">
                <div>• Hostname: auth-srv-01.prod.sentinel</div>
                <div>• Priority Score: 93.4 / 100 (CRITICAL)</div>
                <div>• Containment: WAF rule staged & pending approval</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`mailto:${targetEmail}?subject=${encodeURIComponent(`[URGENT] Sentinel Grid Threat Alert: ${selectedWarningId}`)}&body=${encodeURIComponent(defaultWaMessage)}`}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Launch Desktop Email Client (mailto)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Gmail OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  SecOps 2FA Authorization Required
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  High-consequence National Early Warning Dispatch
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 mb-4 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold">
                <Mail className="w-4 h-4" />
                <span>Dispatched to authorized Gmail:</span>
              </div>
              <p className="font-mono pl-5">rohit.lead@sentinelgrid.gov.in</p>
            </div>

            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs flex items-center justify-between mb-4 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Live Hackathon OTP Code:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{previewOtp}</span>
                <button
                  type="button"
                  onClick={handleAutofillOtp}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
                >
                  Autofill
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyAndDispatch} className="space-y-4">
              {otpError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 739201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length < 6}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center space-x-1.5"
                >
                  {otpLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
