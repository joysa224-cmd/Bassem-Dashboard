"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CATEGORICAL_COLORS, CHART_CHROME } from "@/lib/chartTheme";
import { ChartTooltip } from "./ChartTooltip";

export interface LineSeries {
  key: string;
  name: string;
}

interface MultiLineChartProps {
  data: Record<string, string | number>[];
  series: LineSeries[];
  xKey: string;
  height?: number;
  yTickFormatter?: (v: number) => string;
}

export function MultiLineChart({ data, series, xKey, height = 340, yTickFormatter }: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
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
          tickFormatter={yTickFormatter ?? ((v: number) => v.toLocaleString("en-US"))}
          width={70}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
