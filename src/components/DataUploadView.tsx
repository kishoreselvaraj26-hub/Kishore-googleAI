import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Table,
  Tag,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { parseCSVFile, parseExcelFile } from '../lib/analytics';
import type { Dataset } from '../types';

interface DataUploadViewProps {
  currentDataset: Dataset | null;
  onDatasetLoaded: (dataset: Dataset) => void;
  onLoadSample: () => void;
  onGoToDashboard: () => void;
}

export const DataUploadView: React.FC<DataUploadViewProps> = ({
  currentDataset,
  onDatasetLoaded,
  onLoadSample,
  onGoToDashboard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!file) {
        throw new Error('No file selected.');
      }

      // Check file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds the 25MB threshold. Please upload a smaller slice or compressed file.');
      }

      if (file.size === 0) {
        throw new Error('The selected file is empty (0 bytes). Please select a valid spreadsheet.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: Dataset;

      if (ext === 'csv') {
        parsed = await parseCSVFile(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        parsed = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file extension. Please upload a .csv or .xlsx / .xls file.');
      }

      onDatasetLoaded(parsed);
      setPreviewPage(0);
    } catch (err: unknown) {
      console.error('File parsing error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to process file.';
      setError(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const PAGE_SIZE = 10;
  const previewRows = currentDataset ? currentDataset.data.slice(0, 10) : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Data Upload & Schema Validation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload your CSV or Excel spreadsheets to calculate KPIs and unlock natural-language Gemini analytics.
          </p>
        </div>

        {/* Quick Sample Button */}
        <button
          id="upload-sample-btn"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Try Sample Enterprise Dataset</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div
          id="upload-error-alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">File Validation Failed</span>
            <span className="text-xs text-rose-700">{error}</span>
          </div>
        </div>
      )}

      {/* Dropzone Container */}
      <div
        id="data-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50/60'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
          {isProcessing ? (
            <div className="w-6 h-6 border-3 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {isProcessing ? 'Processing & Validating Spreadsheet...' : 'Upload Business Dataset'}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-4">
          Drag and drop your file here, or click to browse. Supports <strong className="text-slate-700">CSV</strong> and{' '}
          <strong className="text-slate-700">Excel (.xlsx, .xls)</strong> formats up to 25MB.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>Automatic schema detection &bull; Instant local parsing</span>
        </div>
      </div>

      {/* Dataset Details & Schema (If loaded) */}
      {currentDataset && (
        <div className="space-y-6">
          {/* Confirmation Banner */}
          <div
            id="dataset-confirmation-badge"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">Dataset successfully loaded</span>
                <span className="text-xs text-emerald-700 font-mono">
                  {currentDataset.name} &bull; {currentDataset.rowCount.toLocaleString()} records &bull;{' '}
                  {currentDataset.columnCount} columns
                </span>
              </div>
            </div>

            <button
              id="proceed-dashboard-btn"
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dataset Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Total Records</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {currentDataset.rowCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Rows available for analysis</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Identified Columns</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{currentDataset.columnCount}</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Categorical, numeric & date headers</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Business Roles Detected</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                {currentDataset.columns.filter((c) => c.role !== 'unknown').length} / {currentDataset.columnCount}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Mapped to sales, profit, city, etc.</span>
            </div>
          </div>

          {/* Detected Schema & Column Roles Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Detected Schema & Business Column Roles</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Automatic role categorization</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Detected Role</th>
                    <th className="py-3 px-4 hidden md:table-cell">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentDataset.columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{col.name}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            col.type === 'numeric'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : col.type === 'date'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {col.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            col.role === 'sales' || col.role === 'profit'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : col.role === 'category' || col.role === 'product'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : col.role === 'city' || col.role === 'date'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {col.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px] hidden md:table-cell truncate max-w-xs">
                        {col.sampleValues.join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Preview Table (First 10 Rows) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Dataset Preview (First 10 Rows)</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Showing rows 1 - {previewRows.length}</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-slate-400">#</th>
                    {currentDataset.columns.map((col, i) => (
                      <th key={i} className="py-2.5 px-3 border-r border-slate-200 font-mono whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 border-r border-slate-100 text-center text-slate-400 font-mono">
                        {rowIdx + 1}
                      </td>
                      {currentDataset.columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className="py-2 px-3 border-r border-slate-100 whitespace-nowrap font-mono text-slate-700"
                        >
                          {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
