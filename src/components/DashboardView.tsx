import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Percent,
  Calculator,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  UploadCloud,
  Layers,
  BarChart2,
  PieChart as PieIcon,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import type { Dataset, FilterState } from '../types';
import {
  calculateKPIs,
  filterDataset,
  aggregateSalesTrend,
  aggregateByCategory,
  aggregateTopProducts,
  aggregateByCity,
  aggregateProfitVsSales,
  getUniqueFilterValues,
  findColumnByRole,
  formatCurrency,
} from '../lib/analytics';

interface DashboardViewProps {
  dataset: Dataset | null;
  onGoToUpload: () => void;
  onLoadSample: () => void;
  onGoToAnalyst: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  onGoToUpload,
  onLoadSample,
  onGoToAnalyst,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: '', end: '' },
    category: '',
    city: '',
    searchProduct: '',
  });

  // Calculate filtered rows
  const filteredRows = useMemo(() => {
    if (!dataset) return [];
    return filterDataset(dataset, filters);
  }, [dataset, filters]);

  // Dynamic KPIs
  const kpis = useMemo(() => {
    if (!dataset) return null;
    return calculateKPIs(dataset, filteredRows);
  }, [dataset, filteredRows]);

  // Aggregate chart data
  const trendData = useMemo(() => {
    if (!dataset) return [];
    return aggregateSalesTrend(dataset, filteredRows);
  }, [dataset, filteredRows]);

  const categoryData = useMemo(() => {
    if (!dataset) return [];
    return aggregateByCategory(dataset, filteredRows);
  }, [dataset, filteredRows]);

  const topProductsData = useMemo(() => {
    if (!dataset) return [];
    return aggregateTopProducts(dataset, filteredRows, 8);
  }, [dataset, filteredRows]);

  const cityData = useMemo(() => {
    if (!dataset) return [];
    return aggregateByCity(dataset, filteredRows);
  }, [dataset, filteredRows]);

  const profitVsSalesData = useMemo(() => {
    if (!dataset) return [];
    return aggregateProfitVsSales(dataset, filteredRows);
  }, [dataset, filteredRows]);

  // Check column capabilities
  const hasCategory = Boolean(dataset && findColumnByRole(dataset.columns, 'category'));
  const hasCity = Boolean(dataset && findColumnByRole(dataset.columns, 'city'));
  const hasProduct = Boolean(dataset && findColumnByRole(dataset.columns, 'product'));
  const hasDate = Boolean(dataset && findColumnByRole(dataset.columns, 'date'));
  const hasSales = Boolean(dataset && findColumnByRole(dataset.columns, 'sales'));
  const hasProfit = Boolean(dataset && findColumnByRole(dataset.columns, 'profit'));

  const categories = useMemo(() => {
    if (!dataset || !hasCategory) return [];
    return getUniqueFilterValues(dataset, 'category');
  }, [dataset, hasCategory]);

  const cities = useMemo(() => {
    if (!dataset || !hasCity) return [];
    return getUniqueFilterValues(dataset, 'city');
  }, [dataset, hasCity]);

  const handleResetFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      category: '',
      city: '',
      searchProduct: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.category || filters.city || filters.searchProduct || filters.dateRange.start || filters.dateRange.end
  );

  // 1. EMPTY STATE (No dataset loaded)
  if (!dataset) {
    return (
      <div className="py-16 px-4 text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <BarChart2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Start your analysis</h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            Upload a business dataset or try our sample enterprise dataset to begin visualizing KPIs,
            trends, and consulting Gemini with natural language.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="empty-upload-btn"
            onClick={onGoToUpload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>

          <button
            id="empty-sample-btn"
            onClick={onLoadSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Try Sample Dataset</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE DASHBOARD
  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Business Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Explore your data, discover trends, and make better business decisions with AI.
          </p>
        </div>

        {/* Quick CTA to Ask AI */}
        <div className="flex items-center gap-3">
          <button
            id="quick-ask-ai-btn"
            onClick={onGoToAnalyst}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold shadow-xs shadow-emerald-900/15 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask CloudInsight AI</span>
          </button>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div
        id="dashboard-filter-bar"
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dataset Slicers &amp; Filters</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Filter */}
          {hasCategory ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Category</label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-emerald-600"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* City Filter */}
          {hasCity ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">City / Region</label>
              <select
                id="filter-city"
                value={filters.city}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-emerald-600"
              >
                <option value="">All Locations ({cities.length})</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Product Search */}
          {hasProduct ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Product Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  id="filter-search-product"
                  type="text"
                  placeholder="Search item name..."
                  value={filters.searchProduct}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchProduct: e.target.value }))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-2 text-slate-800 focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>
          ) : null}

          {/* Date Range Start / End */}
          {hasDate ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">From Date</label>
                <input
                  id="filter-date-start"
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">To Date</label>
                <input
                  id="filter-date-end"
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Filter slice status */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>
            Active slice: <strong className="text-slate-800">{filteredRows.length}</strong> of{' '}
            {dataset.rowCount} records matched
          </span>
          <span className="font-mono text-[10px] text-slate-400">Dataset ID: {dataset.id}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Sales */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total Sales</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-total-sales"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.totalSales.isAvailable ? 'text-slate-900' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.totalSales.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.totalSales.sublabel || 'Gross transaction revenue'}
              </span>
            </div>
          </div>

          {/* 2. Total Profit */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total Profit</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-total-profit"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.totalProfit.isAvailable ? 'text-emerald-700' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.totalProfit.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.totalProfit.sublabel || 'Net earnings after cost'}
              </span>
            </div>
          </div>

          {/* 3. Total Orders */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total Orders</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-total-orders"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.totalOrders.isAvailable ? 'text-slate-900' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.totalOrders.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.totalOrders.sublabel || 'Transactions registered'}
              </span>
            </div>
          </div>

          {/* 4. Average Order Value */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Avg Order Value</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-avg-order-value"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.avgOrderValue.isAvailable ? 'text-slate-900' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.avgOrderValue.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.avgOrderValue.sublabel || 'Sales divided by orders'}
              </span>
            </div>
          </div>

          {/* 5. Total Quantity */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total Quantity</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-total-quantity"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.totalQuantity.isAvailable ? 'text-slate-900' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.totalQuantity.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.totalQuantity.sublabel || 'Volume dispatched'}
              </span>
            </div>
          </div>

          {/* 6. Profit Margin */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Profit Margin</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span
                id="kpi-profit-margin"
                className={`text-xl font-bold tracking-tight block truncate ${
                  kpis.profitMargin.isAvailable ? 'text-teal-700' : 'text-slate-400 text-xs italic font-normal'
                }`}
              >
                {kpis.profitMargin.formatted}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {kpis.profitMargin.sublabel || 'Net margin efficiency'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Sales Trend Over Time */}
        {trendData.length > 1 && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sales Trend Over Time</h3>
                <p className="text-xs text-slate-500">Monthly revenue progression</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Area Chart
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Sales']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. Sales by Category */}
        {categoryData.length > 0 && hasSales && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sales by Category</h3>
                <p className="text-xs text-slate-500">Revenue split across business units</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                Bar Chart
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Sales']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. Profit by Category */}
        {categoryData.length > 0 && hasProfit && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Profit by Category</h3>
                <p className="text-xs text-slate-500">Net operating margin contribution</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Profit Breakdown
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Profit']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. Top Products by Sales */}
        {topProductsData.length > 0 && hasProduct && hasSales && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Top Products by Sales</h3>
                <p className="text-xs text-slate-500">Highest grossing inventory catalog</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                Leaderboard
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topProductsData}
                  margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="product"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Sales']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 5. Sales by City */}
        {cityData.length > 0 && hasCity && hasSales && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sales by City</h3>
                <p className="text-xs text-slate-500">Regional market distribution</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                Geography
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Sales']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 6. Profit vs Sales Correlation */}
        {profitVsSalesData.length > 2 && hasSales && hasProfit && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Profit vs Sales Distribution</h3>
                <p className="text-xs text-slate-500">Transaction margin efficiency</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                Scatter
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey="sales"
                    name="Sales"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <YAxis
                    type="number"
                    dataKey="profit"
                    name="Profit"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(val: any, name: string) => [formatCurrency(Number(val)), name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Scatter name="Transactions" data={profitVsSalesData} fill="#f59e0b" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
