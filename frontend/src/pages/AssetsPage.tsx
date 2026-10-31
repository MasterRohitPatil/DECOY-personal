import React, { useState } from 'react';
import { Server, Search, Filter, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { AssetItem } from '../types';

interface AssetsPageProps {
  assets: AssetItem[];
}

export const AssetsPage: React.FC<AssetsPageProps> = ({ assets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');

  const filtered = assets.filter(a => {
    const matchesSearch =
      a.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = envFilter === 'ALL' || a.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            Enterprise Infrastructure
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Monitored Asset Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Complete registry of physical servers, ingress gateways, and database clusters mapped against national threat intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Total Assets: <strong className="text-cyan-600 dark:text-cyan-400">{assets.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hostname, product, vendor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          {['ALL', 'PROD', 'STAGE', 'DEV', 'ISOLATED'].map(env => (
            <button
              key={env}
              onClick={() => setEnvFilter(env)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                envFilter === env
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="p-4">Hostname</th>
                <th className="p-4">Software Product</th>
                <th className="p-4">Installed Version</th>
                <th className="p-4">Environment</th>
                <th className="p-4">Exposure Status</th>
                <th className="p-4">Criticality Tier</th>
                <th className="p-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{a.hostname}</span>
                  </td>
                  <td className="p-4 text-cyan-600 dark:text-cyan-300 font-bold">{a.product}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{a.version}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.environment === 'PROD'
                        ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}>
                      {a.environment} {a.internet_facing ? '(Public Internet)' : '(Internal Subnet)'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.exposure_status === 'CONFIRMED_EXPOSED'
                        ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : a.exposure_status === 'MITIGATED'
                        ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {a.exposure_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Tier {a.criticality}/5</span>
                  </td>
                  <td className="p-4 text-slate-400 dark:text-slate-500">{a.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
