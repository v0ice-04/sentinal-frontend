import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  trend?: number;
  trendInvert?: boolean; // true when "down is good" (e.g. deploy time)
  accent?: "default" | "success" | "warning" | "error";
  badge?: ReactNode;
}

const accentText: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "text-foreground",
  success: "text-[oklch(0.78_0.17_155)]",
  warning: "text-warning",
  error: "text-error",
};

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendInvert = false,
  accent = "default",
  badge,
}: StatCardProps) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const isGood = trendInvert ? trendDown : trendUp;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-mute font-mono">
          {label}
        </span>
        {badge}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("text-[28px] leading-8 font-semibold tracking-tight", accentText[accent])}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-mono",
            isGood ? "text-[oklch(0.78_0.17_155)]" : "text-mute",
          )}
        >
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend > 0 ? "+" : ""}
          {trend}
          <span className="text-mute ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}
