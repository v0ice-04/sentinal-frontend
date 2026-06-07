import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, ShieldCheck, Plus, Loader2, RefreshCw } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SeverityBadge, severityDot } from "@/components/dashboard/SeverityBadge";
import { ReportIncidentDialog } from "@/components/dashboard/ReportIncidentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllMemories, useInvalidateMemories } from "@/lib/queries";
import { deriveActivity, type DerivedIncident, type Severity } from "@/lib/serviceActivity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — SentinelAI" },
      { name: "description", content: "Production incidents and what SentinelAI learned from them." },
    ],
  }),
  component: IncidentsPage,
});

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ACTIVE_WINDOW_MS = 14 * 86_400_000;

function IncidentsPage() {
  const live = useAllMemories();
  const invalidate = useInvalidateMemories();
  const [filter, setFilter] = useState<Severity | null>(null);
  const [open, setOpen] = useState<DerivedIncident | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const activity = useMemo(() => deriveActivity(live.all), [live.all]);
  const now = Date.now();

  const allIncidents = filter
    ? activity.incidents.filter((i) => i.severity === filter)
    : activity.incidents;

  const activeIncidents = allIncidents.filter((i) => now - i.occurredAt <= ACTIVE_WINDOW_MS);
  const resolvedIncidents = allIncidents.filter((i) => now - i.occurredAt > ACTIVE_WINDOW_MS);

  return (
    <PageWrapper
      title="Incidents"
      description="Derived live from the SentinelAI memory bank — past 14 days are surfaced as recent, older incidents are resolved knowledge."
      actions={
        <div className="flex items-center gap-2">
          <Pill tone="error">{activeIncidents.length} Recent</Pill>
          <Pill tone="success">{resolvedIncidents.length} Resolved</Pill>
          <button
            onClick={() => invalidate()}
            disabled={live.isFetching}
            className="h-7 w-7 grid place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-canvas-soft"
            title="Refresh"
          >
            {live.isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="h-7 px-2.5 rounded-sm bg-foreground text-background text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" /> Report Incident
          </button>
        </div>
      }
    >
      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {SEV_ORDER.map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter((f) => (f === sev ? null : sev))}
            className={cn(
              "text-left rounded-md border p-4 transition-colors",
              filter === sev
                ? "border-hairline-strong bg-canvas-soft-2"
                : "border-border bg-card hover:bg-canvas-soft/60",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono text-mute">
                <span className="h-2 w-2 rounded-full" style={{ background: severityDot(sev) }} />
                {sev}
              </span>
              <SeverityBadge severity={sev} />
            </div>
            <div className="text-[28px] leading-8 font-semibold tracking-tight text-foreground">
              {live.isLoading ? "—" : activity.severityCounts[sev]}
            </div>
          </button>
        ))}
      </div>

      {filter && (
        <div className="mb-4 -mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">Filtered by</span>
          <SeverityBadge severity={filter} />
          <button onClick={() => setFilter(null)} className="text-link hover:underline">clear</button>
        </div>
      )}

      {live.isLoading && (
        <div className="rounded-md border border-border bg-card p-10 grid place-items-center mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-mute" />
        </div>
      )}

      {!live.isLoading && allIncidents.length === 0 && (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground mb-4">
          No incidents in memory yet. Report one to seed SentinelAI's knowledge.
        </div>
      )}

      {/* Active / Recent */}
      {activeIncidents.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={AlertCircle} title="Recent (last 14 days)" count={activeIncidents.length} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {activeIncidents.slice(0, 9).map((i) => (
              <article
                key={i.id}
                onClick={() => setOpen(i)}
                className="rounded-md border border-border bg-card p-4 flex flex-col cursor-pointer hover:bg-canvas-soft/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <SeverityBadge severity={i.severity} />
                  <span className="text-[11px] font-mono text-mute">{i.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight leading-snug line-clamp-2">
                  {i.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{i.service}</span>
                </div>
                <p className="mt-3 text-xs text-body-fg leading-relaxed line-clamp-3">{i.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Resolved */}
      {resolvedIncidents.length > 0 && (
        <section>
          <SectionHeading icon={ShieldCheck} title="Resolved" count={resolvedIncidents.length} />
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-canvas-soft border-b border-border">
                    {["Severity", "Title", "Service", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-[11px] uppercase tracking-wider text-mute font-mono font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resolvedIncidents.map((i) => (
                    <tr key={i.id} className="border-b border-border last:border-b-0 hover:bg-canvas-soft/40">
                      <td className="px-4 py-3"><SeverityBadge severity={i.severity} /></td>
                      <td className="px-4 py-3 text-foreground max-w-md truncate">{i.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.service}</td>
                      <td className="px-4 py-3 font-mono text-xs text-mute">{i.date}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setOpen(i)} className="text-xs text-link hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <LessonsModal incident={open} onClose={() => setOpen(null)} />
      <ReportIncidentDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </PageWrapper>
  );
}

function SectionHeading({ icon: Icon, title, count }: { icon: any; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-foreground" />
      <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
      <span className="text-[11px] font-mono text-mute">({count})</span>
    </div>
  );
}

function Pill({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const cls =
    tone === "error"
      ? "text-error bg-[oklch(0.62_0.24_27/0.12)] border-[oklch(0.62_0.24_27/0.3)]"
      : "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.25)]";
  return (
    <span className={cn("inline-flex items-center h-7 px-2.5 rounded-full border text-xs font-medium font-mono", cls)}>
      {tone === "error" && <span className="h-1.5 w-1.5 rounded-full bg-error mr-1.5 animate-pulse" />}
      {children}
    </span>
  );
}

function LessonsModal({ incident, onClose }: { incident: DerivedIncident | null; onClose: () => void }) {
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        {incident && (
          <>
            <DialogHeader className="p-5 border-b border-border space-y-2 text-left">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={incident.severity} />
                <span className="text-[11px] font-mono text-mute">{incident.service}</span>
                <span className="text-[11px] font-mono text-mute">·</span>
                <span className="text-[11px] font-mono text-mute">{incident.date}</span>
              </div>
              <DialogTitle className="text-foreground text-lg font-semibold tracking-tight">
                {incident.title}
              </DialogTitle>
            </DialogHeader>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <Block label="Memory text">
                <p className="text-sm text-body-fg leading-relaxed">{incident.description}</p>
              </Block>
              <Block label="Fact type">
                <p className="text-sm text-foreground font-mono">{incident.source.fact_type}</p>
              </Block>
              {incident.source.context && (
                <Block label="Context">
                  <p className="text-sm text-foreground">{incident.source.context}</p>
                </Block>
              )}
              <Block label="Retrieved at">
                <p className="text-xs text-mute font-mono">{new Date(incident.source.retrieved_at).toLocaleString()}</p>
              </Block>
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <button onClick={onClose} className="h-8 px-3 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90">
                Close
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-mono text-mute mb-1.5">{label}</div>
      {children}
    </div>
  );
}
