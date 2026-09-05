import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BrainCircuit,
  History,
  Settings,
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import type { Dataset } from '../types';

export type NavigationTab = 'dashboard' | 'upload' | 'analyst' | 'history' | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onLoadSampleData: () => void;
  activeDataset: Dataset | null;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onLoadSampleData,
  activeDataset,
  onSignOut,
}) => {
  const navItems: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Data Upload', icon: UploadCloud, badge: activeDataset ? `${activeDataset.rowCount} rows` : undefined },
    { id: 'analyst', label: 'AI Analyst', icon: BrainCircuit },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action: Try Sample Dataset */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              id="sidebar-sample-btn"
              onClick={() => {
                onLoadSampleData();
                onSelectTab('dashboard');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="block font-semibold">Try Sample Dataset</span>
                <span className="block text-[10px] text-slate-400">Enterprise Sales Data</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom card & signout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Cloud technology alignment badge */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>GCP AI Architecture</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Gemini 3.6 Flash &bull; Cloud Firestore &bull; Google Cloud Run
            </p>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
