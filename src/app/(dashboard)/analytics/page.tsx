"use client";

import { useMemo } from "react";
import { Clock, Hourglass, Users, Truck } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { LoadingState, EmptyState, ErrorState } from "@/components/EmptyState";
import { KPICard } from "@/components/KPICard";
import { ExportButton } from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import { computeCollectionsAnalytics } from "@/lib/dataProcessor";
import { formatNumber } from "@/lib/utils";

export default function AnalyticsPage() {
  const { transactions, stage, error } = useData();

  const rows = useMemo(() => computeCollectionsAnalytics(transactions), [transactions]);
  const latest = rows[rows.length - 1];

  if (stage === "loading") return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (transactions.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحصيل والمدفوعات</h1>
          <p className="text-sm text-gray-500">Collections &amp; Payments Analytics</p>
        </div>
        <ExportButton
          fileName="التحصيل-والمدفوعات"
          getSheets={() => [
            {
              sheetName: "Collections",
              rows: rows.map((r) => ({
                الشهر: r.label,
                الإيرادات: r.revenue,
                المصروفات: r.expenses,
                "رصيد العملاء": r.arBalance,
                "رصيد الموردين": r.apBalance,
                DSO: r.dso.toFixed(2),
                DPO: r.dpo.toFixed(2),
                التحصيلات: r.collections,
                المدفوعات: r.payments,
              })),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="DSO (أيام)" value={latest?.dso ?? 0} icon={Clock} suffix="يوم" />
        <KPICard title="DPO (أيام)" value={latest?.dpo ?? 0} icon={Hourglass} suffix="يوم" />
        <KPICard title="رصيد العملاء الحالي" value={latest?.arBalance ?? 0} icon={Users} />
        <KPICard title="رصيد الموردين الحالي" value={latest?.apBalance ?? 0} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اتجاه DSO / DPO</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={rows.map((r) => ({ label: r.label, DSO: Number(r.dso.toFixed(1)), DPO: Number(r.dpo.toFixed(1)) }))}
              xKey="label"
              series={[
                { key: "DSO", name: "DSO (أيام)" },
                { key: "DPO", name: "DPO (أيام)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>رصيد العملاء مقابل رصيد الموردين</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={rows.map((r) => ({ label: r.label, "رصيد العملاء": r.arBalance, "رصيد الموردين": r.apBalance }))}
              xKey="label"
              series={[
                { key: "رصيد العملاء", name: "رصيد العملاء" },
                { key: "رصيد الموردين", name: "رصيد الموردين" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإيرادات مقابل التحصيلات الفعلية</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupedBarChart
            data={rows.map((r) => ({ label: r.label, الإيرادات: r.revenue, التحصيلات: r.collections }))}
            xKey="label"
            series={[
              { key: "الإيرادات", name: "الإيرادات" },
              { key: "التحصيلات", name: "التحصيلات الفعلية" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل شهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشهر</TableHead>
                <TableHead className="text-end">الإيرادات</TableHead>
                <TableHead className="text-end">المصروفات</TableHead>
                <TableHead className="text-end">رصيد العملاء</TableHead>
                <TableHead className="text-end">رصيد الموردين</TableHead>
                <TableHead className="text-end">DSO</TableHead>
                <TableHead className="text-end">DPO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.monthKey}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.revenue)}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.expenses)}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.arBalance)}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.apBalance)}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.dso)}</TableCell>
                  <TableCell className="text-end tabular-nums" dir="ltr">{formatNumber(r.dpo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
