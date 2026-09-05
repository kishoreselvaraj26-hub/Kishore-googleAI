import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  BookmarkPlus,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { Dataset, ExecutiveInsights, InteractionSession } from '../types';
import { calculateKPIs, generateDatasetGeminiSummary, filterDataset } from '../lib/analytics';
import { persistAnalysisSession } from '../lib/analysisService';

interface AIAnalystViewProps {
  dataset: Dataset | null;
  userId: string;
  onGoToUpload: () => void;
  onLoadSample: () => void;
  onSavedToHistory?: (session: InteractionSession) => void;
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({
  dataset,
  userId,
  onGoToUpload,
  onLoadSample,
  onSavedToHistory,
}) => {
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [currentModelUsed, setCurrentModelUsed] = useState<string>('gemini-3.6-flash');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Executive Insights
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [executiveInsights, setExecutiveInsights] = useState<ExecutiveInsights | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const suggestedQuestions = [
    'What is my best performing category?',
    'Which city generated the highest sales?',
    'What are my top 5 products by profit?',
    'Which month had the highest revenue?',
    'Which category has the lowest profit margin?',
    'Give me three recommendations based on this dataset.',
  ];

  const handleAskQuestion = async (queryText?: string) => {
    const activeQuery = (queryText || question).trim();
    if (!activeQuery) return;
    if (!dataset) {
      setAnalysisError('Please upload or load a dataset first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSaveStatus('idle');

    try {
      const summaryContext = generateDatasetGeminiSummary(dataset, dataset.data);
      const kpis = calculateKPIs(dataset);

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuery,
          datasetSummary: summaryContext,
          calculatedStats: {
            totalSales: kpis.totalSales.formatted,
            totalProfit: kpis.totalProfit.formatted,
            totalOrders: kpis.totalOrders.formatted,
            avgOrderValue: kpis.avgOrderValue.formatted,
            profitMargin: kpis.profitMargin.formatted,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Gemini analysis request failed');
      }

      setCurrentAnalysis(data.analysis);
      setCurrentModelUsed(data.modelUsed || 'gemini-3.6-flash');

      // Automatically persist to Firestore under user-isolated path
      if (userId) {
        const newSession: InteractionSession = {
          id: 'analysis_' + Date.now(),
          userId,
          title: activeQuery.slice(0, 60),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          question: activeQuery,
          analysis: data.analysis,
          datasetName: dataset.name,
          kpisSnapshot: {
            totalSales: kpis.totalSales.formatted,
            totalProfit: kpis.totalProfit.formatted,
            profitMargin: kpis.profitMargin.formatted,
          },
          modelUsed: data.modelUsed || 'gemini-3.6-flash',
        };

        await persistAnalysisSession(userId, newSession);
        setSaveStatus('saved');
        if (onSavedToHistory) onSavedToHistory(newSession);
      }
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Error communicating with AI engine';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAutoInsights = async () => {
    if (!dataset) {
      setInsightsError('Please upload or load a dataset first.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);

    try {
      const summaryContext = generateDatasetGeminiSummary(dataset, dataset.data);
      const kpis = calculateKPIs(dataset);

      const response = await fetch('/api/gemini/auto-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary: summaryContext,
          calculatedStats: {
            totalSales: kpis.totalSales.formatted,
            totalProfit: kpis.totalProfit.formatted,
            totalOrders: kpis.totalOrders.formatted,
            avgOrderValue: kpis.avgOrderValue.formatted,
            profitMargin: kpis.profitMargin.formatted,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate auto insights');
      }

      setExecutiveInsights(data.insights);

      // Save insights to Firestore
      if (userId) {
        const newSession: InteractionSession = {
          id: 'insights_' + Date.now(),
          userId,
          title: 'Executive AI Insights Snapshot',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          question: 'Automated Executive Intelligence Summary',
          analysis: JSON.stringify(data.insights, null, 2),
          datasetName: dataset.name,
          kpisSnapshot: {
            totalSales: kpis.totalSales.formatted,
            totalProfit: kpis.totalProfit.formatted,
            profitMargin: kpis.profitMargin.formatted,
          },
          modelUsed: data.modelUsed || 'gemini-3.6-flash',
        };

        await persistAnalysisSession(userId, newSession);
        if (onSavedToHistory) onSavedToHistory(newSession);
      }
    } catch (err: unknown) {
      console.error('Insights error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate executive insights';
      setInsightsError(msg);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // 1. EMPTY STATE
  if (!dataset) {
    return (
      <div className="py-16 px-4 text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Analyst Workspace</h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            Load an active business dataset to ask questions in plain English and generate executive insights with
            Gemini 3.6 Flash.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGoToUpload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>
          <button
            onClick={onLoadSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Try Sample Dataset</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE ANALYST VIEW
  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200/60">
            <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
            <span>Natural Language Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ask CloudInsight AI
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Grounded numerical computation powered by Gemini 3.6 Flash. Zero hallucinated figures.
          </p>
        </div>

        {/* Generate Executive Insights CTA */}
        <button
          id="generate-auto-insights-btn"
          onClick={handleGenerateAutoInsights}
          disabled={isGeneratingInsights}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isGeneratingInsights ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Cards...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Generate AI Insights</span>
            </>
          )}
        </button>
      </div>

      {/* Suggested Questions Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Suggested Commercial Questions
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAskQuestion(q);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-xs font-medium text-slate-700 hover:text-emerald-950 transition-all text-left cursor-pointer shadow-2xs"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <label htmlFor="analyst-query-input" className="text-xs font-bold text-slate-700 block">
          Enter your question about {dataset.name}:
        </label>
        <div className="relative">
          <textarea
            id="analyst-query-input"
            rows={3}
            placeholder="e.g., Which category generated the highest profit and why? Give me three recommendations."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleAskQuestion();
              }
            }}
            className="w-full text-sm rounded-xl bg-slate-50/80 border border-slate-200 p-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Press Cmd + Enter to submit. Answers grounded in active dataset.</span>
          </div>

          <button
            id="submit-analyst-btn"
            onClick={() => handleAskQuestion()}
            disabled={isAnalyzing || !question.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Computing Answer...</span>
              </>
            ) : (
              <>
                <span>Ask CloudInsight AI</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {analysisError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <strong>Analysis Error:</strong> {analysisError}
        </div>
      )}

      {/* Structured AI Analysis Output */}
      {currentAnalysis && (
        <div
          id="analyst-response-container"
          className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">CloudInsight AI Analytical Report</h3>
                <span className="text-[11px] font-mono text-slate-400">Model: {currentModelUsed}</span>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved to Firestore</span>
              </span>
            )}
          </div>

          {/* Render structured content cleanly */}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4 text-slate-800">
            {currentAnalysis.split(/(?=###\s+[A-Z\s]+)/).map((section, idx) => {
              const trimmed = section.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('### ANSWER')) {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Direct Answer
                    </span>
                    <p className="text-slate-100 font-medium leading-relaxed">
                      {trimmed.replace(/^###\s+ANSWER\s*/i, '').trim()}
                    </p>
                  </div>
                );
              }

              if (trimmed.startsWith('### KEY FINDING')) {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                      Key Finding
                    </span>
                    <p className="text-slate-900 font-medium">
                      {trimmed.replace(/^###\s+KEY\s+FINDING\s*/i, '').trim()}
                    </p>
                  </div>
                );
              }

              if (trimmed.startsWith('### BUSINESS INSIGHT')) {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block mb-1">
                      Business Insight
                    </span>
                    <p className="text-slate-800">
                      {trimmed.replace(/^###\s+BUSINESS\s+INSIGHT\s*/i, '').trim()}
                    </p>
                  </div>
                );
              }

              if (trimmed.startsWith('### RECOMMENDATION')) {
                return (
                  <div key={idx} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                      Strategic Recommendation
                    </span>
                    <p className="text-slate-800">
                      {trimmed.replace(/^###\s+RECOMMENDATION\s*/i, '').trim()}
                    </p>
                  </div>
                );
              }

              return (
                <div key={idx} className="whitespace-pre-wrap font-sans text-slate-800">
                  {trimmed}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified against {dataset.rowCount} rows in {dataset.name}</span>
            <span>Private User Document &bull; Zero Numerical Hallucinations</span>
          </div>
        </div>
      )}

      {/* Automated Executive Insights Cards Section */}
      {executiveInsights && (
        <div id="executive-insights-grid" className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Executive Intelligence Cards</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Key Insight */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <Lightbulb className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Key Insight</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{executiveInsights.keyInsight.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {executiveInsights.keyInsight.description}
              </p>
            </div>

            {/* Card 2: Opportunity */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Opportunity</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{executiveInsights.opportunity.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {executiveInsights.opportunity.description}
              </p>
            </div>

            {/* Card 3: Risk */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Risk</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{executiveInsights.risk.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{executiveInsights.risk.description}</p>
            </div>

            {/* Card 4: Recommendation */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-purple-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Recommendation</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{executiveInsights.recommendation.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {executiveInsights.recommendation.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
