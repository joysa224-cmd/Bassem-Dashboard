export interface Transaction {
  entryNo: number;
  date: string; // ISO date string
  monthKey: string; // YYYY-MM
  debit: number;
  credit: number;
  mainAccount: string;
  subAccount: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  costCenter: string;
  isOpening: boolean;
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
  revenue: number;
  miscRevenue: number;
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
  revenue: number;
  miscRevenue: number;
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

export interface CashFlowResult {
  bank: CashFlowMonth[];
  cash: CashFlowMonth[];
}

export interface ExpenseSubAccountMonth {
  subAccount: string;
  amounts: Record<string, number>; // monthKey -> amount
  total: number;
}
