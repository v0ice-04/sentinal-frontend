import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/incidents-data";

const styles: Record<Severity, string> = {
  CRITICAL: "text-error bg-[oklch(0.62_0.24_27/0.12)] border-[oklch(0.62_0.24_27/0.35)]",
  HIGH:     "text-warning bg-[oklch(0.78_0.16_70/0.12)] border-[oklch(0.78_0.16_70/0.35)]",
  MEDIUM:   "text-[oklch(0.85_0.16_95)] bg-[oklch(0.85_0.16_95/0.10)] border-[oklch(0.85_0.16_95/0.30)]",
  LOW:      "text-link bg-[oklch(0.65_0.20_254/0.12)] border-[oklch(0.65_0.20_254/0.3)]",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-xs border text-[10px] font-semibold font-mono tracking-wider",
        styles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

export function severityDot(severity: Severity) {
  return {
    CRITICAL: "oklch(0.62 0.24 27)",
    HIGH: "oklch(0.78 0.16 70)",
    MEDIUM: "oklch(0.85 0.16 95)",
    LOW: "oklch(0.65 0.20 254)",
  }[severity];
}
