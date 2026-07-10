import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  isPercent?: boolean;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative";
  suffix?: string;
}

export function KPICard({ title, value, isPercent, icon: Icon, tone = "default", suffix }: KPICardProps) {
  const toneClass =
    tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-gray-900";

  const formatted = isPercent ? formatPercent(value) : formatNumber(value);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-500">{title}</span>
          <span
            className={cn("break-words text-xl font-bold tabular-nums leading-tight", toneClass)}
            dir="ltr"
            title={formatted}
          >
            {formatted}
            {suffix ? <span className="ms-1 text-sm font-medium text-gray-400">{suffix}</span> : null}
          </span>
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
