import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Play } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge, RiskPill, ServiceDot, Avatar } from "@/components/dashboard/Badges";
import { DeploymentDetailPanel } from "@/components/dashboard/DeploymentDetailPanel";
import {
  serviceColor,
  formatDuration,
  type FullDeployment,
} from "@/lib/deployments-data";
import { useDeploy } from "@/lib/deploy-context";

export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments — SentinelAI" },
      { name: "description", content: "Deploys triggered through SentinelAI in this session." },
    ],
  }),
  component: DeploymentsPage,
});

import { useActiveServices } from "@/lib/queries";

const STATUS_OPTIONS = ["All", "Success", "Failed", "In Progress"];

function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-mono text-mute pointer-events-none">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-[58px] pr-7 rounded-sm bg-canvas-soft border border-border text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function DeploymentsPage() {
  const [open, setOpen] = useState<FullDeployment | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [service, setService] = useState("All");
  const { openDeploy, extraRows } = useDeploy();
  const services = useActiveServices();

  const serviceOptions = useMemo(() => ["All", ...services], [services]);

  const rows = useMemo(() => {
    return extraRows.filter((d) => {
      if (service !== "All" && d.service !== service) return false;
      if (status === "Success" && d.status !== "success") return false;
      if (status === "Failed" && d.status !== "failed") return false;
      if (status === "In Progress" && d.status !== "building" && d.status !== "queued") return false;
      const q = search.trim().toLowerCase();
      if (q && !(`${d.service} ${d.branch} ${d.message}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [extraRows, service, status, search]);

  return (
    <PageWrapper
      title="Deployments"
      description="Deploys triggered through SentinelAI in this session. Trigger a new one to populate this list."
      actions={
        <button
          onClick={openDeploy}
          className="h-8 px-3 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5"
        >
          <Play className="h-3 w-3" /> Trigger Deploy
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service, branch, or commit message..."
            className="w-full h-8 pl-8 pr-3 rounded-sm bg-canvas-soft border border-border text-sm placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong"
          />
        </div>
        <Select label="STATUS" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <Select label="SERVICE" value={service} onChange={setService} options={serviceOptions} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-12 text-center">
          <p className="text-sm text-foreground font-medium">No deploys yet</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
            Trigger a deploy through SentinelAI — it runs live against the backend
            and the result appears here instantly.
          </p>
          <button
            onClick={openDeploy}
            className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-foreground text-background text-xs font-medium hover:opacity-90"
          >
            <Play className="h-3 w-3" /> Trigger Deploy
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas-soft border-b border-border">
                  {["#", "Service", "Branch", "Commit", "Status", "Duration", "Triggered by", "Risk", "Time", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[11px] uppercase tracking-wider text-mute font-mono font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-canvas-soft/40">
                    <td className="px-4 py-3 font-mono text-xs text-mute whitespace-nowrap">#{d.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 text-foreground">
                        <ServiceDot color={serviceColor(d.service)} />
                        {d.service}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{d.branch}</td>
                    <td className="px-4 py-3 font-mono text-xs text-mute whitespace-nowrap">{d.sha}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDuration(d.durationMs)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Avatar name={d.author} />
                        <span className="text-foreground text-xs">{d.author}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><RiskPill risk={d.risk} /></td>
                    <td className="px-4 py-3 text-xs text-mute font-mono whitespace-nowrap">{d.at}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setOpen(d)}
                        className="text-xs text-link hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeploymentDetailPanel deployment={open} onClose={() => setOpen(null)} />
    </PageWrapper>
  );
}
