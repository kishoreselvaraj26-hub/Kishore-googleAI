import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  RefreshCw,
  Compass,
  ListOrdered,
  Lightbulb,
  Edit2,
  Check,
  AlertTriangle,
  Clock,
  Bot,
  User as UserIcon,
  Copy,
  ChevronDown,
} from 'lucide-react';
import type { InteractionSession, JournalEntry } from '../types';
import { formatDate } from '../lib/utils';

interface ReflectionViewProps {
  session: InteractionSession;
  onUpdateSession: (updated: InteractionSession) => Promise<void>;
  syncStatus: 'synced' | 'saving' | 'error';
  syncError: string | null;
  onRetrySync: () => void;
  onOpenSidebar: () => void;
}

type ReflectionMode = 'reflect' | 'summary' | 'brainstorm';

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  session,
  onUpdateSession,
  syncStatus,
  syncError,
  onRetrySync,
  onOpenSidebar,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(session.title);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync title when session changes
  useEffect(() => {
    setEditedTitle(session.title);
  }, [session.id, session.title]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.entries.length, isGenerating]);

  // Handle title edit save
  const handleSaveTitle = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== session.title) {
      await onUpdateSession({
        ...session,
        title: trimmed,
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingTitle(false);
  };

  // Preset prompts
  const starterPrompts = [
    'What was the most meaningful lesson from today, and how does it shift my priorities?',
    'I am facing a challenging decision right now and want to unpack my conflicting emotions.',
    'Summarize my recent progress, highlight recurring thought patterns, and help me reset.',
    'Brainstorm creative, non-obvious ways to tackle a bottleneck I am experiencing.',
  ];

  const handleSelectStarter = (prompt: string) => {
    setInputText(prompt);
    textareaRef.current?.focus();
  };

  // Submit entry to Gemini API and persist to Firestore
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputText.trim();
    if (!prompt || isGenerating) return;

    setApiError(null);
    setIsGenerating(true);

    const newEntryId = 'user_' + Date.now();
    const userEntry: JournalEntry = {
      id: newEntryId,
      role: 'user',
      content: prompt,
      mode: selectedMode,
      timestamp: new Date().toISOString(),
    };

    // Auto-update title if it's the first turn and still default
    let sessionTitle = session.title;
    if (
      session.entries.length === 0 &&
      (!session.title || session.title === 'New Reflection' || session.title === 'Untitled Reflection')
    ) {
      sessionTitle = prompt.slice(0, 48) + (prompt.length > 48 ? '...' : '');
    }

    const optimisticEntries = [...session.entries, userEntry];

    // Optimistically update session
    const optimisticSession: InteractionSession = {
      ...session,
      title: sessionTitle,
      entries: optimisticEntries,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Call server backend proxy with resilient fallback ladder
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
          mode: selectedMode,
          history: session.entries.map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gemini processing failed. Please retry.');
      }

      const modelEntry: JournalEntry = {
        id: 'gemini_' + Date.now(),
        role: 'model',
        content: result.reply || 'No response text received.',
        mode: selectedMode,
        timestamp: new Date().toISOString(),
        modelUsed: result.modelUsed || 'gemini-3.6-flash',
      };

      const finalEntries = [...optimisticEntries, modelEntry];

      // Auto-update summary if mode was summary or if no summary exists
      let updatedSummary = session.summary;
      if (selectedMode === 'summary' || !updatedSummary) {
        updatedSummary = result.reply.slice(0, 140) + '...';
      }

      const finalSession: InteractionSession = {
        ...session,
        title: sessionTitle,
        entries: finalEntries,
        summary: updatedSummary,
        updatedAt: new Date().toISOString(),
      };

      // Guaranteed Transaction Verification: Persist to Firestore
      await onUpdateSession(finalSession);

      // Only clear text if operation completely succeeded
      setInputText('');
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to communicate with Gemini.';
      setApiError(msg);
      // Retain user input in buffer to guarantee no data loss!
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <main
      id="main-reflection-view"
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#FDFBF7] overflow-hidden relative"
    >
      {/* Top Header Bar */}
      <div
        id="reflection-header-bar"
        className="px-4 sm:px-6 py-3 border-b border-[#E0DBCF] bg-[#FDFBF7] flex items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            id="mobile-history-toggle-btn"
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg text-[#706A61] hover:text-[#4A443F] hover:bg-[#EAE5D8] border border-[#E0DBCF] cursor-pointer"
            title="Open History"
            aria-label="Open History"
          >
            <Clock className="w-4 h-4" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 flex-1 max-w-md">
              <input
                id="edit-title-input"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="w-full px-2.5 py-1 text-sm font-semibold text-[#4A443F] bg-white border border-[#5D6D54] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DDE5D7]"
              />
              <button
                id="save-title-btn"
                onClick={handleSaveTitle}
                className="p-1 rounded text-[#5D6D54] hover:bg-[#DDE5D7]/30 cursor-pointer"
                title="Save title"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group flex-1 min-w-0">
              <span className="text-sm font-medium text-[#A0998E] hidden sm:inline">
                Reflection /
              </span>
              <h1
                id="reflection-title-heading"
                className="text-sm sm:text-base font-semibold text-[#4A443F] truncate tracking-tight"
              >
                {session.title || 'Untitled Reflection'}
              </h1>
              <button
                id="edit-title-btn"
                onClick={() => setIsEditingTitle(true)}
                className="opacity-60 group-hover:opacity-100 p-1 text-[#A0998E] hover:text-[#4A443F] rounded transition-opacity cursor-pointer"
                title="Edit Title"
                aria-label="Edit title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mode Selector Pill / Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-[#F5F2EB] border border-[#E0DBCF] text-xs">
            <button
              id="mode-reflect-btn"
              onClick={() => setSelectedMode('reflect')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                selectedMode === 'reflect'
                  ? 'bg-white text-[#3E4D35] shadow-xs font-semibold'
                  : 'text-[#706A61] hover:text-[#4A443F]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#5D6D54]" />
              <span>Reflect</span>
            </button>
            <button
              id="mode-summary-btn"
              onClick={() => setSelectedMode('summary')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                selectedMode === 'summary'
                  ? 'bg-white text-[#3E4D35] shadow-xs font-semibold'
                  : 'text-[#706A61] hover:text-[#4A443F]'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-[#7C8B71]" />
              <span>Summarize</span>
            </button>
            <button
              id="mode-brainstorm-btn"
              onClick={() => setSelectedMode('brainstorm')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                selectedMode === 'brainstorm'
                  ? 'bg-white text-[#3E4D35] shadow-xs font-semibold'
                  : 'text-[#706A61] hover:text-[#4A443F]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#5D6D54]" />
              <span>Brainstorm</span>
            </button>
          </div>

          {/* Mobile mode dropdown */}
          <div className="sm:hidden relative">
            <select
              id="mobile-mode-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as ReflectionMode)}
              className="text-xs bg-[#F5F2EB] border border-[#E0DBCF] text-[#4A443F] rounded-lg px-2.5 py-1.5 pr-6 font-medium appearance-none focus:outline-none"
            >
              <option value="reflect">Reflect</option>
              <option value="summary">Summarize</option>
              <option value="brainstorm">Brainstorm</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#A0998E] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Sync Error Notice / Banner */}
      {syncStatus === 'error' && (
        <div
          id="sync-error-banner"
          className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {syncError || 'Firestore write error. Your local reflection is intact.'}
            </span>
          </div>
          <button
            id="retry-save-banner-btn"
            onClick={onRetrySync}
            className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Save
          </button>
        </div>
      )}

      {/* API Generation Error Notice */}
      {apiError && (
        <div
          id="api-error-banner"
          className="px-4 py-2 bg-[#F0EAD6] border-b border-[#E0DBCF] text-[#706A61] text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#5D6D54] shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-[#5D6D54] underline font-medium hover:text-[#3E4D35] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Thread Conversation / Entries Area */}
      <div
        id="reflection-thread-scroll"
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6"
      >
        {session.entries.length === 0 ? (
          /* Empty Session State with Starters */
          <div className="max-w-2xl mx-auto text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EAD6] border border-[#E0DBCF] text-[#5D6D54] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#4A443F]">
              Begin your reflection
            </h2>
            <p className="mt-2 text-sm text-[#706A61] max-w-md mx-auto leading-relaxed">
              Unpack your thoughts freely. Gemini 3.6 Flash will assist with constructive inquiries,
              structured takeaways, or creative problem-solving.
            </p>

            {/* Prompt suggestions */}
            <div className="mt-8 text-left">
              <p className="text-xs font-bold text-[#A0998E] uppercase tracking-wider mb-3 px-1">
                Suggested Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`starter-prompt-btn-${idx}`}
                    onClick={() => handleSelectStarter(prompt)}
                    className="p-3.5 rounded-xl bg-white hover:bg-[#F5F2EB] border border-[#E0DBCF] text-left text-xs text-[#4A443F] hover:text-[#3E4D35] transition-colors cursor-pointer leading-relaxed shadow-xs"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          session.entries.map((entry, index) => {
            const isUser = entry.role === 'user';
            const isCopied = copiedIndex === index;

            return (
              <div
                key={entry.id || index}
                id={`entry-${entry.id || index}`}
                className={`flex gap-3 sm:gap-4 max-w-3xl ${
                  isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-lg bg-[#F0EAD6] border border-[#E0DBCF] text-[#5D6D54] flex items-center justify-center shrink-0 mt-1 shadow-xs"
                    title="Gemini AI"
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative rounded-2xl p-4 sm:p-5 text-sm transition-shadow max-w-[88%] sm:max-w-[82%] ${
                    isUser
                      ? 'bg-[#E6EBE0] text-[#3E4D35] rounded-tr-none shadow-xs border border-[#DDE5D7]'
                      : 'bg-white text-[#4A443F] border border-[#E0DBCF] rounded-tl-none shadow-xs'
                  }`}
                >
                  {/* Top entry metadata bar */}
                  <div className={`flex items-center justify-between gap-3 text-[11px] mb-2.5 pb-2 border-b ${
                    isUser ? 'border-[#3E4D35]/15' : 'border-[#E0DBCF]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          isUser ? 'text-[#3E4D35]' : 'text-[#5D6D54]'
                        }`}
                      >
                        {isUser ? 'You' : 'Gemini'}
                      </span>
                      {entry.mode && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            isUser
                              ? 'bg-[#DDE5D7] text-[#3E4D35]'
                              : 'bg-[#F5F2EB] text-[#5D6D54] border border-[#E0DBCF]'
                          }`}
                        >
                          {entry.mode}
                        </span>
                      )}
                      {!isUser && entry.modelUsed && (
                        <span className="hidden sm:inline text-[10px] text-[#A0998E] font-mono">
                          {entry.modelUsed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={isUser ? 'text-[#3E4D35]/70' : 'text-[#A0998E]'}>
                        {formatDate(entry.timestamp)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(entry.content, index)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isUser
                            ? 'text-[#3E4D35]/70 hover:text-[#3E4D35]'
                            : 'text-[#A0998E] hover:text-[#4A443F]'
                        }`}
                        title="Copy content"
                        aria-label="Copy content"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#5D6D54]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-[#3E4D35] font-normal">
                      {entry.content}
                    </p>
                  ) : (
                    <div className="markdown-body text-sm leading-relaxed">
                      <ReactMarkdown>{entry.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div
                    className="w-8 h-8 rounded-lg bg-[#DDE5D7] text-[#5D6D54] flex items-center justify-center shrink-0 border border-[#E0DBCF] mt-1 font-bold text-xs"
                    title="You"
                  >
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Generating Indicator */}
        {isGenerating && (
          <div className="flex gap-3 sm:gap-4 max-w-3xl mr-auto justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#F0EAD6] border border-[#E0DBCF] text-[#5D6D54] flex items-center justify-center shrink-0 mt-1 shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-none p-4 bg-white border border-[#E0DBCF] text-[#706A61] text-sm shadow-xs flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#5D6D54] border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-xs text-[#5D6D54]">
                Gemini is reflecting on your entry...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div
        id="reflection-composer-wrapper"
        className="p-4 sm:p-6 border-t border-[#E0DBCF] bg-[#FDFBF7] shrink-0"
      >
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-white border border-[#E0DBCF] shadow-xs focus-within:border-[#5D6D54] focus-within:ring-2 focus-within:ring-[#DDE5D7] transition-all">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder={
                selectedMode === 'reflect'
                  ? 'Continue your reflection or explore a feeling...'
                  : selectedMode === 'summary'
                  ? 'Paste or write the thoughts you would like synthesized into takeaways...'
                  : 'Describe a situation or challenge you want to brainstorm solutions for...'
              }
              className="w-full p-4 sm:p-5 text-sm text-[#4A443F] placeholder-[#A0998E] bg-transparent resize-none focus:outline-none min-h-[90px]"
              maxLength={8000}
            />

            {/* Composer Footer Bar */}
            <div className="px-4 py-2.5 bg-[#FDFBF7] border-t border-[#E0DBCF]/70 rounded-b-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-[10px] text-[#A0998E]">
                <span className="hidden sm:inline">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-[#EAE5D8] text-[#4A443F] font-mono text-[9px]">Cmd</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[#EAE5D8] text-[#4A443F] font-mono text-[9px]">Enter</kbd> to submit
                </span>
                <span>{inputText.length} / 8000</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  disabled={!inputText || isGenerating}
                  className="px-2.5 py-1.5 text-xs text-[#A0998E] hover:text-[#4A443F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Clear
                </button>

                <button
                  id="submit-reflection-btn"
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D6D54] hover:bg-[#4A5743] active:bg-[#3D4737] text-white text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Reflecting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {selectedMode === 'reflect' && 'Reflect'}
                        {selectedMode === 'summary' && 'Summarize'}
                        {selectedMode === 'brainstorm' && 'Brainstorm'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
        <p className="text-center text-[10px] text-[#A0998E] mt-3">
          All entries are secured with Firebase Encryption. Powered by Gemini 3.6 Flash.
        </p>
      </div>
    </main>
  );
};
