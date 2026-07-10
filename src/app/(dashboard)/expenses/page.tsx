"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { LoadingState, EmptyState, ErrorState } from "@/components/EmptyState";
import { ExportButton, type ExportSheet } from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import {
  getAvailableMonths,
  getExpenseSubAccountSeries,
  getMonthlySummaries,
  isOpex,
  isAdmin,
} from "@/lib/dataProcessor";
import { topNWithOther } from "@/lib/chartTheme";
import { formatNumber, monthKeyToLabel } from "@/lib/utils";

export default function ExpensesPage() {
  const { transactions, loading, error } = useData();

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const opexSeries = useMemo(() => getExpenseSubAccountSeries(transactions, isOpex), [transactions]);
  const adminSeries = useMemo(() => getExpenseSubAccountSeries(transactions, isAdmin), [transactions]);
  const monthlySummaries = useMemo(() => getMonthlySummaries(transactions), [transactions]);
  const revenueByMonth = useMemo(
    () => new Map(monthlySummaries.map((m) => [m.monthKey, m.totalRevenue])),
    [monthlySummaries]
  );

  const opexTop = useMemo(() => topNWithOther(opexSeries.map((s) => ({ label: s.subAccount, amount: s.total }))), [opexSeries]);
  const adminTop = useMemo(() => topNWithOther(adminSeries.map((s) => ({ label: s.subAccount, amount: s.total }))), [adminSeries]);

  const stackedData = useMemo(() => {
    const topLabels = new Set(topNWithOther(opexSeries.map((s) => ({ label: s.subAccount, amount: s.total }))).map((r) => r.label));
    return months.map((m) => {
      const row: Record<string, string | number> = { label: monthKeyToLabel(m) };
      let otherSum = 0;
      for (const s of opexSeries) {
        const val = s.amounts[m] ?? 0;
        if (topLabels.has(s.subAccount)) row[s.subAccount] = (Number(row[s.subAccount]) || 0) + val;
        else otherSum += val;
      }
      if (otherSum) row["أخرى"] = otherSum;
      const adminTotal = adminSeries.reduce((sum, s) => sum + (s.amounts[m] ?? 0), 0);
      row["المصروفات الإدارية"] = adminTotal;
      return row;
    });
  }, [months, opexSeries, adminSeries]);

  const stackedSeriesKeys = useMemo(() => {
    const keys = Array.from(new Set(stackedData.flatMap((row) => Object.keys(row).filter((k) => k !== "label"))));
    return keys.map((k) => ({ key: k, name: k }));
  }, [stackedData]);

  const pctLineData = useMemo(() => {
    const topLabels = opexTop.filter((r) => r.label !== "أخرى").map((r) => r.label);
    return months.map((m) => {
      const revenue = revenueByMonth.get(m) ?? 0;
      const row: Record<string, string | number> = { label: monthKeyToLabel(m) };
      for (const label of topLabels) {
        const series = opexSeries.find((s) => s.subAccount === label);
        const val = series?.amounts[m] ?? 0;
        row[label] = revenue ? Number(((val / revenue) * 100).toFixed(2)) : 0;
      }
      return row;
    });
  }, [months, opexSeries, opexTop, revenueByMonth]);

  const momRows = useMemo(() => {
    if (months.length < 2) return [];
    const current = months[months.length - 1];
    const previous = months[months.length - 2];
    return opexSeries.map((s) => {
      const currentVal = s.amounts[current] ?? 0;
      const previousVal = s.amounts[previous] ?? 0;
      const change = previousVal ? ((currentVal - previousVal) / Math.abs(previousVal)) * 100 : currentVal ? 100 : 0;
      return { label: s.subAccount, currentVal, previousVal, change };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [months, opexSeries]);

  function alertBadge(change: number) {
    if (change >= 50) return <Badge variant="danger">+{change.toFixed(0)}%</Badge>;
    if (change >= 20) return <Badge variant="warning">+{change.toFixed(0)}%</Badge>;
    if (change <= -20) return <Badge variant="success">{change.toFixed(0)}%</Badge>;
    return <Badge variant="neutral">{change >= 0 ? "+" : ""}{change.toFixed(0)}%</Badge>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (transactions.length === 0) return <EmptyState />;

  const getSheets = (): ExportSheet[] => [
    {
      sheetName: "OPEX",
      rows: opexSeries.map((s) => ({
        "البند": s.subAccount,
        ...Object.fromEntries(months.map((m) => [monthKeyToLabel(m), s.amounts[m] ?? 0])),
        الإجمالي: s.total,
      })),
    },
    {
      sheetName: "Admin",
      rows: adminSeries.map((s) => ({
        "البند": s.subAccount,
        ...Object.fromEntries(months.map((m) => [monthKeyToLabel(m), s.amounts[m] ?? 0])),
        الإجمالي: s.total,
      })),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تحليل المصروفات</h1>
          <p className="text-sm text-gray-500">Expense Analysis</p>
        </div>
        <ExportButton fileName="تحليل-المصروفات" getSheets={getSheets} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مصروفات التشغيل حسب البند + إجمالي المصروفات الإدارية شهريًا</CardTitle>
        </CardHeader>
        <CardContent>
          <StackedBarChart data={stackedData} series={stackedSeriesKeys} xKey="label" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نسبة كل بند من مصروفات التشغيل إلى الإيراد شهريًا</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiLineChart
            data={pctLineData}
            xKey="label"
            series={opexTop.filter((r) => r.label !== "أخرى").map((r) => ({ key: r.label, name: r.label }))}
            yTickFormatter={(v) => `${v}%`}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تركيبة مصروفات التشغيل</CardTitle>
          </CardHeader>
          <CardContent>
            {opexTop.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">لا توجد بيانات</p>
            ) : (
              <DonutChart data={opexTop} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تركيبة المصروفات الإدارية والعمومية</CardTitle>
          </CardHeader>
          <CardContent>
            {adminTop.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">لا توجد بيانات</p>
            ) : (
              <DonutChart data={adminTop} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            التغير الشهري (Month-over-Month) لمصروفات التشغيل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {momRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">يلزم توفر شهرين على الأقل لعرض المقارنة</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البند</TableHead>
                  <TableHead className="text-end">الشهر السابق</TableHead>
                  <TableHead className="text-end">الشهر الحالي</TableHead>
                  <TableHead className="text-end">التغير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {momRows.map((r) => (
                  <TableRow key={r.label}>
                    <TableCell>{r.label}</TableCell>
                    <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.previousVal)}</TableCell>
                    <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.currentVal)}</TableCell>
                    <TableCell className="text-end">{alertBadge(r.change)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل مصروفات التشغيل (كل البنود)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البند</TableHead>
                {months.map((m) => (
                  <TableHead key={m} className="text-end whitespace-nowrap">{monthKeyToLabel(m)}</TableHead>
                ))}
                <TableHead className="text-end">الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opexSeries.map((s) => (
                <TableRow key={s.subAccount}>
                  <TableCell>{s.subAccount}</TableCell>
                  {months.map((m) => (
                    <TableCell key={m} className="text-end tabular-nums" dir="ltr">
                      {formatNumber(s.amounts[m] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-end tabular-nums font-semibold" dir="ltr">
                    {formatNumber(s.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المصروفات الإدارية والعمومية (كل البنود)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البند</TableHead>
                {months.map((m) => (
                  <TableHead key={m} className="text-end whitespace-nowrap">{monthKeyToLabel(m)}</TableHead>
                ))}
                <TableHead className="text-end">الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminSeries.map((s) => (
                <TableRow key={s.subAccount}>
                  <TableCell>{s.subAccount}</TableCell>
                  {months.map((m) => (
                    <TableCell key={m} className="text-end tabular-nums" dir="ltr">
                      {formatNumber(s.amounts[m] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-end tabular-nums font-semibold" dir="ltr">
                    {formatNumber(s.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
