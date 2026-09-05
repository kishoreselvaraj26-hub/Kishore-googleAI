import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Dataset, ColumnMetadata, ColumnType, BusinessRole, KpiSummary, FilterState } from '../types';

/**
 * Infer column data type based on sample non-empty values
 */
export function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNull.length === 0) return 'text';

  let numericCount = 0;
  let dateCount = 0;

  for (const val of nonNull.slice(0, 30)) {
    const str = String(val).trim().replace(/^[$\u20B9\u20AC\u00A3,]+/, '').replace(/,/g, '');
    const num = Number(str);
    if (!isNaN(num) && str !== '') {
      numericCount++;
      continue;
    }

    // Check date pattern
    if (typeof val === 'string' && (val.includes('-') || val.includes('/') || val.includes('.'))) {
      const parsedDate = Date.parse(val);
      if (!isNaN(parsedDate) && val.length >= 6) {
        dateCount++;
      }
    }
  }

  if (numericCount / nonNull.length > 0.7) return 'numeric';
  if (dateCount / nonNull.length > 0.6) return 'date';
  return 'text';
}

/**
 * Detect business role of a column by header name and sample values
 */
export function inferBusinessRole(name: string, type: ColumnType): BusinessRole {
  const lower = name.toLowerCase().replace(/[_\s-]+/g, '');

  if (lower.includes('profit') || lower.includes('margin') || lower.includes('netincome')) {
    return 'profit';
  }
  if (lower.includes('sale') || lower.includes('revenue') || lower.includes('turnover') || lower.includes('amount') || lower.includes('price')) {
    return 'sales';
  }
  if (lower.includes('qty') || lower.includes('quantity') || lower.includes('units') || lower.includes('volume')) {
    return 'quantity';
  }
  if (lower.includes('category') || lower.includes('segment') || lower.includes('department') || lower.includes('type')) {
    return 'category';
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('sku') || lower.includes('service')) {
    return 'product';
  }
  if (lower.includes('customer') || lower.includes('client') || lower.includes('buyer') || lower.includes('account')) {
    return 'customer';
  }
  if (lower.includes('city') || lower.includes('region') || lower.includes('state') || lower.includes('country') || lower.includes('location')) {
    return 'city';
  }
  if (lower.includes('date') || lower.includes('time') || lower.includes('day') || lower.includes('month') || lower.includes('year') || type === 'date') {
    return 'date';
  }
  if (lower.includes('orderid') || lower.includes('transactionid') || lower.includes('invoiceid') || lower.includes('id')) {
    return 'order_id';
  }

  return 'unknown';
}

/**
 * Format numbers cleanly as currency / integers / percentages
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return (value * 100).toFixed(1) + '%';
}

/**
 * Parse CSV file into a validated Dataset
 */
export function parseCSVFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            return reject(new Error('The uploaded CSV file contains no readable records.'));
          }

          const rawData = results.data as Record<string, any>[];
          // Filter out rows where all values are null/empty
          const cleanData = rawData.filter((row) =>
            Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
          );

          if (cleanData.length === 0) {
            return reject(new Error('The uploaded CSV file does not contain valid data rows.'));
          }

          const fields = results.meta.fields || Object.keys(cleanData[0] || {});
          if (fields.length === 0) {
            return reject(new Error('Could not identify table columns in the CSV.'));
          }

          const columns: ColumnMetadata[] = fields.map((field) => {
            const sampleVals = cleanData
              .slice(0, 5)
              .map((row) => String(row[field] ?? ''))
              .filter(Boolean);
            const colType = inferColumnType(cleanData.map((row) => row[field]));
            const role = inferBusinessRole(field, colType);
            return {
              name: field,
              type: colType,
              role,
              sampleValues: sampleVals,
            };
          });

          resolve({
            id: 'dataset_' + Date.now(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            rowCount: cleanData.length,
            columnCount: columns.length,
            columns,
            data: cleanData,
            uploadTimestamp: new Date().toISOString(),
          });
        } catch (err: unknown) {
          reject(new Error('Error processing CSV data: ' + (err instanceof Error ? err.message : String(err))));
        }
      },
      error: (err) => {
        reject(new Error('Failed to parse CSV file: ' + err.message));
      },
    });
  });
}

/**
 * Parse Excel (.xlsx / .xls) file into a validated Dataset
 */
export async function parseExcelFile(file: File): Promise<Dataset> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The uploaded Excel spreadsheet has no sheets.');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: null,
      blankrows: false,
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('The first sheet in this Excel workbook contains no data rows.');
    }

    const fields = Object.keys(jsonData[0]);
    const columns: ColumnMetadata[] = fields.map((field) => {
      const sampleVals = jsonData
        .slice(0, 5)
        .map((row) => String(row[field] ?? ''))
        .filter(Boolean);
      const colType = inferColumnType(jsonData.map((row) => row[field]));
      const role = inferBusinessRole(field, colType);
      return {
        name: field,
        type: colType,
        role,
        sampleValues: sampleVals,
      };
    });

    return {
      id: 'dataset_' + Date.now(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      rowCount: jsonData.length,
      columnCount: columns.length,
      columns,
      data: jsonData,
      uploadTimestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    throw new Error('Failed to parse Excel file: ' + (err instanceof Error ? err.message : String(err)));
  }
}

/**
 * Retrieve column by business role or fallback name
 */
export function findColumnByRole(columns: ColumnMetadata[], role: BusinessRole): string | undefined {
  const match = columns.find((c) => c.role === role);
  return match?.name;
}

/**
 * Calculate KPI summary adapting dynamically to available columns
 */
export function calculateKPIs(dataset: Dataset, filteredRows?: Record<string, any>[]): KpiSummary {
  const rows = filteredRows || dataset.data;
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  const profitCol = findColumnByRole(dataset.columns, 'profit');
  const qtyCol = findColumnByRole(dataset.columns, 'quantity');
  const orderCol = findColumnByRole(dataset.columns, 'order_id');

  // 1. Total Sales
  let totalSales = 0;
  let hasSales = false;
  if (salesCol) {
    hasSales = true;
    for (const r of rows) {
      const val = Number(String(r[salesCol]).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(val)) totalSales += val;
    }
  }

  // 2. Total Profit
  let totalProfit = 0;
  let hasProfit = false;
  if (profitCol) {
    hasProfit = true;
    for (const r of rows) {
      const val = Number(String(r[profitCol]).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(val)) totalProfit += val;
    }
  }

  // 3. Total Orders
  const totalOrders = rows.length;
  const hasOrders = totalOrders > 0;

  // 4. Average Order Value (AOV)
  const avgOrderValue = hasSales && totalOrders > 0 ? totalSales / totalOrders : 0;

  // 5. Total Quantity
  let totalQuantity = 0;
  let hasQuantity = false;
  if (qtyCol) {
    hasQuantity = true;
    for (const r of rows) {
      const val = Number(r[qtyCol]);
      if (!isNaN(val)) totalQuantity += val;
    }
  }

  // 6. Profit Margin
  const profitMargin = hasSales && hasProfit && totalSales > 0 ? totalProfit / totalSales : 0;

  return {
    totalSales: {
      value: hasSales ? totalSales : 'N/A',
      formatted: hasSales ? formatCurrency(totalSales) : 'Not available for this dataset',
      isAvailable: hasSales,
      sublabel: hasSales ? `Aggregated across ${rows.length} records` : undefined,
    },
    totalProfit: {
      value: hasProfit ? totalProfit : 'N/A',
      formatted: hasProfit ? formatCurrency(totalProfit) : 'Not available for this dataset',
      isAvailable: hasProfit,
      sublabel: hasProfit ? (totalProfit >= 0 ? 'Net Positive Return' : 'Operating Deficit') : undefined,
    },
    totalOrders: {
      value: hasOrders ? totalOrders : 'N/A',
      formatted: hasOrders ? formatNumber(totalOrders) : 'Not available for this dataset',
      isAvailable: hasOrders,
      sublabel: orderCol ? `Tracked by ${orderCol}` : 'Count of row records',
    },
    avgOrderValue: {
      value: hasSales && hasOrders ? avgOrderValue : 'N/A',
      formatted: hasSales && hasOrders ? formatCurrency(avgOrderValue) : 'Not available for this dataset',
      isAvailable: hasSales && hasOrders,
      sublabel: hasSales ? 'Average revenue per transaction' : undefined,
    },
    totalQuantity: {
      value: hasQuantity ? totalQuantity : 'N/A',
      formatted: hasQuantity ? formatNumber(totalQuantity) + ' units' : 'Not available for this dataset',
      isAvailable: hasQuantity,
      sublabel: hasQuantity ? 'Total inventory units ordered' : undefined,
    },
    profitMargin: {
      value: hasSales && hasProfit ? profitMargin : 'N/A',
      formatted: hasSales && hasProfit ? formatPercent(profitMargin) : 'Not available for this dataset',
      isAvailable: hasSales && hasProfit,
      sublabel: hasSales && hasProfit ? `${(profitMargin * 100).toFixed(1)}% of net sales retained` : undefined,
    },
  };
}

/**
 * Filter dataset rows based on active user filter selections
 */
export function filterDataset(dataset: Dataset, filters: FilterState): Record<string, any>[] {
  const categoryCol = findColumnByRole(dataset.columns, 'category');
  const cityCol = findColumnByRole(dataset.columns, 'city');
  const productCol = findColumnByRole(dataset.columns, 'product');
  const dateCol = findColumnByRole(dataset.columns, 'date');

  return dataset.data.filter((row) => {
    if (filters.category && categoryCol && String(row[categoryCol]) !== filters.category) {
      return false;
    }
    if (filters.city && cityCol && String(row[cityCol]) !== filters.city) {
      return false;
    }
    if (filters.searchProduct && productCol) {
      const prodName = String(row[productCol] || '').toLowerCase();
      if (!prodName.includes(filters.searchProduct.toLowerCase())) return false;
    }
    if (filters.dateRange.start && dateCol) {
      const rowDate = new Date(row[dateCol]).getTime();
      const startDate = new Date(filters.dateRange.start).getTime();
      if (!isNaN(rowDate) && !isNaN(startDate) && rowDate < startDate) return false;
    }
    if (filters.dateRange.end && dateCol) {
      const rowDate = new Date(row[dateCol]).getTime();
      const endDate = new Date(filters.dateRange.end).getTime();
      if (!isNaN(rowDate) && !isNaN(endDate) && rowDate > endDate) return false;
    }
    return true;
  });
}

/**
 * Aggregate Sales Trend over Time
 */
export function aggregateSalesTrend(dataset: Dataset, rows: Record<string, any>[]) {
  const dateCol = findColumnByRole(dataset.columns, 'date');
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  if (!dateCol || !salesCol) return [];

  const map = new Map<string, { sales: number; profit: number; count: number }>();
  const profitCol = findColumnByRole(dataset.columns, 'profit');

  for (const r of rows) {
    const rawDate = r[dateCol];
    if (!rawDate) continue;
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) continue;

    // Group by Month/Year format (e.g. "2024-01")
    const key = dateObj.toISOString().slice(0, 7);
    const sales = Number(r[salesCol]) || 0;
    const profit = profitCol ? Number(r[profitCol]) || 0 : 0;

    const existing = map.get(key) || { sales: 0, profit: 0, count: 0 };
    existing.sales += sales;
    existing.profit += profit;
    existing.count += 1;
    map.set(key, existing);
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map((key) => {
    const item = map.get(key)!;
    // Format Month name (e.g., "Jan 24")
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return {
      period: label,
      rawKey: key,
      sales: Math.round(item.sales),
      profit: Math.round(item.profit),
      orders: item.count,
    };
  });
}

/**
 * Aggregate Sales and Profit by Category
 */
export function aggregateByCategory(dataset: Dataset, rows: Record<string, any>[]) {
  const catCol = findColumnByRole(dataset.columns, 'category');
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  const profitCol = findColumnByRole(dataset.columns, 'profit');
  if (!catCol) return [];

  const map = new Map<string, { sales: number; profit: number; count: number }>();

  for (const r of rows) {
    const cat = String(r[catCol] || 'Uncategorized');
    const sales = salesCol ? Number(r[salesCol]) || 0 : 0;
    const profit = profitCol ? Number(r[profitCol]) || 0 : 0;

    const existing = map.get(cat) || { sales: 0, profit: 0, count: 0 };
    existing.sales += sales;
    existing.profit += profit;
    existing.count += 1;
    map.set(cat, existing);
  }

  return Array.from(map.entries())
    .map(([category, vals]) => ({
      category,
      sales: Math.round(vals.sales),
      profit: Math.round(vals.profit),
      orders: vals.count,
      margin: vals.sales > 0 ? (vals.profit / vals.sales) * 100 : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

/**
 * Aggregate Top Products by Sales
 */
export function aggregateTopProducts(dataset: Dataset, rows: Record<string, any>[], limit = 10) {
  const prodCol = findColumnByRole(dataset.columns, 'product');
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  const profitCol = findColumnByRole(dataset.columns, 'profit');
  if (!prodCol) return [];

  const map = new Map<string, { sales: number; profit: number; count: number }>();

  for (const r of rows) {
    const prod = String(r[prodCol] || 'Unknown Product');
    const sales = salesCol ? Number(r[salesCol]) || 0 : 0;
    const profit = profitCol ? Number(r[profitCol]) || 0 : 0;

    const existing = map.get(prod) || { sales: 0, profit: 0, count: 0 };
    existing.sales += sales;
    existing.profit += profit;
    existing.count += 1;
    map.set(prod, existing);
  }

  return Array.from(map.entries())
    .map(([product, vals]) => ({
      product,
      sales: Math.round(vals.sales),
      profit: Math.round(vals.profit),
      units: vals.count,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

/**
 * Aggregate Sales by City
 */
export function aggregateByCity(dataset: Dataset, rows: Record<string, any>[]) {
  const cityCol = findColumnByRole(dataset.columns, 'city');
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  const profitCol = findColumnByRole(dataset.columns, 'profit');
  if (!cityCol) return [];

  const map = new Map<string, { sales: number; profit: number; count: number }>();

  for (const r of rows) {
    const city = String(r[cityCol] || 'Unknown City');
    const sales = salesCol ? Number(r[salesCol]) || 0 : 0;
    const profit = profitCol ? Number(r[profitCol]) || 0 : 0;

    const existing = map.get(city) || { sales: 0, profit: 0, count: 0 };
    existing.sales += sales;
    existing.profit += profit;
    existing.count += 1;
    map.set(city, existing);
  }

  return Array.from(map.entries())
    .map(([city, vals]) => ({
      city,
      sales: Math.round(vals.sales),
      profit: Math.round(vals.profit),
      orders: vals.count,
    }))
    .sort((a, b) => b.sales - a.sales);
}

/**
 * Profit vs Sales Scatter / Distribution Data
 */
export function aggregateProfitVsSales(dataset: Dataset, rows: Record<string, any>[]) {
  const salesCol = findColumnByRole(dataset.columns, 'sales');
  const profitCol = findColumnByRole(dataset.columns, 'profit');
  const prodCol = findColumnByRole(dataset.columns, 'product');
  const catCol = findColumnByRole(dataset.columns, 'category');
  if (!salesCol || !profitCol) return [];

  return rows.slice(0, 50).map((r, i) => ({
    id: i + 1,
    name: prodCol ? String(r[prodCol]).slice(0, 20) : `Order ${i + 1}`,
    category: catCol ? String(r[catCol]) : 'General',
    sales: Math.round(Number(r[salesCol]) || 0),
    profit: Math.round(Number(r[profitCol]) || 0),
  }));
}

/**
 * Generate a concise statistical summary to send to Gemini as analytical grounding
 */
export function generateDatasetGeminiSummary(dataset: Dataset, rows: Record<string, any>[]) {
  const kpis = calculateKPIs(dataset, rows);
  const byCat = aggregateByCategory(dataset, rows);
  const byCity = aggregateByCity(dataset, rows);
  const topProducts = aggregateTopProducts(dataset, rows, 5);

  return {
    datasetName: dataset.name,
    totalRows: rows.length,
    availableColumns: dataset.columns.map((c) => `${c.name} (${c.type}, role: ${c.role})`),
    metrics: {
      totalSales: kpis.totalSales.formatted,
      totalProfit: kpis.totalProfit.formatted,
      totalOrders: kpis.totalOrders.formatted,
      avgOrderValue: kpis.avgOrderValue.formatted,
      profitMargin: kpis.profitMargin.formatted,
    },
    categoryBreakdown: byCat.slice(0, 5).map((c) => ({
      category: c.category,
      sales: formatCurrency(c.sales),
      profit: formatCurrency(c.profit),
      margin: c.margin.toFixed(1) + '%',
      orders: c.orders,
    })),
    cityBreakdown: byCity.slice(0, 5).map((c) => ({
      city: c.city,
      sales: formatCurrency(c.sales),
      profit: formatCurrency(c.profit),
      orders: c.orders,
    })),
    topProductsBySales: topProducts.map((p) => ({
      product: p.product,
      sales: formatCurrency(p.sales),
      profit: formatCurrency(p.profit),
      orders: p.units,
    })),
  };
}

/**
 * Unique category values for dropdown filters
 */
export function getUniqueFilterValues(dataset: Dataset, role: BusinessRole): string[] {
  const col = findColumnByRole(dataset.columns, role);
  if (!col) return [];
  const set = new Set<string>();
  for (const r of dataset.data) {
    const val = r[col];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      set.add(String(val).trim());
    }
  }
  return Array.from(set).sort();
}
