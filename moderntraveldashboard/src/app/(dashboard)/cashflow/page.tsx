"use client";

import { useMemo, useState } from "react";
import { Landmark, Wallet2 } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { LoadingState, EmptyState, ErrorState } from "@/components/EmptyState";
import { KPICard } from "@/components/KPICard";
import { ExportButton, type ExportSheet } from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { CashFlowStatementTable } from "@/components/CashFlowStatementTable";
import { computeCashFlow } from "@/lib/dataProcessor";
import { cn } from "@/lib/utils";
import type { CashFlowMonth } from "@/lib/types";

function statementToRows(months: CashFlowMonth[]) {
  const rows: Record<string, string | number>[] = [];
  for (const m of months) {
    rows.push({ الشهر: m.label, النوع: "رصيد أول المدة", البند: "", المبلغ: m.opening });
    for (const i of m.inflows) rows.push({ الشهر: m.label, النوع: "تدفق داخل", البند: i.label, المبلغ: i.amount });
    rows.push({ الشهر: m.label, النوع: "إجمالي التدفقات الداخلة", البند: "", المبلغ: m.totalInflows });
    for (const o of m.outflows) rows.push({ الشهر: m.label, النوع: "تدفق خارج", البند: o.label, المبلغ: o.amount });
    rows.push({ الشهر: m.label, النوع: "إجمالي التدفقات الخارجة", البند: "", المبلغ: m.totalOutflows });
    rows.push({ الشهر: m.label, النوع: "رصيد آخر المدة", البند: "", المبلغ: m.closing });
  }
  return rows;
}

export default function CashFlowPage() {
  const { transactions, loading, error } = useData();
  const [account, setAccount] = useState<"bank" | "cash">("bank");

  const cashFlow = useMemo(() => computeCashFlow(transactions), [transactions]);
  const activeMonths = account === "bank" ? cashFlow.bank : cashFlow.cash;
  const latestBank = cashFlow.bank[cashFlow.bank.length - 1];
  const latestCash = cashFlow.cash[cashFlow.cash.length - 1];

  const trendData = useMemo(
    () =>
      cashFlow.bank.map((m, i) => ({
        label: m.label,
        بنك: m.closing,
        صندوق: cashFlow.cash[i]?.closing ?? 0,
      })),
    [cashFlow]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (transactions.length === 0) return <EmptyState />;

  const getSheets = (): ExportSheet[] => [
    { sheetName: "Bank", rows: statementToRows(cashFlow.bank) },
    { sheetName: "Cash", rows: statementToRows(cashFlow.cash) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قائمة التدفقات النقدية</h1>
          <p className="text-sm text-gray-500">Cash Flow Statement — Direct Method</p>
        </div>
        <ExportButton fileName="التدفقات-النقدية" getSheets={getSheets} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPICard title="رصيد البنك الحالي" value={latestBank?.closing ?? 0} icon={Landmark} />
        <KPICard title="رصيد الصندوق الحالي" value={latestCash?.closing ?? 0} icon={Wallet2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الرصيد الختامي الجاري — البنك والصندوق</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiLineChart
            data={trendData}
            xKey="label"
            series={[
              { key: "بنك", name: "البنك" },
              { key: "صندوق", name: "الصندوق" },
            ]}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={account === "bank" ? "default" : "outline"}
          onClick={() => setAccount("bank")}
          className={cn(account === "bank" && "shadow-sm")}
        >
          البنك
        </Button>
        <Button
          size="sm"
          variant={account === "cash" ? "default" : "outline"}
          onClick={() => setAccount("cash")}
          className={cn(account === "cash" && "shadow-sm")}
        >
          الصندوق
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{account === "bank" ? "بيان حركة البنك الشهري" : "بيان حركة الصندوق الشهري"}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeMonths.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">لا توجد بيانات لهذا الحساب</p>
          ) : (
            <CashFlowStatementTable months={activeMonths} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
