export const CATEGORICAL_COLORS = [
  "#00aa6c", // brand green
  "#2a78d6", // blue
  "#eb6834", // orange
  "#4a3aa7", // violet
  "#e34948", // red
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#1baf7a", // aqua
];

export const CHART_CHROME = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  mutedText: "#898781",
  primaryText: "#0b0b0b",
};

export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export function seriesColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

/** Groups long tails into "أخرى" so charts never exceed the validated palette size. */
export function topNWithOther<T extends { label: string; amount: number }>(
  rows: T[],
  n = CATEGORICAL_COLORS.length
): { label: string; amount: number }[] {
  if (rows.length <= n) return rows;
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, n - 1);
  const rest = sorted.slice(n - 1);
  const otherTotal = rest.reduce((s, r) => s + r.amount, 0);
  return [...top, { label: "أخرى", amount: otherTotal }];
}
