/**
 * CloudInsight AI – AI-Powered Business Analytics
 * Production Full-Stack Application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { DataUploadView } from './components/DataUploadView';
import { AIAnalystView } from './components/AIAnalystView';
import { AnalysisHistoryView } from './components/AnalysisHistoryView';
import { SettingsView } from './components/SettingsView';
import { onAuthUserChanged, signOutUser, type User } from './lib/firebase';
import { subscribeToAnalyses } from './lib/analysisService';
import { getSampleDataset } from './data/sampleDataset';
import type { Dataset, InteractionSession } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Dataset (defaults to sample enterprise dataset for immediate rich preview)
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(() => getSampleDataset());

  // Firestore Saved Analyses
  const [sessions, setSessions] = useState<InteractionSession[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to User's Firestore Analyses when authenticated
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    setSyncStatus('saving');
    const unsubscribe = subscribeToAnalyses(
      user.uid,
      (loadedSessions) => {
        setSessions(loadedSessions);
        setSyncStatus('synced');
        setSyncError(null);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setSyncStatus('error');
        setSyncError(error.message || 'Failed to sync with Firestore');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Load sample dataset
  const handleLoadSampleDataset = useCallback(() => {
    const sample = getSampleDataset();
    setActiveDataset(sample);
  }, []);

  // Clear dataset
  const handleClearDataset = useCallback(() => {
    setActiveDataset(null);
  }, []);

  // Sign out handler
  const handleSignOut = async () => {
    await signOutUser();
  };

  // Switch to Analyst tab when a saved session is opened
  const handleSelectHistorySession = (session: InteractionSession) => {
    setActiveTab('analyst');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600 tracking-wide">
            Initializing CloudInsight AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeDataset={activeDataset}
        syncStatus={syncStatus}
        onSignOut={handleSignOut}
        onRetrySync={() => setSyncStatus('synced')}
        onSwitchToUpload={() => setActiveTab('upload')}
      />

      {/* Unauthenticated Landing Page */}
      {!user ? (
        <main className="flex-1">
          <LandingPage onSignedIn={() => setActiveTab('dashboard')} />
        </main>
      ) : (
        /* Authenticated Application Shell */
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLoadSampleData={handleLoadSampleDataset}
            activeDataset={activeDataset}
            onSignOut={handleSignOut}
          />

          {/* Main Content Area */}
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0 overflow-y-auto">
            {/* Mobile Header Bar with Hamburger */}
            <div className="lg:hidden p-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <button
                id="mobile-sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium cursor-pointer"
              >
                <Menu className="w-5 h-5" />
                <span className="capitalize">{activeTab} View</span>
              </button>
              {activeDataset && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {activeDataset.rowCount} rows
                </span>
              )}
            </div>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardView
                  dataset={activeDataset}
                  onGoToUpload={() => setActiveTab('upload')}
                  onLoadSample={handleLoadSampleDataset}
                  onGoToAnalyst={() => setActiveTab('analyst')}
                />
              )}

              {activeTab === 'upload' && (
                <DataUploadView
                  currentDataset={activeDataset}
                  onDatasetLoaded={(newDataset) => {
                    setActiveDataset(newDataset);
                    setActiveTab('dashboard');
                  }}
                  onLoadSample={handleLoadSampleDataset}
                  onGoToDashboard={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'analyst' && (
                <AIAnalystView
                  dataset={activeDataset}
                  userId={user.uid}
                  onGoToUpload={() => setActiveTab('upload')}
                  onLoadSample={handleLoadSampleDataset}
                  onSavedToHistory={(newSession) => {
                    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
                  }}
                />
              )}

              {activeTab === 'history' && (
                <AnalysisHistoryView
                  sessions={sessions}
                  userId={user.uid}
                  onSelectSession={handleSelectHistorySession}
                  onGoToAnalyst={() => setActiveTab('analyst')}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={user}
                  activeDataset={activeDataset}
                  onLoadSample={handleLoadSampleDataset}
                  onClearDataset={handleClearDataset}
                  onGoToUpload={() => setActiveTab('upload')}
                  onSignOut={handleSignOut}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
