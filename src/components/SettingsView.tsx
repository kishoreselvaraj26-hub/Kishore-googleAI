import React from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Cpu,
  User,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Lock,
  Sparkles,
  Server,
} from 'lucide-react';
import type { User as FirebaseUser } from '../lib/firebase';
import type { Dataset } from '../types';

interface SettingsViewProps {
  user: FirebaseUser;
  activeDataset: Dataset | null;
  onLoadSample: () => void;
  onClearDataset: () => void;
  onGoToUpload: () => void;
  onSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  activeDataset,
  onLoadSample,
  onClearDataset,
  onGoToUpload,
  onSignOut,
}) => {
  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings &amp; Platform Architecture
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your account profile, active business datasets, and review enterprise security settings.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <User className="w-4 h-4 text-emerald-600" />
          <h3>Authenticated Account</h3>
        </div>

        <div className="flex items-center gap-4 pt-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">{user.displayName || 'Enterprise User'}</h4>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                UID: {user.uid}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Google OAuth Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Dataset Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3>Active Dataset Management</h3>
          </div>
          {activeDataset && (
            <span className="text-xs font-mono text-slate-500">{activeDataset.rowCount} rows loaded</span>
          )}
        </div>

        {activeDataset ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-sm text-slate-900 block">{activeDataset.name}</span>
              <span className="text-xs text-slate-500 block mt-0.5">
                {activeDataset.columnCount} columns detected &bull; Uploaded at{' '}
                {new Date(activeDataset.uploadTimestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onGoToUpload}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Upload Different File
              </button>
              <button
                onClick={onClearDataset}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-medium text-rose-700 transition-colors cursor-pointer"
              >
                Clear Dataset
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>No dataset is currently loaded in memory.</span>
            <button
              onClick={onLoadSample}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>
        )}
      </div>

      {/* Security Architecture Transparency */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3>Security &amp; Data Isolation Standard</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Owner-Bound Firestore Rules</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Every document path is protected with <code className="font-mono bg-slate-200 px-1 rounded">request.auth.uid == userId</code>. No cross-tenant data leaks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Client-Side API Keys</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              All Gemini 3.6 Flash calls are brokered via backend Express server routes. API secrets are never delivered to the client browser.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Cloud Run Runtime</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Fully containerized Node.js service running on port 3000 with resilient automatic scaling and Secret Manager integration.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resilient Model Fallback</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Gemini 3.6 Flash &rarr; Gemini 3.1 Flash Lite &rarr; Gemini Flash Latest fallback ladder guarantees 99.9% analytical uptime.
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out CTA */}
      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of CloudInsight AI</span>
        </button>
      </div>
    </div>
  );
};
