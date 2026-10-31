import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ShieldAlert, Zap, ChevronUp, ChevronDown, Bell } from 'lucide-react';

interface DemoPanelProps {
  onShortcut: (key: number) => void;
  onReset: () => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({ onShortcut, onReset }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 7) {
        onShortcut(num);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onShortcut]);

  const scenarios = [
    { key: 1, label: 'Overview & Telemetry', desc: '0:00 - Counters & Health Strip' },
    { key: 2, label: 'Inject Advisory (SSE)', desc: '0:20 - Animated Pipeline Stepper' },
    { key: 3, label: 'Warning Detail (82.0)', desc: '0:55 - Gauge, SEXVI & Evidence' },
    { key: 4, label: 'Escalate KEV (93.4)', desc: '1:35 - Live Pulse & Re-evaluation' },
    { key: 5, label: 'Poisoned Report Shield', desc: '1:55 - AI Prompt Injection Block' },
    { key: 6, label: 'Mentor: Attack & WhatsApp', desc: '2:15 - Brute Force + wa.me Alert' },
    { key: 7, label: 'Unmatched CVE (No Alert)', desc: '2:40 - Zero Alert Fatigue Proof' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-soc-card border border-soc-border rounded-2xl shadow-2xl overflow-hidden max-w-sm transition-all duration-300">
      {/* Panel Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-3 bg-slate-950 flex items-center justify-between cursor-pointer border-b border-slate-800"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Demo Controller (Hotkeys 1–7)
          </span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2 bg-slate-950/90 text-xs">
          <p className="text-[11px] text-slate-400 mb-2">
            Press numeric keys <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-400">1</kbd> to <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-400">7</kbd> for the 3-minute rehearsed pitch flow:
          </p>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {scenarios.map(sc => (
              <button
                key={sc.key}
                onClick={() => onShortcut(sc.key)}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-cyan-950 text-cyan-400 font-mono font-bold text-[10px] border border-cyan-800">
                      {sc.key}
                    </span>
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300">
                      {sc.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 ml-6">{sc.desc}</span>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={onReset}
              className="w-full py-2 px-3 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo State (&lt;3s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

