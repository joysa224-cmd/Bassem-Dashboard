"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, Building2 } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { LoadingState, EmptyState, ErrorState } from "@/components/EmptyState";
import { KPICard } from "@/components/KPICard";
import { ISTable } from "@/components/ISTable";
import { ExportButton } from "@/components/ExportButton";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import {
  computeIncomeStatement,
  getAvailableMonths,
  getCostCenters,
  getMonthlySummaries,
} from "@/lib/dataProcessor";
import { topNWithOther } from "@/lib/chartTheme";

export default function IncomeStatementPage() {
  const { transactions, loading, error } = useData();
  const [monthKey, setMonthKey] = useState<string>("all");
  const [costCenter, setCostCenter] = useState<string>("all");

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const costCenters = useMemo(() => getCostCenters(transactions), [transactions]);

  const is = useMemo(
    () => computeIncomeStatement(transactions, monthKey, costCenter),
    [transactions, monthKey, costCenter]
  );

  const monthlySummaries = useMemo(
    () => getMonthlySummaries(transactions, costCenter),
    [transactions, costCenter]
  );

  const opexDonutData = useMemo(() => topNWithOther(is.opexRows), [is.opexRows]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (transactions.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قائمة الدخل</h1>
          <p className="text-sm text-gray-500">Income Statement</p>
        </div>
        <ExportButton
          fileName="قائمة-الدخل"
          getSheets={() => [
            {
              sheetName: "IS",
              rows: [
                { البيان: "إيراد النشاط", المبلغ: is.revenue, "%": "" },
                { البيان: "إيرادات متنوعة", المبلغ: is.miscRevenue, "%": "" },
                { البيان: "إجمالي الإيرادات", المبلغ: is.totalRevenue, "%": 100 },
                ...is.opexRows.map((r) => ({ البيان: r.label, المبلغ: r.amount, "%": r.pctOfRevenue.toFixed(2) })),
                { البيان: "إجمالي مصروفات التشغيل", المبلغ: is.totalOpex, "%": "" },
                { البيان: "مجمل الربح", المبلغ: is.grossProfit, "%": is.grossProfitPct.toFixed(2) },
                ...is.adminRows.map((r) => ({ البيان: r.label, المبلغ: r.amount, "%": r.pctOfRevenue.toFixed(2) })),
                { البيان: "إجمالي المصروفات الإدارية", المبلغ: is.totalAdmin, "%": "" },
                { البيان: "صافي الربح", المبلغ: is.netProfit, "%": is.netProfitPct.toFixed(2) },
              ],
            },
            {
              sheetName: "Monthly",
              rows: monthlySummaries.map((m) => ({
                الشهر: m.label,
                الإيرادات: m.totalRevenue,
                "مصروفات التشغيل": m.opex,
                "المصروفات الإدارية": m.admin,
                "مجمل الربح": m.grossProfit,
                "صافي الربح": m.netProfit,
              })),
            },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[200px] flex-col gap-1.5">
          <Label htmlFor="month-filter">الشهر</Label>
          <Select id="month-filter" value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
            <option value="all">كل الفترة</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(`${m}-01`).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1.5">
          <Label htmlFor="cc-filter">مركز التكلفة</Label>
          <Select id="cc-filter" value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
            <option value="all">كل المراكز</option>
            {costCenters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard title="إجمالي الإيرادات" value={is.totalRevenue} icon={Wallet} />
        <KPICard title="مجمل الربح %" value={is.grossProfitPct} isPercent icon={TrendingUp} tone={is.grossProfitPct >= 0 ? "positive" : "negative"} />
        <KPICard title="صافي الربح %" value={is.netProfitPct} isPercent icon={TrendingDown} tone={is.netProfitPct >= 0 ? "positive" : "negative"} />
        <KPICard title="إجمالي مصروفات التشغيل" value={is.totalOpex} icon={Receipt} />
        <KPICard title="إجمالي المصروفات الإدارية" value={is.totalAdmin} icon={Building2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل قائمة الدخل</CardTitle>
        </CardHeader>
        <CardContent>
          <ISTable data={is} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات مقابل المصروفات شهريًا</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={monthlySummaries.map((m) => ({
                label: m.label,
                الإيرادات: m.totalRevenue,
                "مصروفات التشغيل": m.opex,
                "المصروفات الإدارية": m.admin,
              }))}
              xKey="label"
              series={[
                { key: "الإيرادات", name: "الإيرادات" },
                { key: "مصروفات التشغيل", name: "مصروفات التشغيل" },
                { key: "المصروفات الإدارية", name: "المصروفات الإدارية" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مجمل الربح مقابل صافي الربح شهريًا</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={monthlySummaries.map((m) => ({
                label: m.label,
                "مجمل الربح": m.grossProfit,
                "صافي الربح": m.netProfit,
              }))}
              xKey="label"
              series={[
                { key: "مجمل الربح", name: "مجمل الربح" },
                { key: "صافي الربح", name: "صافي الربح" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>توزيع مصروفات التشغيل حسب البند</CardTitle>
        </CardHeader>
        <CardContent>
          {opexDonutData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">لا توجد بيانات مصروفات تشغيل لهذه الفترة</p>
          ) : (
            <DonutChart data={opexDonutData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
