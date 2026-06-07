import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { DeploymentStatus } from "@/types";
import type { RiskScore } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: DeploymentStatus }) {
  const map = {
    success: { label: "Success", cls: "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.25)]", Icon: CheckCircle2 },
    failed: { label: "Failed", cls: "text-error bg-[oklch(0.62_0.24_27/0.12)] border-[oklch(0.62_0.24_27/0.3)]", Icon: XCircle },
    building: { label: "In Progress", cls: "text-link bg-[oklch(0.65_0.20_254/0.12)] border-[oklch(0.65_0.20_254/0.3)]", Icon: Loader2 },
    queued: { label: "Queued", cls: "text-mute bg-canvas-soft-2 border-border", Icon: Loader2 },
  } as const;
  const { label, cls, Icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 h-5 px-1.5 rounded-xs border text-[11px] font-medium font-mono", cls)}>
      <Icon className={cn("h-3 w-3", status === "building" && "animate-spin")} />
      {label}
    </span>
  );
}

export function RiskPill({ risk }: { risk: RiskScore }) {
  const map: Record<RiskScore, string> = {
    LOW: "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.25)]",
    MEDIUM: "text-warning bg-[oklch(0.78_0.16_70/0.12)] border-[oklch(0.78_0.16_70/0.3)]",
    HIGH: "text-error bg-[oklch(0.62_0.24_27/0.12)] border-[oklch(0.62_0.24_27/0.3)]",
  };
  return (
    <span className={cn("inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-semibold font-mono tracking-wider", map[risk])}>
      {risk}
    </span>
  );
}

export function ServiceDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />;
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-canvas-soft-2 border border-border text-[10px] font-mono text-foreground">
      {initials}
    </span>
  );
}
