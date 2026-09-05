import React, { useState } from 'react';
import {
  TrendingUp,
  UploadCloud,
  LineChart,
  BrainCircuit,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onSignedIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignedIn }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onSignedIn();
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please verify popup permissions.';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: UploadCloud,
      title: 'Upload Business Data',
      description: 'Upload your CSV or Excel spreadsheets securely with automatic schema detection and data cleaning.',
    },
    {
      icon: LineChart,
      title: 'Explore KPIs & Trends',
      description: 'Instantly calculate total revenue, profit margins, average order values, and interactive multi-dimensional visual charts.',
    },
    {
      icon: BrainCircuit,
      title: 'Ask Questions in Natural Language',
      description: 'Ask business questions like "What is my best performing category?" and receive precise, mathematically grounded answers.',
    },
    {
      icon: Sparkles,
      title: 'Get AI-Powered Insights',
      description: 'Automated executive insights highlighting top growth opportunities, performance bottlenecks, and strategic risks.',
    },
    {
      icon: Lock,
      title: 'Keep Your Analysis Private',
      description: 'Your uploaded datasets and queries remain strictly isolated to your authenticated account using Cloud Firestore security rules.',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Banner / Hero Heading */}
      <div className="text-center pt-4 sm:pt-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold mb-6 tracking-wide shadow-xs">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          CloudInsight AI &bull; AI-Powered Business Analytics
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Turn business data into intelligent decisions with Gemini.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Upload spreadsheets, calculate core operational KPIs, generate interactive visual trends,
          and ask complex commercial questions in natural language with enterprise AI precision.
        </p>

        {/* Auth Error Banner */}
        {authError && (
          <div
            id="auth-error-banner"
            className="mt-6 max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 text-left"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="google-signin-btn"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-base shadow-sm shadow-emerald-900/20 transition-all hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Security & Authentication Notice */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure Google OAuth &bull; Private Per-User Firestore Partitioning</span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all hover:border-emerald-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
            </div>
          );
        })}

        {/* Enterprise Architecture Feature Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xs md:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mb-4 border border-slate-700">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Modern Analytics SaaS</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Built for data analysts and business leaders. Combines deterministic computational logic
            with Gemini 3.6 Flash reasoning for zero numerical hallucinations.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>&copy; {new Date().getFullYear()} CloudInsight AI &bull; AI-Powered Business Analytics</span>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Firebase Authentication</span>
          <span>&bull;</span>
          <span>Cloud Firestore</span>
          <span>&bull;</span>
          <span>Gemini 3.6 Flash</span>
          <span>&bull;</span>
          <span>Google Cloud Run</span>
        </div>
      </div>
    </div>
  );
};
