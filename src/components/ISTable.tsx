import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { IncomeStatementResult } from "@/lib/types";

function SectionRow({ label }: { label: string }) {
  return (
    <TableRow className="bg-gray-50 hover:bg-gray-50">
      <TableCell colSpan={3} className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </TableCell>
    </TableRow>
  );
}

function DataRow({ label, amount, pct, indent }: { label: string; amount: number; pct: number; indent?: boolean }) {
  return (
    <TableRow>
      <TableCell className={cn(indent && "ps-8")}>{label}</TableCell>
      <TableCell className="text-end tabular-nums" dir="ltr">
        {formatNumber(amount)}
      </TableCell>
      <TableCell className="text-end tabular-nums text-gray-500" dir="ltr">
        {formatPercent(pct)}
      </TableCell>
    </TableRow>
  );
}

function TotalRow({ label, amount, pct, tone }: { label: string; amount: number; pct: number; tone?: "positive" | "negative" }) {
  return (
    <TableRow className="border-t-2 border-gray-200 bg-gray-50/60 font-bold hover:bg-gray-50">
      <TableCell>{label}</TableCell>
      <TableCell
        className={cn(
          "text-end tabular-nums",
          tone === "positive" && amount >= 0 && "text-emerald-600",
          tone === "negative" || (tone === "positive" && amount < 0) ? "text-red-600" : ""
        )}
        dir="ltr"
      >
        {formatNumber(amount)}
      </TableCell>
      <TableCell className="text-end tabular-nums" dir="ltr">
        {formatPercent(pct)}
      </TableCell>
    </TableRow>
  );
}

export function ISTable({ data }: { data: IncomeStatementResult }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>البيان</TableHead>
          <TableHead className="text-end">المبلغ</TableHead>
          <TableHead className="text-end">% من الإيراد</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SectionRow label="الإيرادات" />
        {data.revenueRows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-gray-400">لا توجد بيانات</TableCell>
          </TableRow>
        )}
        {data.revenueRows.map((row) => (
          <DataRow key={row.label} label={row.label} amount={row.amount} pct={row.pctOfRevenue} indent />
        ))}
        <TotalRow label="إجمالي الإيرادات" amount={data.totalRevenue} pct={100} />

        <SectionRow label="مصروفات التشغيل" />
        {data.opexRows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-gray-400">لا توجد بيانات</TableCell>
          </TableRow>
        )}
        {data.opexRows.map((row) => (
          <DataRow key={row.label} label={row.label} amount={row.amount} pct={row.pctOfRevenue} indent />
        ))}
        <TotalRow label="إجمالي مصروفات التشغيل" amount={data.totalOpex} pct={data.totalRevenue ? (data.totalOpex / data.totalRevenue) * 100 : 0} />

        <TotalRow label="مجمل الربح (Gross Profit)" amount={data.grossProfit} pct={data.grossProfitPct} tone="positive" />

        <SectionRow label="المصروفات الإدارية والعمومية" />
        {data.adminRows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-gray-400">لا توجد بيانات</TableCell>
          </TableRow>
        )}
        {data.adminRows.map((row) => (
          <DataRow key={row.label} label={row.label} amount={row.amount} pct={row.pctOfRevenue} indent />
        ))}
        <TotalRow label="إجمالي المصروفات الإدارية" amount={data.totalAdmin} pct={data.totalRevenue ? (data.totalAdmin / data.totalRevenue) * 100 : 0} />

        <TotalRow label="صافي الربح (Net Profit)" amount={data.netProfit} pct={data.netProfitPct} tone="positive" />
      </TableBody>
    </Table>
  );
}
