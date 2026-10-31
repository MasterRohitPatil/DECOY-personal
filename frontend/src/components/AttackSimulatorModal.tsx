import React, { useState } from 'react';
import { X, ShieldAlert, Zap, Lock, Skull, Radio, Flame, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

interface AttackSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttackTriggered: (attackType: string, result: any) => void;
}

export const AttackSimulatorModal: React.FC<AttackSimulatorModalProps> = ({
  isOpen,
  onClose,
  onAttackTriggered
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  if (!isOpen) return null;

  const attacks = [
    {
      id: 'brute-force',
      title: 'SSH Auth Brute Force',
      icon: Flame,
      target: 'auth-srv-01.prod.sentinel',
      origin: '198.51.100.23',
      desc: 'Injects 18 rapid failed SSH logins within 4s. Violates threshold and triggers high-severity auth anomaly.',
      severity: 'CRITICAL',
      color: 'border-red-500/40 hover:border-red-500'
    },
    {
      id: 'dos',
      title: 'Layer 7 DoS Flood',
      icon: Zap,
      target: 'edge-proxy-01.prod.sentinel',
      origin: '203.0.113.88',
      desc: 'Simulates 120 requests/sec flooding /login endpoint. Exceeds rate limiter and threatens gateway stability.',
      severity: 'CRITICAL',
      color: 'border-amber-500/40 hover:border-amber-500'
    },
    {
      id: 'unauthorized-access',
      title: 'Unauthorized Key Probe',
      icon: Lock,
      target: 'sec-vault-01.prod.sentinel',
      origin: '192.0.2.45',
      desc: 'Attempts probe on /v1/sys/raw/keys with invalid credentials from an untrusted internal DMZ subnet.',
      severity: 'HIGH',
      color: 'border-orange-500/40 hover:border-orange-500'
    },
    {
      id: 'malicious-ip',
      title: 'C2 / abuse.ch IP Match',
      icon: Skull,
      target: 'vpn-gw-01.prod.sentinel',
      origin: '45.33.32.156',
      desc: 'Inbound connection matches active Mirai/Feodo Botnet C2 telemetry from abuse.ch threat intelligence feed.',
      severity: 'CRITICAL',
      color: 'border-red-500/40 hover:border-red-500'
    },
    {
      id: 'phishing',
      title: 'Phishing Campaign Lure',
      icon: Radio,
      target: 'web-portal-01.prod.sentinel',
      origin: '185.220.101.5',
      desc: 'Employee reports deceptive email lure redirecting users to spoofed domain paypa1-secure-auth[.]com.',
      severity: 'HIGH',
      color: 'border-yellow-500/40 hover:border-yellow-500'
    }
  ];

  const handleRunAttack = async (type: string) => {
    setLoadingType(type);
    try {
      const res = await api.triggerAttack(type);
      setLastExecuted(type);
      onAttackTriggered(type, res);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-soc-card border border-soc-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Live Attack Simulator & Telemetry Injector</h3>
              <p className="text-xs text-slate-400">Mentor Demonstration: Fire realistic attacks to verify real-time detection & alerting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {attacks.map(atk => {
            const Icon = atk.icon;
            const isLoading = loadingType === atk.id;
            const isDone = lastExecuted === atk.id;

            return (
              <div
                key={atk.id}
                className={`p-4 rounded-xl border bg-slate-950/60 transition-all ${atk.color} flex items-start justify-between gap-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm">{atk.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        atk.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {atk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{atk.desc}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-500">
                      <span>Target: <strong className="text-slate-300">{atk.target}</strong></span>
                      <span>Origin: <strong className="text-slate-300">{atk.origin}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRunAttack(atk.id)}
                  disabled={isLoading}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md ${
                    isDone
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white glow-red'
                  }`}
                >
                  {isLoading ? (
                    'Firing Attack...'
                  ) : isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Fired Again
                    </>
                  ) : (
                    'Fire Attack'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Attacks are safely simulated against isolated synthetic assets.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

