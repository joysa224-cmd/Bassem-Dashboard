import * as XLSX from "xlsx";
import { monthKeyToLabel } from "./utils";
import type {
  Transaction,
  IncomeStatementResult,
  IncomeStatementRow,
  MonthlySummary,
  CollectionsMonthRow,
  CashFlowResult,
  CashFlowMonth,
  ExpenseSubAccountMonth,
} from "./types";

const SHEET_NAME = "trans";
const SKIP_ROWS = 4;
const HEADER_ROWS = 1;

export const MAIN_ACCOUNTS = {
  REVENUE: "إيراد.نشاط",
  MISC_REVENUE: "ايراد.نشاط.متنوع",
  OPEX: "م.التشغيل",
  ADMIN: "م.عمومية.وادارية",
  BANK: "بنك",
  CASH: "الصندوق",
  AR: "عملاء",
} as const;

export const AP_ACCOUNTS = ["موردين", "دائنون"];

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
  if (sheetNames.includes(SHEET_NAME)) {
    return { sheetName: SHEET_NAME, usedFallback: false };
  }
  return { sheetName: sheetNames[0], usedFallback: true };
}

export function detectWorkbookSheet(buffer: ArrayBuffer): SheetResolution | null {
  const workbook = XLSX.read(buffer, { type: "array", bookSheets: true });
  return resolveSheetName(workbook.SheetNames);
}

export interface ParsedWorkbook {
  transactions: Transaction[];
  sheetName: string;
  usedFallback: boolean;
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedWorkbook {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const resolution = resolveSheetName(workbook.SheetNames);
  if (!resolution) {
    throw new Error("الملف لا يحتوي على أي شيتات");
  }
  const { sheetName, usedFallback } = resolution;
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    range: SKIP_ROWS + HEADER_ROWS,
    blankrows: false,
    defval: null,
  });

  const transactions: Transaction[] = [];

  for (const row of rows) {
    if (!row || row.every((c) => c === null || c === "")) continue;

    const mainAccount = norm(row[4]);
    if (!mainAccount) continue;

    const date = toDate(row[1]);
    const entryNo = toNumber(row[0]);

    transactions.push({
      entryNo,
      date: date ? date.toISOString() : "",
      monthKey: date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : "",
      debit: toNumber(row[2]),
      credit: toNumber(row[3]),
      mainAccount,
      subAccount: norm(row[5]),
      description: norm(row[6]),
      category: norm(row[7]),
      quantity: toNumber(row[8]),
      price: toNumber(row[9]),
      costCenter: norm(row[10]),
      isOpening: entryNo === 0,
    });
  }

  return { transactions, sheetName, usedFallback };
}

export const isRevenue = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.REVENUE;
export const isMiscRevenue = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.MISC_REVENUE;
export const isOpex = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.OPEX;
export const isAdmin = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.ADMIN;
export const isBank = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.BANK;
export const isCash = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.CASH;
export const isAR = (t: Transaction) => t.mainAccount === MAIN_ACCOUNTS.AR;
export const isAP = (t: Transaction) => AP_ACCOUNTS.includes(t.mainAccount);

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

  let revenue = 0;
  let miscRevenue = 0;
  const opexMap = new Map<string, number>();
  const adminMap = new Map<string, number>();

  for (const t of filtered) {
    if (isRevenue(t)) revenue += t.credit - t.debit;
    else if (isMiscRevenue(t)) miscRevenue += t.credit - t.debit;
    else if (isOpex(t)) {
      const key = t.subAccount || "غير مصنف";
      opexMap.set(key, (opexMap.get(key) ?? 0) + (t.debit - t.credit));
    } else if (isAdmin(t)) {
      const key = t.subAccount || "غير مصنف";
      adminMap.set(key, (adminMap.get(key) ?? 0) + (t.debit - t.credit));
    }
  }

  const totalRevenue = revenue + miscRevenue;

  const toRows = (map: Map<string, number>): IncomeStatementRow[] =>
    Array.from(map.entries())
      .map(([label, amount]) => ({
        label,
        amount,
        pctOfRevenue: totalRevenue ? (amount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

  const opexRows = toRows(opexMap);
  const adminRows = toRows(adminMap);
  const totalOpex = opexRows.reduce((s, r) => s + r.amount, 0);
  const totalAdmin = adminRows.reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalOpex;
  const netProfit = grossProfit - totalAdmin;

  return {
    months: monthKey === "all" ? getAvailableMonths(transactions) : [monthKey],
    revenue,
    miscRevenue,
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
      revenue: is.revenue,
      miscRevenue: is.miscRevenue,
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
  const arBalances = computeRunningBalances(transactions, isAR, "debit");
  const apBalances = computeRunningBalances(transactions, isAP, "credit");
  const summaryMap = new Map(getMonthlySummaries(transactions).map((m) => [m.monthKey, m]));

  return months.map((monthKey) => {
    const summary = summaryMap.get(monthKey)!;
    const arBalance = arBalances.get(monthKey) ?? 0;
    const apBalance = apBalances.get(monthKey) ?? 0;
    const expenses = summary.opex + summary.admin;
    const dailyRevenue = summary.totalRevenue / 30;
    const dailyExpenses = expenses / 30;

    const collections = transactions
      .filter((t) => !t.isOpening && isAR(t) && t.monthKey === monthKey)
      .reduce((s, t) => s + t.credit, 0);
    const payments = transactions
      .filter((t) => !t.isOpening && isAP(t) && t.monthKey === monthKey)
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

function classifyCounterparty(
  row: Transaction,
  group: Transaction[],
  accountKind: "bank" | "cash",
  direction: "in" | "out"
): string {
  const other = group.find((t) => t !== row && t.mainAccount !== row.mainAccount) ?? group.find((t) => t !== row);
  if (!other) return "أخرى";

  if (direction === "in") {
    if (other.mainAccount === MAIN_ACCOUNTS.AR || other.mainAccount === MAIN_ACCOUNTS.REVENUE) {
      return "تحصيلات من العملاء";
    }
    if (other.mainAccount === MAIN_ACCOUNTS.MISC_REVENUE) return "إيرادات متنوعة";
    if (accountKind === "bank" && other.mainAccount === MAIN_ACCOUNTS.CASH) return "تحويل من الصندوق";
    if (accountKind === "cash" && other.mainAccount === MAIN_ACCOUNTS.BANK) return "تحويل من البنك";
    return "إيرادات وتحصيلات أخرى";
  }

  if (other.mainAccount === MAIN_ACCOUNTS.OPEX) return "مصروفات تشغيل";
  if (other.mainAccount === MAIN_ACCOUNTS.ADMIN) return "مصروفات إدارية وعمومية";
  if (AP_ACCOUNTS.includes(other.mainAccount)) return "سداد للموردين";
  if (accountKind === "bank" && other.mainAccount === MAIN_ACCOUNTS.CASH) return "تحويل إلى الصندوق";
  if (accountKind === "cash" && other.mainAccount === MAIN_ACCOUNTS.BANK) return "تحويل إلى البنك";
  return "مصروفات ومدفوعات أخرى";
}

function buildCashFlowForAccount(
  transactions: Transaction[],
  matcher: (t: Transaction) => boolean,
  accountKind: "bank" | "cash"
): CashFlowMonth[] {
  const months = getAvailableMonths(transactions);
  const entryGroups = buildEntryGroups(transactions);
  const opening = transactions
    .filter((t) => t.isOpening && matcher(t))
    .reduce((s, t) => s + (t.debit - t.credit), 0);

  let runningOpening = opening;
  const result: CashFlowMonth[] = [];

  for (const monthKey of months) {
    const rows = transactions.filter((t) => !t.isOpening && matcher(t) && t.monthKey === monthKey);
    const inflowMap = new Map<string, number>();
    const outflowMap = new Map<string, number>();

    for (const row of rows) {
      const group = entryGroups.get(row.entryNo) ?? [row];
      if (row.debit > 0) {
        const label = classifyCounterparty(row, group, accountKind, "in");
        inflowMap.set(label, (inflowMap.get(label) ?? 0) + row.debit);
      }
      if (row.credit > 0) {
        const label = classifyCounterparty(row, group, accountKind, "out");
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

export function computeCashFlow(transactions: Transaction[]): CashFlowResult {
  return {
    bank: buildCashFlowForAccount(transactions, isBank, "bank"),
    cash: buildCashFlowForAccount(transactions, isCash, "cash"),
  };
}

export function getExpenseSubAccountSeries(
  transactions: Transaction[],
  mainAccountMatcher: (t: Transaction) => boolean
): ExpenseSubAccountMonth[] {
  const months = getAvailableMonths(transactions);
  const map = new Map<string, Record<string, number>>();

  for (const t of transactions) {
    if (t.isOpening || !mainAccountMatcher(t)) continue;
    const key = t.subAccount || "غير مصنف";
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
