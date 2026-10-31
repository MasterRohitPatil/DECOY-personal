import React, { useState } from 'react';
import {
  Server, Search, Filter, ShieldCheck, AlertCircle, CheckCircle,
  UploadCloud, RefreshCw, AlertTriangle, X
} from 'lucide-react';
import { AssetItem } from '../types';

interface AssetsPageProps {
  assets: AssetItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenUpload?: () => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  assets,
  loading = false,
  error = null,
  onRefresh,
  onOpenUpload
}) => {
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
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Import CMDB / CSV</span>
            </button>
          )}

          <span className="text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Total Assets: <strong className="text-cyan-600 dark:text-cyan-400">{assets.length}</strong>
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Diagnostic:</strong> {error}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hostname, product, vendor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* Table & Empty States */}
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
              {loading ? (
                // LOADING SKELETON (6 rows)
                [1, 2, 3, 4, 5, 6].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center space-y-3">
                    <Server className="w-10 h-10 text-slate-400 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {assets.length === 0 ? 'No Monitored Assets Found' : 'No Assets Match Criteria'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {assets.length === 0
                        ? 'Your enterprise inventory is empty. Ingest a ServiceNow, AWS, or custom CMDB CSV dataset.'
                        : `No assets matched "${searchTerm}" in ${envFilter} tier. Try clearing your search or switching environment filter.`}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      {searchTerm || envFilter !== 'ALL' ? (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setEnvFilter('ALL');
                          }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                        >
                          Clear Filters
                        </button>
                      ) : onOpenUpload ? (
                        <button
                          onClick={onOpenUpload}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                          Upload CMDB CSV
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
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
                          ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                          : a.environment === 'STAGE'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {a.environment}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 w-max ${
                        a.exposure_status === 'CONFIRMED_EXPOSED'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : a.exposure_status === 'LIKELY_EXPOSED'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          a.exposure_status === 'CONFIRMED_EXPOSED' ? 'bg-red-500' : a.exposure_status === 'LIKELY_EXPOSED' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        {a.exposure_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {'★'.repeat(a.criticality)}{'☆'.repeat(Math.max(0, 5 - a.criticality))}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">({a.criticality}/5)</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{a.owner}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
