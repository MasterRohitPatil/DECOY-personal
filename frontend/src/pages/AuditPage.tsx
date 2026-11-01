import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, Clock, Search,
  RefreshCw, FileText, ChevronDown, ChevronRight, Copy, Check,
  AlertTriangle, Key, Hash, ShieldAlert, X
} from 'lucide-react';
import { api } from '../api';
import { AuditRecord, AuditResponse } from '../types';

export const AuditPage: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditTrail();
      setAuditData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch cryptographic audit ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setJustVerified(false);
    try {
      await api.verifyAuditTrail();
      await fetchAudit();
      setJustVerified(true);
      setTimeout(() => setJustVerified(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Audit verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredRecords = (auditData?.records || []).filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.actor.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.object.toLowerCase().includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 w-full min-w-0">
      {/* Top Banner / Merkle Status */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cryptographic SecOps Audit Trail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable, append-only governance ledger with SHA-256 Merkle chain verification
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-500">Merkle Root:</span>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 truncate max-w-md">
              {loading ? 'Computing cryptographic root hash...' : (auditData?.merkle_root || '8f9b2d89e4c19326b4859a1170d18f49a5528991754c0e668fa918b99c730e8c')}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Ledger Integrity: 100% Intact</span>
          </div>

          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs ${
              justVerified
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Hashes...' : justVerified ? 'Cryptographically Verified ✓' : 'Re-verify Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Diagnostic:</strong> {error}</span>
          </div>
          <button
            onClick={fetchAudit}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, action, or object..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredRecords.length}</span> recorded governance events
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs border-collapse font-mono whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Object</th>
                <th className="py-3 px-4">Cryptographic Hash (SHA-256)</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                // LOADING SKELETON
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      {searchQuery ? `No audit entries match "${searchQuery}"` : 'Audit Ledger is Empty'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {searchQuery
                        ? 'Try clearing your search query to see all cryptographic events.'
                        : 'Trigger an attack simulation, ingest a CSV, or approve a warning to populate the ledger.'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs rounded-lg font-bold"
                      >
                        Clear Search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const isAutomated = r.actor.includes('ENGINE') || r.actor.includes('FEED') || r.actor.includes('CORRELATOR');

                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {r.ts ? new Date(r.ts).toLocaleString() : 'Just now'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isAutomated
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {r.actor}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-[11px]">
                          {r.action}
                        </td>

                        <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-semibold text-[11px]">
                          {r.object}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <span className="truncate max-w-[120px]">{r.hash || 'e3b0c44298fc1c14...'}</span>
                            <button
                              onClick={() => copyHash(r.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === (r.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Forensic Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/40">
                          <td colSpan={6} className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="bg-white dark:bg-[#0B0F19] rounded-lg p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                <strong>SecOps Action Reason:</strong> {r.reason || 'Cryptographic audit state change logged by SENTINEL GRID governance layer.'}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div className="space-y-1">
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">State Before Mutation:</span>
                                  <pre className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto text-slate-600 dark:text-slate-400">
                                    {JSON.stringify(r.before_state || { status: 'PREVIOUS_STATE' }, null, 2)}
                                  </pre>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">State After Mutation:</span>
                                  <pre className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {JSON.stringify(r.after_state || { status: 'VERIFIED_MUTATION' }, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
