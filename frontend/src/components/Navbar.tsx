import React, { useState, useEffect } from 'react';
import {
  RefreshCw, BookOpen, ExternalLink, ShieldCheck,
  Sun, Moon, Search, Bell, User, Sparkles, UploadCloud, LogOut, Check
} from 'lucide-react';
import { OverviewData, UserProfile } from '../types';

interface NavbarProps {
  currentPageTitle: string;
  overview: OverviewData | null;
  onReset: () => void;
  onOpenGuide: () => void;
  onOpenUpload?: () => void;
  resetting: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPageTitle,
  overview,
  onReset,
  onOpenGuide,
  onOpenUpload,
  resetting,
  theme = 'light',
  onToggleTheme,
  currentUser,
  onLogout
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'SO';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [justReset, setJustReset] = useState(false);
  const [wasResetting, setWasResetting] = useState(false);

  useEffect(() => {
    if (wasResetting && !resetting) {
      setJustReset(true);
      const timer = setTimeout(() => setJustReset(false), 2500);
      return () => clearTimeout(timer);
    }
    setWasResetting(resetting);
  }, [resetting]);
  return (
    <header className="h-16 bg-white dark:bg-[#080C14] border-b border-slate-200 dark:border-slate-800/90 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200 z-20">
      {/* Left: Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
          {currentPageTitle}
        </h2>
      </div>

      {/* Right: Global Actions, Telemetry, and User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Threat Feeds Status Pill (Shown on 2xl screens) */}
        <div className="hidden 2xl:flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-3 py-1.5 rounded-full text-[11px] font-mono whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Feeds:</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">NVD • KEV • EPSS</span>
        </div>

        {/* Upload CSV Ingest Button (Desktop) */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            title="Upload CSV Threat Intelligence or Asset Dataset"
            className="hidden xl:flex px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Upload CSV</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Guide Button */}
        <button
          onClick={onOpenGuide}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={onReset}
          disabled={resetting}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border whitespace-nowrap shrink-0 ${
            justReset
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          {resetting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span className="hidden md:inline">Resetting...</span>
            </>
          ) : justReset ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Reset ✓</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Reset Demo</span>
            </>
          )}
        </button>

        {/* Active Session Card */}
        <div className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {getInitials(currentUser?.full_name)}
          </div>
          <div className="hidden lg:block text-left whitespace-nowrap">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
              {currentUser?.full_name || 'SecOps Analyst'}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold block leading-tight">
              {currentUser?.role || 'SECOPS_ANALYST'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out of Session"
              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
