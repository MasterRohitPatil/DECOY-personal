import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Lock, Mail, User, Building, ArrowRight,
  CheckCircle2, AlertCircle, Sparkles, Loader2, KeyRound,
  ShieldCheck, Sun, Moon
} from 'lucide-react';
import { api, authStorage } from '../api';
import { UserProfile, DemoAccountInfo } from '../types';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  theme = 'light',
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'login' | 'register'>('demo');
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountInfo[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('SECOPS_ANALYST');
  const [regOrg, setRegOrg] = useState('National Cyber Coordination Centre (NCCC)');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Load demo accounts from live backend on mount
  useEffect(() => {
    let isMounted = true;
    api.getDemoAccounts()
      .then(accounts => {
        if (isMounted) setDemoAccounts(accounts);
      })
      .catch(() => {
        // Fallback local representation if offline
        if (isMounted) {
          setDemoAccounts([
            {
              email: 'ciso@sentinelgrid.gov.in',
              password: 'Sentinel@2026!',
              full_name: 'Dr. Arvind Rao',
              role: 'CISO_ADMIN',
              role_label: 'CISO / System Administrator',
              organization: 'National Cyber Security Coordinator',
              description: 'Full administrative authority to execute automated patch playbooks.'
            },
            {
              email: 'analyst@sentinelgrid.gov.in',
              password: 'Sentinel@2026!',
              full_name: 'Vikram Malhotra',
              role: 'SECOPS_ANALYST',
              role_label: 'SecOps Lead Analyst',
              organization: 'CERT-In Sectoral Triage',
              description: 'Operational threat triage, exposure correlation, and alerting.'
            },
            {
              email: 'researcher@sentinelgrid.gov.in',
              password: 'Sentinel@2026!',
              full_name: 'Ananya Deshmukh',
              role: 'THREAT_RESEARCHER',
              role_label: 'Threat Intelligence Researcher',
              organization: 'Critical Tech Defense Labs',
              description: 'CVE feed monitoring, EPSS score modeling, and intelligence verification.'
            }
          ]);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Quick 1-click login for demo accounts
  const handleQuickDemoLogin = async (acc: DemoAccountInfo) => {
    setLoadingDemo(true);
    setLoginError(null);
    try {
      const res = await api.login({
        email: acc.email,
        password: acc.password
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Demo authentication failed.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.login({
        email: loginEmail,
        password: loginPassword
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) {
      setRegError('Please provide your full name, email, and password.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setRegLoading(true);
    setRegError(null);
    try {
      const res = await api.register({
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        role: regRole,
        organization: regOrg
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">SENTINEL GRID</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-bold">
                D3COY 1.0 PS 01
              </span>
            </div>
            <p className="text-[11px] text-slate-400">National Cyber Threat Early Warning & Exposure Matching</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all text-xs flex items-center gap-1.5"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero Hallucination Pipeline</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-5xl mx-auto w-full">
        {/* Minimal Pitch Headline */}
        <div className="text-center max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Deterministic Intelligence Correlation Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            AI-Powered National Threat Early Warning & Exposure Matching
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            Matches real-world threat feeds against actual infrastructure inventory to compute SEXVI risk scores with verifiable cryptographic audit trails.
          </p>
        </div>

        {/* Authentication Container */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('demo'); setLoginError(null); setRegError(null); }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-cyan-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Judge Demo Access</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setLoginError(null); setRegError(null); }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setLoginError(null); setRegError(null); }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* TAB 1: Judge Demo Quick Access (Pre-Seeded Accounts) */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Select a pre-seeded evaluation persona:</span>
                <span className="font-mono text-[11px] text-cyan-400">PostgreSQL Seeded</span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-3">
                {demoAccounts.map(acc => (
                  <div
                    key={acc.email}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-950 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {acc.full_name}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          acc.role === 'CISO_ADMIN'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : acc.role === 'SECOPS_ANALYST'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {acc.role_label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{acc.email}</p>
                      <p className="text-[11px] text-slate-500">{acc.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={loadingDemo}
                      onClick={() => handleQuickDemoLogin(acc)}
                      className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-black font-bold text-xs border border-cyan-500/40 hover:border-cyan-500 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      {loadingDemo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter as {acc.role === 'CISO_ADMIN' ? 'CISO' : 'Analyst'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-500">
                  Password for all demo accounts: <code className="text-cyan-400 font-mono font-bold">Sentinel@2026!</code>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Real Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="analyst@sentinelgrid.gov.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('demo')}
                  className="text-xs text-cyan-400 hover:underline font-medium"
                >
                  Need quick judge demo access? Click here
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Real Sign Up */}
          {activeTab === 'register' && (
            <form onSubmit={handleManualRegister} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Dr. Rajesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="rajesh@cert-in.org.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECOPS_ANALYST">SecOps Analyst</option>
                    <option value="CISO_ADMIN">CISO / System Admin</option>
                    <option value="THREAT_RESEARCHER">Threat Researcher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization</label>
                  <input
                    type="text"
                    value={regOrg}
                    onChange={e => setRegOrg(e.target.value)}
                    placeholder="NCCC / CERT-In"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Registering Account in Postgres...</span>
                  </>
                ) : (
                  <>
                    <span>Create Real Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 max-w-7xl w-full mx-auto text-center text-xs text-slate-500 font-mono">
        SENTINEL GRID • D3COY 1.0 Problem Statement 01 • Built with Real Bcrypt + JWT + Supabase PostgreSQL
      </footer>
    </div>
  );
};
