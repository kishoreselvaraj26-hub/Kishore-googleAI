import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

/**
 * Lazy initialization of GoogleGenAI client
 */
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Resilient Content Generation with automated fallback ladder and error recovery
 */
async function generateContentWithFallback(params: {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  systemInstruction?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.systemInstruction
          ? {
              systemInstruction: params.systemInstruction,
              temperature: 0.7,
            }
          : undefined,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: unknown) {
      console.warn(`[Gemini Fallback] Model '${model}' failed:`, err);
      lastError = err;

      // Extract error status code or message if available
      const errMsg = String(err);
      const isRecoverable =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('404') ||
        errMsg.includes('500') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('overloaded');

      if (!isRecoverable && !errMsg.includes('model')) {
        // If not recoverable and not model-specific, still continue fallback to be safe
      }
    }
  }

  throw new Error(
    `All models in the fallback ladder failed. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

// 2. Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 3. Gemini Reflection API Route
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const data = req.body && typeof req.body === 'object' ? req.body : {};
  const userPrompt = typeof data.userPrompt === 'string' ? data.userPrompt.trim() : '';
  const mode = typeof data.mode === 'string' ? data.mode : 'reflect';
  const rawHistory = Array.isArray(data.history) ? data.history : [];

  if (!userPrompt) {
    res.status(400).json({
      success: false,
      error: 'Journal entry prompt cannot be empty',
    });
    return;
  }

  if (userPrompt.length > 8000) {
    res.status(400).json({
      success: false,
      error: 'Prompt length exceeds the 8,000 character limit',
    });
    return;
  }

  // Sanitize history
  const sanitizedHistory = rawHistory
    .filter(
      (item: unknown) =>
        item &&
        typeof item === 'object' &&
        'content' in item &&
        typeof (item as { content: unknown }).content === 'string' &&
        'role' in item &&
        ((item as { role: unknown }).role === 'user' || (item as { role: unknown }).role === 'model')
    )
    .slice(-10) // Limit to last 10 turns for context stability
    .map((item: { role: 'user' | 'model'; content: string }) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.content.slice(0, 4000) }],
    }));

  const contents = [
    ...sanitizedHistory,
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ];

  let systemInstruction =
    'You are a compassionate, perceptive journaling companion and thought partner. Validate the user\'s feelings, highlight underlying themes, and offer constructive observations.';

  if (mode === 'summary') {
    systemInstruction =
      'You are an executive reflection summarizer. Synthesize the user\'s entry into clear core takeaways, identify recurring patterns or emotions, and highlight actionable takeaways in scannable markdown bullet points.';
  } else if (mode === 'brainstorm') {
    systemInstruction =
      'You are a creative brainstorming and problem-solving partner. Suggest 3-5 concrete, practical, and inspiring ideas, experiment angles, or alternative perspectives based on the user\'s reflection.';
  } else if (mode === 'reflect') {
    systemInstruction =
      'You are an empathetic, insightful reflection coach. Validate the user\'s experience with care, offer fresh perspectives without being preachy, and ask 1-2 open-ended inquiry questions to foster deeper self-awareness.';
  }

  try {
    const { text, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    res.json({
      success: true,
      reply: text,
      modelUsed,
    });
  } catch (error: unknown) {
    console.error('Gemini Reflection API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate response from Gemini';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// 4. CloudInsight AI - Natural Language Business Analytics Endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const data = req.body && typeof req.body === 'object' ? req.body : {};
  const question = typeof data.question === 'string' ? data.question.trim() : '';
  const datasetSummary = typeof data.datasetSummary === 'object' && data.datasetSummary !== null ? data.datasetSummary : {};
  const calculatedStats = typeof data.calculatedStats === 'object' && data.calculatedStats !== null ? data.calculatedStats : {};
  const rawHistory = Array.isArray(data.history) ? data.history : [];

  if (!question) {
    res.status(400).json({
      success: false,
      error: 'Business question cannot be empty',
    });
    return;
  }

  if (question.length > 3000) {
    res.status(400).json({
      success: false,
      error: 'Question length exceeds the 3,000 character limit',
    });
    return;
  }

  // Format dataset context safely without overwhelming token limits
  const contextSummaryText = JSON.stringify({
    summary: datasetSummary,
    computedMetrics: calculatedStats,
  }, null, 2);

  const systemInstruction = `You are CloudInsight AI, an expert AI-Powered Business Analytics Assistant.
Your mission is to understand business questions and generate rigorous, grounded analytical insights and recommendations.

STRICT GROUNDING DIRECTIVE:
1. You must NEVER fabricate, hallucinate, or invent numbers. All numerical values must strictly originate from the provided dataset summary and computed statistics.
2. If the user asks for a calculation or column that is missing or cannot be answered from the provided dataset context, you MUST state clearly:
"I cannot determine this from the available data."
3. Format your response strictly using the following 4 sections in clean Markdown:

### ANSWER
[Clear, direct 1-2 sentence answer to the user's question]

### KEY FINDING
[Exact verified metric or data point from the dataset, e.g. "Technology contributed $154,200 (42.5%) of total revenue across 320 orders."]

### BUSINESS INSIGHT
[Strategic analytical interpretation of what this trend or figure signifies for company performance]

### RECOMMENDATION
[Concise, actionable business recommendation based on the insight]`;

  const userPrompt = `DATASET SUMMARY & COMPUTED METRICS:
${contextSummaryText}

USER QUESTION:
"${question}"

Provide a structured, grounded business analysis adhering strictly to the required sections.`;

  const sanitizedHistory = rawHistory
    .filter(
      (item: unknown) =>
        item &&
        typeof item === 'object' &&
        'content' in item &&
        typeof (item as { content: unknown }).content === 'string' &&
        'role' in item &&
        ((item as { role: unknown }).role === 'user' || (item as { role: unknown }).role === 'model')
    )
    .slice(-6)
    .map((item: { role: 'user' | 'model'; content: string }) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.content.slice(0, 2000) }],
    }));

  const contents = [
    ...sanitizedHistory,
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ];

  try {
    const { text, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    res.json({
      success: true,
      analysis: text,
      modelUsed,
    });
  } catch (error: unknown) {
    console.error('CloudInsight AI Analyze API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate analysis from CloudInsight AI';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// 5. CloudInsight AI - Automated Executive Insights Generator
app.post('/api/gemini/auto-insights', async (req: Request, res: Response) => {
  const data = req.body && typeof req.body === 'object' ? req.body : {};
  const datasetSummary = typeof data.datasetSummary === 'object' && data.datasetSummary !== null ? data.datasetSummary : {};
  const calculatedStats = typeof data.calculatedStats === 'object' && data.calculatedStats !== null ? data.calculatedStats : {};

  const contextSummaryText = JSON.stringify({
    summary: datasetSummary,
    computedMetrics: calculatedStats,
  }, null, 2);

  const systemInstruction = `You are CloudInsight AI's automated business intelligence engine.
Analyze the provided dataset summary and computed KPIs. Generate high-impact executive insights formatted strictly as JSON.

STRICT GROUNDING & SCHEMA REQUIREMENTS:
- Do not fabricate numbers. Reference only verified metrics provided.
- Return ONLY valid JSON with no conversational wrapper.
Schema:
{
  "keyInsight": {
    "title": "Short title (e.g., Technology Leads Revenue Share)",
    "description": "2-3 sentences explaining the primary driver and metric."
  },
  "opportunity": {
    "title": "Short title (e.g., Expand High-Margin Office Supplies)",
    "description": "Concrete business opportunity backed by current profit/volume."
  },
  "risk": {
    "title": "Short title (e.g., Regional Concentration in Top City)",
    "description": "Observed business vulnerability or negative margin area."
  },
  "recommendation": {
    "title": "Short title (e.g., Reallocate Q3 Marketing Budget)",
    "description": "Specific strategic action leadership should take."
  }
}`;

  const prompt = `DATASET CONTEXT & METRICS:
${contextSummaryText}

Generate the 4 executive insight cards adhering strictly to the JSON schema and grounding requirements.`;

  try {
    const { text, modelUsed } = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
    });

    // Parse JSON safely
    let parsedJson: unknown = null;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    } catch {
      // Fallback structured object if model returned markdown
      parsedJson = {
        keyInsight: { title: 'Executive Overview', description: text.slice(0, 300) },
        opportunity: { title: 'Strategic Growth', description: 'Analyze high-volume sales segments to scale recurring customer orders.' },
        risk: { title: 'Margin Optimization', description: 'Monitor categories with high volume but lower profit margins.' },
        recommendation: { title: 'Resource Allocation', description: 'Prioritize inventory and marketing in the top-performing sales regions.' },
      };
    }

    res.json({
      success: true,
      insights: parsedJson,
      modelUsed,
    });
  } catch (error: unknown) {
    console.error('CloudInsight AI Auto-Insights API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate automatic insights';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// 4. Vite Middleware / Production Static Serve
async function setupViteOrStatic() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (mode: ${isDev ? 'development' : 'production'})`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
