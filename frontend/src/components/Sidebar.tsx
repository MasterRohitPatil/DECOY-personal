import React from 'react';
import {
  LayoutDashboard, ShieldAlert, Flame, Server,
  Bell, Database, Sparkles, ChevronRight, ChevronLeft,
  Menu, ShieldCheck, MessageSquare, Users
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  criticalCount: number;
  unreadAlerts: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSocChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  criticalCount,
  unreadAlerts,
  isCollapsed,
  onToggleCollapse,
  onOpenSocChat
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      desc: 'Overview, KPIs & telemetry'
    },
    {
      id: 'warnings',
      label: 'Early Warning Hub',
      icon: ShieldAlert,
      desc: 'Exposure matching & SEXVI',
      badge: criticalCount > 0 ? `${criticalCount}` : undefined,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'attack-lab',
      label: 'Attack Lab & Kill Chain',
      icon: Flame,
      desc: 'Breach simulator & visual impact',
      badge: 'Live',
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'assets',
      label: 'Asset Inventory',
      icon: Server,
      desc: 'Monitored enterprise hosts'
    },
    {
      id: 'alerts',
      label: 'Incident Alert Center',
      icon: Bell,
      desc: 'WhatsApp (No-API) & Email',
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 'audit',
      label: 'Cryptographic Audit Trail',
      icon: ShieldCheck,
      desc: 'Immutable SHA-256 Merkle chain'
    }
  ];

  return (
    <aside
      className={`bg-[#0B132B] dark:bg-[#070A11] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-black tracking-wider text-white truncate">SENTINEL GRID</h1>
                <p className="text-[10px] text-cyan-400 font-mono tracking-tight truncate">National Early Warning</p>
              </div>
            )}
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-all shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-cyan-400" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>D3COY 1.0 PS 01</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE SOC
            </span>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-3 py-1 block">
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
                className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center transition-all group relative ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  isActive
                    ? 'bg-blue-600 dark:bg-cyan-950/80 text-white dark:text-cyan-300 shadow-md glow-cyan border border-blue-500 dark:border-cyan-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-white dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <span className="block truncate font-bold">{item.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate group-hover:text-slate-300 font-normal">
                        {item.desc}
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${item.badgeColor}`}>
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
          {/* SOC Chat & Team Collaboration Shortcut */}
          {onOpenSocChat && (
            <div className="pt-2 px-1">
              <button
                onClick={onOpenSocChat}
                title="Open SOC Collaboration Chat & Team"
                className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center transition-all bg-gradient-to-r from-blue-900/60 to-purple-900/60 hover:from-blue-800 hover:to-purple-800 border border-blue-500/40 text-blue-200 shadow-xs ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <span className="block truncate font-bold text-white">SOC Team Chat</span>
                      <span className="text-[10px] text-cyan-300 block truncate font-normal">#general & 1-on-1 DMs</span>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                    Live
                  </span>
                )}
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>Database</span>
            <span className="text-cyan-400 font-bold">Supabase Postgres</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Deterministic version matching with zero hallucination.
          </p>
        </div>
      )}
    </aside>
  );
};
