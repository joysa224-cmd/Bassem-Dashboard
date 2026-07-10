"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { CATEGORICAL_COLORS } from "@/lib/chartTheme";
import { formatNumber } from "@/lib/utils";

interface DonutChartProps {
  data: { label: string; amount: number }[];
  height?: number;
}

export function DonutChart({ data, height = 340 }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="label"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          cornerRadius={4}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} layout="horizontal" />
      </PieChart>
    </ResponsiveContainer>
  );
}
