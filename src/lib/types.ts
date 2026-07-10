export const ACCOUNT_CATEGORIES = [
  "revenue",
  "opex",
  "admin",
  "cashBank",
  "receivables",
  "payables",
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export type AccountCategoryOrNone = AccountCategory | "unclassified";

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  revenue: "إيرادات",
  opex: "مصروفات تشغيل",
  admin: "مصروفات إدارية وعمومية",
  cashBank: "نقدية / بنوك",
  receivables: "عملاء (مدينون)",
  payables: "موردون / دائنون",
};

export interface Transaction {
  entryNo: number;
  date: string; // ISO date string
  monthKey: string; // YYYY-MM
  debit: number;
  credit: number;
  mainAccount: string;
  subAccount: string;
  description: string;
  costCenter: string;
  isOpening: boolean;
  accountCategory: AccountCategoryOrNone;
}

/** Positions (0-indexed columns) picked by the user for each ledger field. -1 means "not mapped". */
export interface ColumnMapping {
  skipRows: number; // 0-5, rows to skip before the header row
  entryNo: number;
  date: number;
  debit: number;
  credit: number;
  mainAccount: number;
  subAccount: number;
  description: number;
  costCenter: number;
}

/** account name (normalized) -> category */
export type CategoryMapping = Record<string, AccountCategoryOrNone>;

export interface SavedMapping {
  columnMapping: ColumnMapping;
  categoryMapping: CategoryMapping;
}

export interface DataPayload {
  transactions: Transaction[];
  fileName: string | null;
  updatedAt: string | null;
  sheetName: string | null;
  usedFallbackSheet: boolean;
}

export interface IncomeStatementRow {
  label: string;
  amount: number;
  pctOfRevenue: number;
}

export interface IncomeStatementResult {
  months: string[];
  revenueRows: IncomeStatementRow[];
  totalRevenue: number;
  opexRows: IncomeStatementRow[];
  totalOpex: number;
  adminRows: IncomeStatementRow[];
  totalAdmin: number;
  grossProfit: number;
  grossProfitPct: number;
  netProfit: number;
  netProfitPct: number;
}

export interface MonthlySummary {
  monthKey: string;
  label: string;
  totalRevenue: number;
  opex: number;
  admin: number;
  grossProfit: number;
  netProfit: number;
  grossProfitPct: number;
  netProfitPct: number;
}

export interface CollectionsMonthRow {
  monthKey: string;
  label: string;
  revenue: number;
  expenses: number;
  arBalance: number;
  apBalance: number;
  dso: number;
  dpo: number;
  collections: number;
  payments: number;
}

export interface CashFlowLine {
  label: string;
  amount: number;
}

export interface CashFlowMonth {
  monthKey: string;
  label: string;
  opening: number;
  inflows: CashFlowLine[];
  totalInflows: number;
  outflows: CashFlowLine[];
  totalOutflows: number;
  closing: number;
}

export interface ExpenseSubAccountMonth {
  subAccount: string;
  amounts: Record<string, number>; // monthKey -> amount
  total: number;
}
