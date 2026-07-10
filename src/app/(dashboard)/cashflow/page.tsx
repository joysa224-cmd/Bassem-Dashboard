"use client";

import { useMemo } from "react";
import { Wallet2 } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { LoadingState, EmptyState, ErrorState } from "@/components/EmptyState";
import { KPICard } from "@/components/KPICard";
import { ExportButton, type ExportSheet } from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { CashFlowStatementTable } from "@/components/CashFlowStatementTable";
import { computeCashFlow } from "@/lib/dataProcessor";
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
  const { transactions, stage, error } = useData();

  const months = useMemo(() => computeCashFlow(transactions), [transactions]);
  const latest = months[months.length - 1];

  const trendData = useMemo(() => months.map((m) => ({ label: m.label, الرصيد: m.closing })), [months]);

  if (stage === "loading") return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (transactions.length === 0) return <EmptyState />;

  const getSheets = (): ExportSheet[] => [{ sheetName: "CashFlow", rows: statementToRows(months) }];

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
        <KPICard title="الرصيد النقدي الحالي" value={latest?.closing ?? 0} icon={Wallet2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الرصيد الختامي الجاري</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiLineChart data={trendData} xKey="label" series={[{ key: "الرصيد", name: "الرصيد" }]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيان الحركة الشهري</CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">لا توجد بيانات لحسابات النقدية/البنوك</p>
          ) : (
            <CashFlowStatementTable months={months} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
