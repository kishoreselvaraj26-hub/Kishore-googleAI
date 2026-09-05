import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { InteractionSession } from '../types';
import { removeAnalysisSession } from '../lib/analysisService';

interface AnalysisHistoryViewProps {
  sessions: InteractionSession[];
  userId: string;
  onSelectSession: (session: InteractionSession) => void;
  onGoToAnalyst: () => void;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  sessions,
  userId,
  onSelectSession,
  onGoToAnalyst,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InteractionSession | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const q = (s.question || s.title || '').toLowerCase();
    const a = (s.analysis || '').toLowerCase();
    const d = (s.datasetName || '').toLowerCase();
    return q.includes(term) || a.includes(term) || d.includes(term);
  });

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved analysis?')) return;

    setDeletingId(sessionId);
    try {
      await removeAnalysisSession(userId, sessionId);
      if (selectedItem?.id === sessionId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analysis History &amp; Saved Insights
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse and review your past questions, verified KPIs, and AI recommendations saved in Cloud Firestore.
          </p>
        </div>

        <button
          onClick={onGoToAnalyst}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New AI Analysis</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search past questions, datasets, or answers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs rounded-xl bg-white border border-slate-200 pl-9 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600 shadow-2xs"
        />
      </div>

      {/* Grid: Master list on left, Details on right (or stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: History Items */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Saved Sessions ({filteredSessions.length})
          </span>

          {filteredSessions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No analysis history found</p>
              <p className="text-slate-400 mt-1">
                {searchTerm ? 'No sessions match your search filter.' : 'Ask questions in the AI Analyst to save insights here.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = selectedItem?.id === session.id;
              const dateFormatted = new Date(session.updatedAt || session.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedItem(session)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 line-clamp-2">
                      {session.question || session.title}
                    </span>
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      disabled={deletingId === session.id}
                      title="Delete saved analysis"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[120px] font-mono text-[10px]">
                      {session.datasetName || 'Dataset'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{dateFormatted}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mb-2 border border-emerald-200/60">
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Dataset: {selectedItem.datasetName || 'Active Dataset'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedItem.question || selectedItem.title}
                  </h2>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Recorded on {new Date(selectedItem.createdAt).toLocaleString()} &bull; Model:{' '}
                    {selectedItem.modelUsed || 'gemini-3.6-flash'}
                  </span>
                </div>

                <button
                  onClick={() => onSelectSession(selectedItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors"
                >
                  <span>Open in Analyst</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Snapshot metrics if available */}
              {selectedItem.kpisSnapshot && Object.keys(selectedItem.kpisSnapshot).length > 0 && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {Object.entries(selectedItem.kpisSnapshot).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Analysis Text Body */}
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedItem.analysis}
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BrainCircuit className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select an analysis from the list</p>
              <p className="text-xs text-slate-400 mt-1">View the complete breakdown, key findings, and recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
