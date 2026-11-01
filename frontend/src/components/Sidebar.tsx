import React from 'react';
import {
  LayoutDashboard, ShieldAlert, Flame, Server,
  Bell, Database, ChevronRight, ChevronLeft,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  criticalCount: number;
  unreadAlerts: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  criticalCount,
  unreadAlerts,
  isCollapsed,
  onToggleCollapse
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
      badgeColor: ''
    },
    {
      id: 'warnings',
      label: 'Early Warning Hub',
      icon: ShieldAlert,
      badge: criticalCount > 0 ? `${criticalCount}` : undefined,
      badgeColor: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
    },
    {
      id: 'attack-lab',
      label: 'Attack Lab & Kill Chain',
      icon: Flame,
      badge: 'Live',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
    },
    {
      id: 'assets',
      label: 'Asset Inventory',
      icon: Server,
      badge: undefined,
      badgeColor: ''
    },
    {
      id: 'alerts',
      label: 'Incident Alert Center',
      icon: Bell,
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
    },
    {
      id: 'audit',
      label: 'Cryptographic Audit Trail',
      icon: ShieldCheck,
      badge: undefined,
      badgeColor: ''
    }
  ];

  return (
    <aside
      className={`bg-white dark:bg-[#080C14] border-r border-slate-200 dark:border-slate-800/90 flex flex-col justify-between shrink-0 select-none transition-all duration-300 relative shadow-[1px_0_4px_rgba(0,0,0,0.02)] z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className={`border-b border-slate-100 dark:border-slate-800/80 flex items-center transition-all ${
          isCollapsed ? 'flex-col gap-2 p-3 justify-center' : 'p-4 justify-between'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-white truncate">
                  SENTINEL GRID
                </h1>
                <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono tracking-tight truncate font-semibold">
                  National Early Warning
                </p>
              </div>
            )}
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-all shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>D3COY 1.0 PS 01</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE SOC
            </span>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className={`space-y-1.5 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3 py-1.5 block">
              Navigation
            </span>
          )}
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onNavigate(item.id)}
                  aria-label={item.label}
                  className={`transition-all relative flex items-center ${
                    isCollapsed
                      ? 'w-12 h-12 mx-auto justify-center rounded-xl'
                      : 'w-full px-3 py-2.5 rounded-xl justify-between'
                  } ${
                    isActive
                      ? isCollapsed
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/70 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {/* Left Edge Active Indicator Bar in Narrow State */}
                  {isCollapsed && isActive && (
                    <span className="absolute -left-2 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-600 dark:bg-cyan-400"></span>
                  )}

                  {/* Centered Icon */}
                  <Icon
                    className={`shrink-0 transition-colors ${
                      isCollapsed
                        ? 'w-5 h-5 ' + (isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white')
                        : 'w-4 h-4 ' + (isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200')
                    }`}
                  />

                  {/* Text Label when Expanded */}
                  {!isCollapsed && (
                    <span className="truncate text-left text-xs font-medium flex-1 ml-3">
                      {item.label}
                    </span>
                  )}

                  {/* Full Badge when Expanded */}
                  {!isCollapsed && item.badge && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Small Dot Badge when Collapsed */}
                  {isCollapsed && item.badge && !isActive && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#080C14]"></span>
                  )}
                </button>

                {/* Hover Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 flex items-center gap-2 border border-slate-700/60 drop-shadow-md">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        item.badge === 'Live' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {/* Left-pointing arrow caret */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      {isCollapsed ? (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-center group relative">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-mono font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 border border-slate-700/60">
            PostgreSQL: Connected
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800"></div>
          </div>
        </div>
      ) : (
        <div className="p-3 m-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Connected</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Deterministic matching engine • Zero LLM hallucination
          </p>
        </div>
      )}
    </aside>
  );
};
