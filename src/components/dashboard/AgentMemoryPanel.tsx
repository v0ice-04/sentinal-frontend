import { useEffect, useState } from "react";
import { Brain, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { getMemoriesBackend, type MemoryItem } from "@/lib/sentinelBackend";

const SERVICES = ["auth-service", "payment-service", "api-gateway", "frontend", "worker"];

function factTypeLabel(t: string) {
  const x = t.toLowerCase();
  if (x.includes("experience")) return "experience";
  if (x.includes("observation")) return "observation";
  if (x.includes("world")) return "world";
  return t;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}

export function AgentMemoryPanel() {
  const [service, setService] = useState<string>("auth-service");
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMemoriesBackend(service)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load memories");
        setItems([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [service]);

  const visible = items.slice(0, 6);

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="p-5 pb-3 border-b border-border bg-mesh">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 grid place-items-center rounded-sm bg-foreground text-background">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Agent Memory Hits
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              live · {loading ? "loading" : `${items.length} memories`} · {service}
            </p>
          </div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="h-7 text-xs px-2 rounded-sm bg-canvas-soft border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-8 grid place-items-center text-mute">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 m-4 rounded-sm border border-border bg-canvas-soft-2 text-xs text-muted-foreground flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="p-6 text-xs text-mute font-mono text-center">no memories for this service</div>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="divide-y divide-border">
          {visible.map((m, i) => (
            <li key={i} className="p-4 hover:bg-canvas-soft/50">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-mute">
                  <Sparkles className="h-3 w-3 text-cyan" />
                  {factTypeLabel(m.fact_type)}
                </span>
                <span className="text-[11px] text-mute font-mono">{formatDate(m.occurred_start)}</span>
              </div>
              <div className="mt-2 rounded-sm border border-border bg-canvas-soft-2 p-3">
                <p className="text-xs text-body-fg leading-relaxed">{m.text}</p>
                {m.context && (
                  <div className="mt-2 text-[11px] font-mono text-link">{m.context}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
