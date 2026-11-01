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
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'attack-lab',
      label: 'Attack Lab & Kill Chain',
      icon: Flame,
      badge: 'Live',
      badgeColor: 'bg-amber-500 text-white'
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
      badgeColor: 'bg-emerald-500 text-white'
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
      className={`bg-white dark:bg-[#080C14] border-r border-slate-200 dark:border-slate-800/90 flex flex-col justify-between shrink-0 select-none transition-all duration-300 relative shadow-[1px_0_4px_rgba(0,0,0,0.02)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
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
        <nav className="p-3 space-y-1">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3 py-1.5 block">
              Navigation
            </span>
          )}
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all group relative ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  isActive
                    ? 'bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/70 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-left text-xs font-medium">
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {/* Badge indicator when collapsed */}
                {isCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-1">
            <span>Database</span>
            <span className="text-blue-600 dark:text-cyan-400 font-bold">Supabase Postgres</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight">
            Deterministic version matching with zero hallucination.
          </p>
        </div>
      )}
    </aside>
  );
};
