import React, { useState } from 'react';
import {
  X, UploadCloud, FileText, CheckCircle2, AlertTriangle,
  Database, RefreshCw, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { api } from '../api';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvPreview = (text: string) => {
    setPreviewContent(text);
    const lines = text.trim().split('\n');
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim();
        });
        return obj;
      });
      setPreviewRows(rows);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      setSuccessResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCsvPreview(text);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleThreats = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessResult(null);
    try {
      const content = await api.getSampleCsv('threats');
      setSelectedFile(null);
      parseCsvPreview(content);
    } catch (e: any) {
      setErrorMsg('Failed to load sample threats CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleAssets = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessResult(null);
    try {
      const content = await api.getSampleCsv('assets');
      setSelectedFile(null);
      parseCsvPreview(content);
    } catch (e: any) {
      setErrorMsg('Failed to load sample assets CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!selectedFile && !previewContent) {
      setErrorMsg('Please select a CSV file or load a sample first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadCsv(selectedFile || undefined, previewContent);
      setSuccessResult(res);
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Ingestion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 transition-all text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Upload Threat Intelligence or Asset Inventory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live CSV ingestion with version matching and multi-factor scoring
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Samples or File Dropzone */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select CSV File or Load Live Sample:
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleLoadSampleThreats}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-[11px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-all"
              >
                <Zap className="w-3 h-3" />
                Sample Threats (8 CVEs)
              </button>
              <button
                onClick={handleLoadSampleAssets}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-all"
              >
                <Database className="w-3 h-3" />
                Sample Assets (8 Hosts)
              </button>
            </div>
          </div>

          {/* Upload Drop Area */}
          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition-colors group">
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 transition-colors mb-2" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {selectedFile ? selectedFile.name : 'Click to browse or drop CSV here'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              Supports Threat Advisories (`cve_id, title, product...`) or Asset Inventory (`hostname, product, version...`)
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Live Preview of Rows */}
        {previewRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Parsed Data Preview:
              </span>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                Ready for Live Ingestion
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-40 text-[11px] font-mono">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    {Object.keys(previewRows[0]).map(h => (
                      <th key={h} className="pb-1 pr-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                      {Object.values(row).map((v: any, idx) => (
                        <td key={idx} className="py-1 pr-3 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Live Ingestion Succeeded!</strong>
              <p className="text-[11px] mt-0.5">
                Ingested {successResult.threats_added || 0} threats and {successResult.assets_added || 0} assets. Automatically matched and generated {successResult.warnings_generated || 0} active early warnings!
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleIngest}
            disabled={loading || (!selectedFile && !previewContent)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Ingesting & Matching...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Ingest & Run Live Matching Engine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

