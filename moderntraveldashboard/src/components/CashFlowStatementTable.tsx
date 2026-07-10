import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";
import type { CashFlowMonth } from "@/lib/types";

function amountFor(list: { label: string; amount: number }[], label: string) {
  return list.find((i) => i.label === label)?.amount ?? 0;
}

export function CashFlowStatementTable({ months }: { months: CashFlowMonth[] }) {
  const inflowLabels = Array.from(new Set(months.flatMap((m) => m.inflows.map((i) => i.label))));
  const outflowLabels = Array.from(new Set(months.flatMap((m) => m.outflows.map((i) => i.label))));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky start-0 bg-gray-50">البيان</TableHead>
          {months.map((m) => (
            <TableHead key={m.monthKey} className="text-end whitespace-nowrap">
              {m.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="font-semibold">
          <TableCell className="sticky start-0 bg-white">رصيد أول المدة</TableCell>
          {months.map((m) => (
            <TableCell key={m.monthKey} className="text-end tabular-nums" dir="ltr">
              {formatNumber(m.opening)}
            </TableCell>
          ))}
        </TableRow>

        <TableRow className="bg-gray-50 hover:bg-gray-50">
          <TableCell colSpan={months.length + 1} className="sticky start-0 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            التدفقات الداخلة
          </TableCell>
        </TableRow>
        {inflowLabels.map((label) => (
          <TableRow key={label}>
            <TableCell className="sticky start-0 bg-white ps-8">{label}</TableCell>
            {months.map((m) => (
              <TableCell key={m.monthKey} className="text-end tabular-nums" dir="ltr">
                {formatNumber(amountFor(m.inflows, label))}
              </TableCell>
            ))}
          </TableRow>
        ))}
        <TableRow className="border-t border-gray-200 font-semibold">
          <TableCell className="sticky start-0 bg-white">إجمالي التدفقات الداخلة</TableCell>
          {months.map((m) => (
            <TableCell key={m.monthKey} className="text-end tabular-nums text-emerald-600" dir="ltr">
              {formatNumber(m.totalInflows)}
            </TableCell>
          ))}
        </TableRow>

        <TableRow className="bg-gray-50 hover:bg-gray-50">
          <TableCell colSpan={months.length + 1} className="sticky start-0 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            التدفقات الخارجة
          </TableCell>
        </TableRow>
        {outflowLabels.map((label) => (
          <TableRow key={label}>
            <TableCell className="sticky start-0 bg-white ps-8">{label}</TableCell>
            {months.map((m) => (
              <TableCell key={m.monthKey} className="text-end tabular-nums" dir="ltr">
                {formatNumber(amountFor(m.outflows, label))}
              </TableCell>
            ))}
          </TableRow>
        ))}
        <TableRow className="border-t border-gray-200 font-semibold">
          <TableCell className="sticky start-0 bg-white">إجمالي التدفقات الخارجة</TableCell>
          {months.map((m) => (
            <TableCell key={m.monthKey} className="text-end tabular-nums text-red-600" dir="ltr">
              {formatNumber(m.totalOutflows)}
            </TableCell>
          ))}
        </TableRow>

        <TableRow className="border-t-2 border-gray-300 bg-gray-50/60 font-bold hover:bg-gray-50">
          <TableCell className={cn("sticky start-0 bg-gray-50/60")}>رصيد آخر المدة</TableCell>
          {months.map((m) => (
            <TableCell key={m.monthKey} className="text-end tabular-nums" dir="ltr">
              {formatNumber(m.closing)}
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}
