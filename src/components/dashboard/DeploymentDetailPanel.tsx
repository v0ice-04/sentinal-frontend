import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Brain, GitCommit, Clock, User, Server, Sparkles, ShieldAlert } from "lucide-react";
import { StatusBadge, RiskPill, ServiceDot, Avatar } from "./Badges";
import {
  type FullDeployment,
  formatDuration,
  fakeLogs,
  riskRecommendation,
  serviceColor,
} from "@/lib/deployments-data";
import { useQuery } from "@tanstack/react-query";
import { memoriesQueryOptions } from "@/lib/queries";
import type { MemoryItem } from "@/lib/sentinelBackend";

interface Props {
  deployment: FullDeployment | null;
  onClose: () => void;
}

export function DeploymentDetailPanel({ deployment, onClose }: Props) {
  return (
    <Sheet open={!!deployment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] bg-background border-l border-border p-0 overflow-y-auto"
      >
        {deployment && <Body d={deployment} />}
      </SheetContent>
    </Sheet>
  );
}

function Meta({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon className="h-3.5 w-3.5 text-mute mt-0.5 shrink-0" />
      <div className="flex-1 flex items-baseline justify-between gap-3 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-mute font-mono">{label}</span>
        <span className="text-sm text-foreground truncate text-right">{children}</span>
      </div>
    </div>
  );
}

function Body({ d }: { d: FullDeployment }) {
  const { data: memoryItems = [] } = useQuery(memoriesQueryOptions(d.service));
  const memories = memoryItems.slice(0, 4).map((m: MemoryItem) => ({
    title: m.text.split(" | ")[0].slice(0, 110),
    date: m.occurred_start ? m.occurred_start.slice(0, 10) : "—",
    learned: m.text,
  }));
  const logs = fakeLogs(d);

  return (
    <>
      <SheetHeader className="p-5 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-mute">#{d.id}</span>
          <StatusBadge status={d.status} />
          <RiskPill risk={d.risk} />
        </div>
        <SheetTitle className="text-foreground text-lg font-semibold tracking-tight">
          {d.message}
        </SheetTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <ServiceDot color={serviceColor(d.service)} />
          {d.service}
          <span className="text-hairline-strong">/</span>
          <span>{d.branch}</span>
        </div>
      </SheetHeader>

      {/* Metadata */}
      <section className="p-5 border-b border-border">
        <h3 className="text-[11px] uppercase tracking-wider text-mute font-mono mb-1">Metadata</h3>
        <div className="divide-y divide-border">
          <Meta icon={GitCommit} label="Commit"><span className="font-mono">{d.sha}</span></Meta>
          <Meta icon={Server} label="Environment"><span className="font-mono">{d.env}</span></Meta>
          <Meta icon={Clock} label="Duration"><span className="font-mono">{formatDuration(d.durationMs)}</span></Meta>
          <Meta icon={User} label="Triggered by">
            <span className="inline-flex items-center gap-1.5"><Avatar name={d.author} />{d.author}</span>
          </Meta>
          <Meta icon={Clock} label="When"><span className="font-mono text-mute">{d.at}</span></Meta>
        </div>
      </section>

      {/* Logs */}
      <section className="p-5 border-b border-border">
        <h3 className="text-[11px] uppercase tracking-wider text-mute font-mono mb-2">Build logs</h3>
        <pre className="rounded-sm border border-border bg-canvas-soft-2 p-3 text-[12px] leading-5 font-mono text-body-fg overflow-x-auto max-h-72">
          {logs.join("\n")}
        </pre>
      </section>

      {/* Agent memory */}
      <section className="p-5 border-b border-border bg-mesh/0">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 grid place-items-center rounded-sm bg-foreground text-background">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              What SentinelAI Remembered
            </h3>
            <p className="text-[11px] text-mute font-mono">past events recalled for this deploy</p>
          </div>
        </div>

        <ul className="space-y-2">
          {memories.map((m, i) => (
            <li key={i} className="rounded-md border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-mute">
                  <Sparkles className="h-3 w-3 text-cyan" /> memory hit
                </span>
                <span className="text-[11px] text-mute font-mono">{m.date}</span>
              </div>
              <p className="mt-1 text-sm text-foreground leading-snug">{m.title}</p>
              <div className="mt-2 rounded-sm border border-border bg-canvas-soft-2 p-2.5">
                <div className="text-[10px] uppercase tracking-wider font-mono text-mute mb-1">
                  what was learned
                </div>
                <p className="text-xs text-body-fg leading-relaxed">{m.learned}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Risk assessment */}
      <section className="p-5">
        <div className="rounded-md border border-border bg-canvas-soft-2 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Risk Assessment
            </h3>
            <span className="ml-auto"><RiskPill risk={d.risk} /></span>
          </div>
          <p className="text-sm text-body-fg leading-relaxed">{riskRecommendation(d)}</p>
        </div>
      </section>
    </>
  );
}
