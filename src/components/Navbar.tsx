import React from 'react';
import {
  TrendingUp,
  Database,
  LogOut,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { User } from '../lib/firebase';
import type { Dataset } from '../types';

interface NavbarProps {
  user: User | null;
  activeDataset: Dataset | null;
  syncStatus: 'synced' | 'saving' | 'error';
  onSignOut: () => void;
  onRetrySync?: () => void;
  onSwitchToUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeDataset,
  syncStatus,
  onSignOut,
  onRetrySync,
  onSwitchToUpload,
}) => {
  return (
    <header
      id="cloudinsight-header"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-900/15"
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 leading-tight">
                CloudInsight AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Business Analytics
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 hidden md:block leading-none">
              Turn business data into intelligent decisions with Gemini.
            </span>
          </div>
        </div>

        {/* Center / Active Dataset & Cloud Sync Pill */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Dataset Badge */}
            {activeDataset ? (
              <button
                id="active-dataset-pill"
                onClick={onSwitchToUpload}
                title="Click to view or change dataset"
                className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[140px] truncate font-semibold">{activeDataset.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] text-slate-600 font-mono">
                  {activeDataset.rowCount} rows
                </span>
              </button>
            ) : (
              <button
                onClick={onSwitchToUpload}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>No Dataset Loaded</span>
              </button>
            )}

            {/* Firestore Cloud Sync Status */}
            <div
              id="sync-status-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : syncStatus === 'saving'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {syncStatus === 'synced' && 'Firestore Synced'}
                {syncStatus === 'saving' && 'Saving...'}
                {syncStatus === 'error' && 'Sync Error'}
              </span>
            </div>

            {syncStatus === 'error' && onRetrySync && (
              <button
                id="retry-sync-button"
                onClick={onRetrySync}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer"
              >
                Retry
              </button>
            )}

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden xl:block text-left text-xs leading-tight">
                <span className="font-semibold text-slate-800 block truncate max-w-[120px]">
                  {user.displayName || 'Analyst'}
                </span>
                <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <button
                id="signout-button"
                onClick={onSignOut}
                title="Sign out of CloudInsight AI"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
