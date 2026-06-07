import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatCard } from "@/components/dashboard/StatCard";
import { DeploymentTimeline } from "@/components/dashboard/DeploymentTimeline";
import { RecentDeployments } from "@/components/dashboard/RecentDeployments";
import { AgentMemoryPanel } from "@/components/dashboard/AgentMemoryPanel";
import { useAllMemories, useInvalidateMemories } from "@/lib/queries";
import { deriveActivity } from "@/lib/serviceActivity";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SentinelAI" },
      { name: "description", content: "DevOps SentinelAI overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const live = useAllMemories();
  const invalidate = useInvalidateMemories();
  const activity = useMemo(() => deriveActivity(live.all), [live.all]);

  const criticalHigh = activity.severityCounts.CRITICAL + activity.severityCounts.HIGH;

  return (
    <PageWrapper
      title="Pipeline Overview"
      description="AI agent that remembers deployment history, predicts risks, and recommends preventive actions."
      actions={
        <button
          onClick={() => invalidate()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border text-sm text-foreground hover:bg-canvas-soft"
          disabled={live.isFetching}
        >
          {live.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      }
    >
      {/* Top stats — derived from live memory bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total memories"
          value={live.isLoading ? "—" : activity.total}
          unit="recalled"
        />
        <StatCard
          label="High + Critical signals"
          value={live.isLoading ? "—" : criticalHigh}
          accent={criticalHigh > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Services tracked"
          value={live.isLoading ? "—" : activity.servicesTracked}
          unit={`/ 5`}
        />
        <StatCard
          label="Last incident"
          value={activity.lastIncidentDate ?? "—"}
        />
      </div>

      {live.error && (
        <div className="mt-4 rounded-md border border-border bg-canvas-soft-2 p-3 text-xs text-muted-foreground">
          Backend error: {String((live.error as Error).message ?? live.error)}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <DeploymentTimeline data={activity.byDate} />
          <RecentDeployments />
        </div>
        <div className="lg:col-span-1">
          <AgentMemoryPanel />
        </div>
      </div>
    </PageWrapper>
  );
}
