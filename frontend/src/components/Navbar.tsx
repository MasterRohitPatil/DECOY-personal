import React from 'react';
import {
  RefreshCw, BookOpen, ExternalLink, ShieldCheck,
  Sun, Moon, Search, Bell, User, Sparkles, UploadCloud
} from 'lucide-react';
import { OverviewData } from '../types';

interface NavbarProps {
  currentPageTitle: string;
  overview: OverviewData | null;
  onReset: () => void;
  onOpenGuide: () => void;
  onOpenUpload?: () => void;
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
  resetting,
  theme = 'light',
  onToggleTheme
}) => {
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

        {/* Global Search Bar */}
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

        {/* Active Session Indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            SA
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
              SecOps Analyst
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block leading-tight">
              Active Session
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
