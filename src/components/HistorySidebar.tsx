import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import type { InteractionSession } from '../types';
import { formatDate, makeExcerpt } from '../lib/utils';

interface HistorySidebarProps {
  sessions: InteractionSession[];
  activeSessionId: string | null;
  onSelectSession: (session: InteractionSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = s.title.toLowerCase().includes(query);
    const matchesSummary = s.summary ? s.summary.toLowerCase().includes(query) : false;
    const matchesEntries = s.entries.some((e) => e.content.toLowerCase().includes(query));
    return matchesTitle || matchesSummary || matchesEntries;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    try {
      setDeletingId(id);
      await onDeleteSession(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#4A443F]/20 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="history-sidebar"
        className={`fixed lg:static top-16 bottom-0 left-0 w-80 sm:w-96 bg-[#F5F2EB] border-r border-[#E0DBCF] z-40 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with New Reflection Button */}
        <div className="p-4 border-b border-[#E0DBCF] bg-[#F5F2EB] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5D6D54]" />
              <h2 className="text-xs font-bold text-[#A0998E] uppercase tracking-wider">
                Past Reflections
              </h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-[#A0998E] hover:text-[#4A443F] rounded-md cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            id="new-reflection-btn"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5D6D54] hover:bg-[#4A5743] active:bg-[#3D4737] text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#A0998E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past reflections..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/70 border border-[#E0DBCF] text-xs text-[#4A443F] placeholder-[#A0998E] focus:outline-none focus:ring-2 focus:ring-[#DDE5D7] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0998E] hover:text-[#4A443F] text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-[#A0998E]">
              <Sparkles className="w-8 h-8 text-[#A0998E]/50 mx-auto mb-2" />
              <p className="text-xs font-medium">
                {searchQuery ? 'No matching reflections found.' : 'No reflections saved yet.'}
              </p>
              <p className="text-[11px] text-[#A0998E] mt-1">
                {searchQuery
                  ? 'Try adjusting your search keywords.'
                  : 'Start your first journal entry to begin your archive.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isConfirming = confirmDeleteId === session.id;
              const isDeleting = deletingId === session.id;

              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/70 border-[#E0DBCF] shadow-sm'
                      : 'border-transparent hover:bg-[#EAE5D8] hover:border-[#E0DBCF]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-semibold line-clamp-1 ${
                        isActive ? 'text-[#3E4D35]' : 'text-[#4A443F]'
                      }`}
                    >
                      {session.title || 'Untitled Reflection'}
                    </h3>

                    {/* Delete Action */}
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={isDeleting}
                      title={isConfirming ? 'Click again to permanently delete' : 'Delete reflection'}
                      aria-label="Delete reflection"
                      className={`p-1 rounded-md text-xs transition-colors shrink-0 ${
                        isConfirming
                          ? 'bg-rose-100 text-rose-800 font-bold px-1.5'
                          : 'text-[#A0998E] hover:text-rose-700 opacity-60 group-hover:opacity-100'
                      }`}
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : isConfirming ? (
                        <span>Delete?</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Summary / Excerpt preview */}
                  <p className="mt-1 text-[11px] text-[#706A61] line-clamp-2 leading-relaxed">
                    {session.summary ||
                      (session.entries.length > 0
                        ? makeExcerpt(session.entries[0].content, 90)
                        : 'No entries yet')}
                  </p>

                  {/* Metadata footer */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#A0998E]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A0998E]" />
                      {formatDate(session.updatedAt || session.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-[#706A61]">
                      <MessageSquare className="w-3 h-3 text-[#A0998E]" />
                      {session.entries.length} {session.entries.length === 1 ? 'turn' : 'turns'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Counter footer */}
        <div className="p-3 border-t border-[#E0DBCF] text-center text-[10px] text-[#A0998E]">
          <span>
            {sessions.length} {sessions.length === 1 ? 'reflection' : 'reflections'} secured with Firebase Encryption
          </span>
        </div>
      </aside>
    </>
  );
};
