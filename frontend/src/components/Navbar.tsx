import React, { useState } from 'react';
import {
  RefreshCw, BookOpen, ExternalLink, ShieldCheck,
  Sun, Moon, Search, Bell, User, Sparkles, UploadCloud,
  MessageSquare, ChevronDown, Check, UserCheck
} from 'lucide-react';
import { OverviewData } from '../types';

interface NavbarProps {
  currentPageTitle: string;
  overview: OverviewData | null;
  onReset: () => void;
  onOpenGuide: () => void;
  onOpenUpload?: () => void;
  onOpenSocChat?: () => void;
  currentRole: 'Senior Analyst' | 'Junior Analyst';
  onSwitchRole: (role: 'Senior Analyst' | 'Junior Analyst') => void;
  resetting: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPageTitle,
  overview,
  onReset,
  onOpenGuide,
  onOpenUpload,
  onOpenSocChat,
  currentRole,
  onSwitchRole,
  resetting,
  theme = 'light',
  onToggleTheme
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200">
      {/* Left: Page Title & Search Bar */}
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {currentPageTitle}
            <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-medium">D3COY 1.0 PS 01</span>
          </h2>
        </div>

        {/* Global Search Bar (From Image 1) */}
        <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-72 text-xs text-slate-500 dark:text-slate-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Search className="w-3.5 h-3.5 mr-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search threats, assets, or CVE..."
            className="bg-transparent border-none outline-none w-full text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs"
          />
        </div>
      </div>

      {/* Right: Global Telemetry, Theme Toggle & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Threat Feeds Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Feeds:</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">NVD, CISA KEV, EPSS</span>
        </div>

        {/* Upload CSV Ingest Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>
        )}

        {/* Theme Toggle Button (Light/Dark) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-slate-700">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-amber-300">Light</span>
            </>
          )}
        </button>

        {/* SOC Chat Button */}
        {onOpenSocChat && (
          <button
            onClick={onOpenSocChat}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs relative"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">SOC Chat</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </button>
        )}

        {/* Guide Button */}
        <button
          onClick={onOpenGuide}
          className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800/80 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={onReset}
          disabled={resetting}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-cyan-500' : ''}`} />
          <span className="hidden md:inline">{resetting ? 'Resetting...' : 'Reset'}</span>
        </button>

        {/* Notification Bell with Badge */}
        <div
          onClick={onOpenSocChat}
          title="Open Incident Notifications & Chat"
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
        </div>

        {/* User Persona & Role Switcher */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className={`w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs ${
              currentRole === 'Senior Analyst'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                : 'bg-gradient-to-tr from-teal-600 to-emerald-600'
            }`}>
              {currentRole === 'Senior Analyst' ? 'RP' : 'AZ'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                {currentRole === 'Senior Analyst' ? 'Rohit Patil' : 'Alice Zhang'}
              </span>
              <span className={`text-[10px] font-semibold block leading-tight ${
                currentRole === 'Senior Analyst' ? 'text-purple-600 dark:text-purple-400' : 'text-teal-600 dark:text-teal-400'
              }`}>
                {currentRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Role Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                Switch Operational Persona
              </div>
              <button
                onClick={() => {
                  onSwitchRole('Senior Analyst');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  currentRole === 'Senior Analyst'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold">Senior Analyst (Lead)</div>
                  <div className="text-[10px] text-slate-400">Supervise 3 juniors, share code, broadcast alerts</div>
                </div>
                {currentRole === 'Senior Analyst' && <Check className="w-4 h-4 text-purple-600" />}
              </button>

              <button
                onClick={() => {
                  onSwitchRole('Junior Analyst');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  currentRole === 'Junior Analyst'
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold">Junior Analyst (Triage)</div>
                  <div className="text-[10px] text-slate-400">Review assigned CVEs, execute verified rules</div>
                </div>
                {currentRole === 'Junior Analyst' && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
