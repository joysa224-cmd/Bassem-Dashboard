import * as XLSX from "xlsx";
import { monthKeyToLabel } from "./utils";
import type {
  Transaction,
  ColumnMapping,
  CategoryMapping,
  AccountCategoryOrNone,
  IncomeStatementResult,
  IncomeStatementRow,
  MonthlySummary,
  CollectionsMonthRow,
  CashFlowMonth,
  ExpenseSubAccountMonth,
} from "./types";

const PREFERRED_SHEET_NAME = "trans";

export function norm(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Workbook / sheet discovery
// ---------------------------------------------------------------------------

export interface SheetResolution {
  sheetName: string;
  usedFallback: boolean;
}

/**
 * Prefers a sheet literally named "trans"; otherwise falls back to the
 * workbook's first sheet so files with a differently-named ledger sheet
 * still work.
 */
export function resolveSheetName(sheetNames: string[]): SheetResolution | null {
  if (sheetNames.length === 0) return null;
  if (sheetNames.includes(PREFERRED_SHEET_NAME)) {
    return { sheetName: PREFERRED_SHEET_NAME, usedFallback: false };
  }
  return { sheetName: sheetNames[0], usedFallback: true };
}

export function detectWorkbookSheet(buffer: ArrayBuffer): SheetResolution | null {
  const workbook = XLSX.read(buffer, { type: "array", bookSheets: true });
  return resolveSheetName(workbook.SheetNames);
}

/**
 * Reads a sheet into a raw array-of-arrays, with no rows skipped and blank
 * rows preserved — "skip N rows" must count physical spreadsheet rows, and
 * dropping blank rows here would shift everything after them.
 */
export function readSheetAOA(buffer: ArrayBuffer, sheetName: string): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    range: 0,
    blankrows: true,
    defval: null,
  });
}

export function excelColumnLetter(index: number): string {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function getColumnCount(rows: unknown[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

/** Header label per column: the cell text at the chosen header row, or a spreadsheet-style fallback (A, B, C…). */
export function getHeaderLabels(rows: unknown[][], skipRows: number): string[] {
  const count = getColumnCount(rows);
  const headerRow = rows[skipRows] ?? [];
  return Array.from({ length: count }, (_, i) => {
    const label = norm(headerRow[i]);
    return label || `العمود ${excelColumnLetter(i)}`;
  });
}

/** Unique, normalized account names found in the mapped main-account column. */
export function getUniqueMainAccounts(rows: unknown[][], mapping: ColumnMapping): string[] {
  const set = new Set<string>();
  for (const row of rows.slice(mapping.skipRows + 1)) {
    const value = norm(row[mapping.mainAccount]);
    if (value) set.add(value);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
}

// ---------------------------------------------------------------------------
// Transaction construction (column + category mapping applied)
// ---------------------------------------------------------------------------

export function buildTransactions(
  rows: unknown[][],
  columnMapping: ColumnMapping,
  categoryMapping: CategoryMapping
): Transaction[] {
  const transactions: Transaction[] = [];
  const dataRows = rows.slice(columnMapping.skipRows + 1);

  const cell = (row: unknown[], colIndex: number): unknown => {
    if (colIndex < 0) return null;
    return row[colIndex];
  };

  for (const row of dataRows) {
    if (!row || row.every((c) => c === null || c === "")) continue;

    const mainAccount = norm(cell(row, columnMapping.mainAccount));
    if (!mainAccount) continue;

    const date = toDate(cell(row, columnMapping.date));
    const entryNo = toNumber(cell(row, columnMapping.entryNo));
    const accountCategory: AccountCategoryOrNone = categoryMapping[mainAccount] ?? "unclassified";

    transactions.push({
      entryNo,
      date: date ? date.toISOString() : "",
      monthKey: date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : "",
      debit: toNumber(cell(row, columnMapping.debit)),
      credit: toNumber(cell(row, columnMapping.credit)),
      mainAccount,
      subAccount: norm(cell(row, columnMapping.subAccount)),
      description: norm(cell(row, columnMapping.description)),
      costCenter: norm(cell(row, columnMapping.costCenter)),
      isOpening: entryNo === 0,
      accountCategory,
    });
  }

  return transactions;
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

export const isRevenue = (t: Transaction) => t.accountCategory === "revenue";
export const isOpex = (t: Transaction) => t.accountCategory === "opex";
export const isAdmin = (t: Transaction) => t.accountCategory === "admin";
export const isCashBank = (t: Transaction) => t.accountCategory === "cashBank";
export const isReceivable = (t: Transaction) => t.accountCategory === "receivables";
export const isPayable = (t: Transaction) => t.accountCategory === "payables";

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    if (t.isOpening || !t.monthKey) continue;
    set.add(t.monthKey);
  }
  return Array.from(set).sort();
}

export function getCostCenters(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    if (t.costCenter) set.add(t.costCenter);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
}

// ---------------------------------------------------------------------------
// Income statement
// ---------------------------------------------------------------------------

export function computeIncomeStatement(
  transactions: Transaction[],
  monthKey: string | "all",
  costCenter: string | "all" = "all"
): IncomeStatementResult {
  const filtered = transactions.filter((t) => {
    if (t.isOpening) return false;
    if (monthKey !== "all" && t.monthKey !== monthKey) return false;
    if (costCenter !== "all" && t.costCenter !== costCenter) return false;
    return true;
  });

  const revenueMap = new Map<string, number>();
  const opexMap = new Map<string, number>();
  const adminMap = new Map<string, number>();

  for (const t of filtered) {
    if (isRevenue(t)) {
      const key = t.mainAccount || "إيرادات";
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + (t.credit - t.debit));
    } else if (isOpex(t)) {
      const key = t.subAccount || t.mainAccount || "غير مصنف";
      opexMap.set(key, (opexMap.get(key) ?? 0) + (t.debit - t.credit));
    } else if (isAdmin(t)) {
      const key = t.subAccount || t.mainAccount || "غير مصنف";
      adminMap.set(key, (adminMap.get(key) ?? 0) + (t.debit - t.credit));
    }
  }

  const totalRevenue = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0);

  const toRows = (map: Map<string, number>): IncomeStatementRow[] =>
    Array.from(map.entries())
      .map(([label, amount]) => ({
        label,
        amount,
        pctOfRevenue: totalRevenue ? (amount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

  const revenueRows = toRows(revenueMap);
  const opexRows = toRows(opexMap);
  const adminRows = toRows(adminMap);
  const totalOpex = opexRows.reduce((s, r) => s + r.amount, 0);
  const totalAdmin = adminRows.reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalOpex;
  const netProfit = grossProfit - totalAdmin;

  return {
    months: monthKey === "all" ? getAvailableMonths(transactions) : [monthKey],
    revenueRows,
    totalRevenue,
    opexRows,
    totalOpex,
    adminRows,
    totalAdmin,
    grossProfit,
    grossProfitPct: totalRevenue ? (grossProfit / totalRevenue) * 100 : 0,
    netProfit,
    netProfitPct: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
  };
}

export function getMonthlySummaries(
  transactions: Transaction[],
  costCenter: string | "all" = "all"
): MonthlySummary[] {
  const months = getAvailableMonths(transactions);
  return months.map((monthKey) => {
    const is = computeIncomeStatement(transactions, monthKey, costCenter);
    return {
      monthKey,
      label: monthKeyToLabel(monthKey),
      totalRevenue: is.totalRevenue,
      opex: is.totalOpex,
      admin: is.totalAdmin,
      grossProfit: is.grossProfit,
      netProfit: is.netProfit,
      grossProfitPct: is.grossProfitPct,
      netProfitPct: is.netProfitPct,
    };
  });
}

// ---------------------------------------------------------------------------
// Collections & payments
// ---------------------------------------------------------------------------

function computeRunningBalances(
  transactions: Transaction[],
  matcher: (t: Transaction) => boolean,
  side: "debit" | "credit"
): Map<string, number> {
  const months = getAvailableMonths(transactions);
  const sign = (t: Transaction) => (side === "debit" ? t.debit - t.credit : t.credit - t.debit);

  const opening = transactions
    .filter((t) => t.isOpening && matcher(t))
    .reduce((s, t) => s + sign(t), 0);

  const result = new Map<string, number>();
  let running = opening;
  for (const monthKey of months) {
    const movement = transactions
      .filter((t) => !t.isOpening && matcher(t) && t.monthKey === monthKey)
      .reduce((s, t) => s + sign(t), 0);
    running += movement;
    result.set(monthKey, running);
  }
  return result;
}

export function computeCollectionsAnalytics(transactions: Transaction[]): CollectionsMonthRow[] {
  const months = getAvailableMonths(transactions);
  const arBalances = computeRunningBalances(transactions, isReceivable, "debit");
  const apBalances = computeRunningBalances(transactions, isPayable, "credit");
  const summaryMap = new Map(getMonthlySummaries(transactions).map((m) => [m.monthKey, m]));

  return months.map((monthKey) => {
    const summary = summaryMap.get(monthKey)!;
    const arBalance = arBalances.get(monthKey) ?? 0;
    const apBalance = apBalances.get(monthKey) ?? 0;
    const expenses = summary.opex + summary.admin;
    const dailyRevenue = summary.totalRevenue / 30;
    const dailyExpenses = expenses / 30;

    const collections = transactions
      .filter((t) => !t.isOpening && isReceivable(t) && t.monthKey === monthKey)
      .reduce((s, t) => s + t.credit, 0);
    const payments = transactions
      .filter((t) => !t.isOpening && isPayable(t) && t.monthKey === monthKey)
      .reduce((s, t) => s + t.debit, 0);

    return {
      monthKey,
      label: monthKeyToLabel(monthKey),
      revenue: summary.totalRevenue,
      expenses,
      arBalance,
      apBalance,
      dso: dailyRevenue ? arBalance / dailyRevenue : 0,
      dpo: dailyExpenses ? apBalance / dailyExpenses : 0,
      collections,
      payments,
    };
  });
}

// ---------------------------------------------------------------------------
// Cash flow (direct method, single combined cash/bank ledger)
// ---------------------------------------------------------------------------

function buildEntryGroups(transactions: Transaction[]): Map<number, Transaction[]> {
  const map = new Map<number, Transaction[]>();
  for (const t of transactions) {
    if (t.isOpening) continue;
    const arr = map.get(t.entryNo) ?? [];
    arr.push(t);
    map.set(t.entryNo, arr);
  }
  return map;
}

function classifyCounterparty(row: Transaction, group: Transaction[], direction: "in" | "out"): string {
  const other =
    group.find((t) => t !== row && t.accountCategory !== row.accountCategory) ??
    group.find((t) => t !== row);
  if (!other) return "أخرى";

  if (direction === "in") {
    if (other.accountCategory === "receivables" || other.accountCategory === "revenue") {
      return "تحصيلات وإيرادات";
    }
    if (other.accountCategory === "cashBank") return "تحويل داخلي بين الحسابات النقدية";
    return "تحصيلات أخرى";
  }

  if (other.accountCategory === "opex") return "مصروفات تشغيل";
  if (other.accountCategory === "admin") return "مصروفات إدارية وعمومية";
  if (other.accountCategory === "payables") return "سداد للموردين";
  if (other.accountCategory === "cashBank") return "تحويل داخلي بين الحسابات النقدية";
  return "مدفوعات أخرى";
}

export function computeCashFlow(transactions: Transaction[]): CashFlowMonth[] {
  const months = getAvailableMonths(transactions);
  const entryGroups = buildEntryGroups(transactions);
  const opening = transactions
    .filter((t) => t.isOpening && isCashBank(t))
    .reduce((s, t) => s + (t.debit - t.credit), 0);

  let runningOpening = opening;
  const result: CashFlowMonth[] = [];

  for (const monthKey of months) {
    const rows = transactions.filter((t) => !t.isOpening && isCashBank(t) && t.monthKey === monthKey);
    const inflowMap = new Map<string, number>();
    const outflowMap = new Map<string, number>();

    for (const row of rows) {
      const group = entryGroups.get(row.entryNo) ?? [row];
      if (row.debit > 0) {
        const label = classifyCounterparty(row, group, "in");
        inflowMap.set(label, (inflowMap.get(label) ?? 0) + row.debit);
      }
      if (row.credit > 0) {
        const label = classifyCounterparty(row, group, "out");
        outflowMap.set(label, (outflowMap.get(label) ?? 0) + row.credit);
      }
    }

    const inflows = Array.from(inflowMap.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount);
    const outflows = Array.from(outflowMap.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount);
    const totalInflows = inflows.reduce((s, r) => s + r.amount, 0);
    const totalOutflows = outflows.reduce((s, r) => s + r.amount, 0);
    const closing = runningOpening + totalInflows - totalOutflows;

    result.push({
      monthKey,
      label: monthKeyToLabel(monthKey),
      opening: runningOpening,
      inflows,
      totalInflows,
      outflows,
      totalOutflows,
      closing,
    });

    runningOpening = closing;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Expense analysis
// ---------------------------------------------------------------------------

export function getExpenseSubAccountSeries(
  transactions: Transaction[],
  matcher: (t: Transaction) => boolean
): ExpenseSubAccountMonth[] {
  const months = getAvailableMonths(transactions);
  const map = new Map<string, Record<string, number>>();

  for (const t of transactions) {
    if (t.isOpening || !matcher(t)) continue;
    const key = t.subAccount || t.mainAccount || "غير مصنف";
    if (!map.has(key)) {
      const rec: Record<string, number> = {};
      months.forEach((m) => (rec[m] = 0));
      map.set(key, rec);
    }
    const rec = map.get(key)!;
    rec[t.monthKey] = (rec[t.monthKey] ?? 0) + (t.debit - t.credit);
  }

  return Array.from(map.entries())
    .map(([subAccount, amounts]) => ({
      subAccount,
      amounts,
      total: Object.values(amounts).reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.total - a.total);
}
