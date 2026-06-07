import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { StatusBadge, RiskPill, ServiceDot } from "./Badges";
import { serviceColor, formatDuration } from "@/lib/deployments-data";
import { useDeploy } from "@/lib/deploy-context";

export function RecentDeployments() {
  const { extraRows, openDeploy } = useDeploy();

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Recent deployments
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live · deploys triggered in this session
          </p>
        </div>
        <Link
          to="/deployments"
          className="inline-flex items-center gap-1 text-xs text-link hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {extraRows.length === 0 ? (
        <div className="p-8 border-t border-border bg-canvas-soft/40 text-center">
          <p className="text-sm text-muted-foreground">
            No deploys yet. Run one through SentinelAI to see it appear here in real time.
          </p>
          <button
            onClick={openDeploy}
            className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-foreground text-background text-xs font-medium hover:opacity-90"
          >
            <Play className="h-3 w-3" /> Trigger Deploy
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border bg-canvas-soft">
                {["Service", "Branch", "Status", "Triggered by", "Duration", "Risk"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-2 text-[11px] uppercase tracking-wider text-mute font-mono font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {extraRows.slice(0, 8).map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-canvas-soft/50">
                  <td className="px-5 py-3 text-foreground font-medium">
                    <span className="inline-flex items-center gap-2">
                      <ServiceDot color={serviceColor(d.service)} />
                      {d.service}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{d.branch}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{d.author}</td>
                  <td className="px-5 py-3 text-mute font-mono text-xs">{formatDuration(d.durationMs)}</td>
                  <td className="px-5 py-3"><RiskPill risk={d.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
