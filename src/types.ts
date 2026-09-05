export type ColumnType = 'numeric' | 'text' | 'date';

export type BusinessRole =
  | 'sales'
  | 'revenue'
  | 'profit'
  | 'quantity'
  | 'category'
  | 'product'
  | 'customer'
  | 'city'
  | 'date'
  | 'order_id'
  | 'unknown';

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  role: BusinessRole;
  sampleValues: string[];
}

export interface Dataset {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnMetadata[];
  data: Record<string, any>[];
  uploadTimestamp: string;
}

export interface KpiMetric {
  value: number | string;
  formatted: string;
  isAvailable: boolean;
  unavailableReason?: string;
  trend?: string;
  sublabel?: string;
}

export interface KpiSummary {
  totalSales: KpiMetric;
  totalProfit: KpiMetric;
  totalOrders: KpiMetric;
  avgOrderValue: KpiMetric;
  totalQuantity: KpiMetric;
  profitMargin: KpiMetric;
}

export interface FilterState {
  dateRange: { start: string; end: string };
  category: string;
  city: string;
  searchProduct: string;
}

export interface ExecutiveInsightItem {
  title: string;
  description: string;
}

export interface ExecutiveInsights {
  keyInsight: ExecutiveInsightItem;
  opportunity: ExecutiveInsightItem;
  risk: ExecutiveInsightItem;
  recommendation: ExecutiveInsightItem;
}

export interface AnalysisHistoryItem {
  id: string;
  userId: string;
  question: string;
  analysis: string;
  timestamp: string;
  datasetName: string;
  kpisSnapshot?: {
    totalSales?: string;
    totalProfit?: string;
    profitMargin?: string;
  };
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  mode?: string;
  modelUsed?: string;
}

export interface InteractionSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  question?: string;
  analysis?: string;
  datasetName?: string;
  kpisSnapshot?: Record<string, string>;
  modelUsed?: string;
  summary?: string;
  tags?: string[];
  entries?: JournalEntry[];
}

export interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: string;
  modelUsed?: string;
  error?: string;
}

export interface GeminiAutoInsightsResponse {
  success: boolean;
  insights?: ExecutiveInsights;
  modelUsed?: string;
  error?: string;
}
