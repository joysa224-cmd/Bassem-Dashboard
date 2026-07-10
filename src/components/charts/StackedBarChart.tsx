"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CATEGORICAL_COLORS, CHART_CHROME } from "@/lib/chartTheme";
import { ChartTooltip } from "./ChartTooltip";
import type { BarSeries } from "./GroupedBarChart";

interface StackedBarChartProps {
  data: Record<string, string | number>[];
  series: BarSeries[];
  xKey: string;
  height?: number;
}

export function StackedBarChart({ data, series, xKey, height = 380 }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }} barCategoryGap={28}>
        <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
          axisLine={{ stroke: CHART_CHROME.axis }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => v.toLocaleString("en-US")}
          width={70}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId="stack"
            fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
