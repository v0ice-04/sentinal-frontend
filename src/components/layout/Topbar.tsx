import { useEffect, useState } from "react";
import { Search, Bell, GitBranch, Plus } from "lucide-react";
import { useDeploy } from "@/lib/deploy-context";
import { getBackendHealth } from "@/lib/sentinelBackend";
import { cn } from "@/lib/utils";

type Status = "checking" | "online" | "offline";

export function Topbar() {
  const { openDeploy } = useDeploy();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    const ping = () =>
      getBackendHealth()
        .then(() => !cancelled && setStatus("online"))
        .catch(() => !cancelled && setStatus("offline"));
    ping();
    const id = window.setInterval(ping, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const dot =
    status === "online"
      ? "bg-[oklch(0.78_0.17_155)]"
      : status === "offline"
        ? "bg-error"
        : "bg-mute animate-pulse";
  const label = status === "online" ? "backend live" : status === "offline" ? "backend offline" : "checking…";

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center px-4 gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
        <GitBranch className="h-3.5 w-3.5" />
        <span>main</span>
        <span className="text-hairline-strong">/</span>
        <span className="text-foreground">production</span>
      </div>
      <div className="flex-1 max-w-md ml-4 relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mute" />
        <input
          type="text"
          placeholder="Search deployments, incidents…"
          className="w-full h-8 pl-8 pr-3 rounded-sm bg-canvas-soft border border-border text-sm placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          title={label}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-border text-[11px] font-mono text-muted-foreground"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {label}
        </span>
        <button className="h-8 w-8 grid place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent">
          <Bell className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={openDeploy}
          className="h-8 px-3 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> New Deploy
        </button>
      </div>
    </header>
  );
}
