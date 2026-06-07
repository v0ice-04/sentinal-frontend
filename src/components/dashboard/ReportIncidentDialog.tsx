import { useState } from "react";
import { X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  reportIncidentBackend,
  SENTINEL_API_BASE,
  type BackendSeverity,
  type IncidentReport,
} from "@/lib/sentinelBackend";
import { useInvalidateMemories, useActiveServices } from "@/lib/queries";
import { cn } from "@/lib/utils";

const SEVS: BackendSeverity[] = ["low", "medium", "high", "critical"];

const inputCls =
  "w-full h-8 px-2.5 rounded-sm bg-canvas-soft border border-border text-sm text-foreground placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong";
const textareaCls =
  "w-full px-2.5 py-2 rounded-sm bg-canvas-soft border border-border text-sm text-foreground placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong resize-y min-h-[64px]";
const selectCls = inputCls + " appearance-none pr-7";

interface Props {
  open: boolean;
  onClose: () => void;
  onReported?: () => void;
}

export function ReportIncidentDialog({ open, onClose, onReported }: Props) {
  const invalidate = useInvalidateMemories();
  const services = useActiveServices();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<IncidentReport>({
    service: "auth-service",
    severity: "high",
    date: new Date().toISOString().slice(0, 10),
    root_cause: "",
    resolution: "",
    trigger: "code-deploy",
    downtime_minutes: 15,
  });

  // Make sure selected service is valid in case services list changes, or keep default
  if (!services.includes(form.service) && services.length > 0) {
    setForm(f => ({ ...f, service: services[0] }));
  }

  if (!open) return null;

  function update<K extends keyof IncidentReport>(k: K, v: IncidentReport[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Lookup API key for this service
      let apiKey = "";
      try {
        const res = await fetch(`${SENTINEL_API_BASE}/api/v1/projects/`);
        if (res.ok) {
          const projects = await res.json() as { name: string; api_key: string }[];
          const proj = projects.find((p) => p.name === form.service);
          if (proj) {
            apiKey = proj.api_key;
          }
        }
      } catch (err) {
        console.error("Failed to lookup API key for incident report", err);
      }

      await reportIncidentBackend(form, apiKey);
      toast.success("Incident reported to SentinelAI memory", {
        icon: <CheckCircle2 className="h-4 w-4 text-[oklch(0.78_0.17_155)]" />,
      });
      onReported?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 animate-[fade-in_0.15s_ease-out]">
      <div className="w-full max-w-xl rounded-md border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold tracking-tight">Report Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded-sm text-mute hover:text-foreground hover:bg-canvas-soft"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Service">
              <select value={form.service} onChange={(e) => update("service", e.target.value)} className={selectCls}>
                {services.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => update("severity", e.target.value as BackendSeverity)}
                className={selectCls}
              >
                {SEVS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Downtime (min)">
              <input
                type="number"
                min={0}
                value={form.downtime_minutes ?? 0}
                onChange={(e) => update("downtime_minutes", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Trigger">
            <input
              required
              value={form.trigger}
              onChange={(e) => update("trigger", e.target.value)}
              placeholder="db-migration / code-deploy / config-change"
              className={inputCls}
            />
          </Field>
          <Field label="Root Cause">
            <textarea
              required
              value={form.root_cause}
              onChange={(e) => update("root_cause", e.target.value)}
              placeholder="Connection pool exhausted after migration added blocking index…"
              className={textareaCls}
            />
          </Field>
          <Field label="Resolution">
            <textarea
              required
              value={form.resolution}
              onChange={(e) => update("resolution", e.target.value)}
              placeholder="Rolled back migration, increased pool size, restarted service…"
              className={textareaCls}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-sm border border-border text-sm text-foreground hover:bg-canvas-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "h-8 px-3 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5",
                submitting && "opacity-60 cursor-not-allowed",
              )}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save to Memory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wider font-mono text-mute">{label}</span>
      {children}
    </label>
  );
}
