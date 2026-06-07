import { useState } from "react";
import { X, AlertTriangle, AlertCircle, CheckCircle2, XCircle, Loader2, Brain, Sparkles, Zap } from "lucide-react";
import {
  analyzeDeployment,
  fallbackAnalysis,
  type AnalysisResult,
  type DeploymentInputData,
} from "@/lib/sentinelAgent";
import { inferChangeType, type BackendChangeType, type BackendEnvironment } from "@/lib/sentinelBackend";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useActiveServices } from "@/lib/queries";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: DeploymentInputData, result: AnalysisResult) => void;
}

const ENVS: BackendEnvironment[] = ["production", "staging", "development"];
const CHANGE_TYPES: BackendChangeType[] = ["code-deploy", "db-migration", "config-change", "rollback"];

type Phase = "form" | "loading" | "result";

export function TriggerDeployDialog({ open, onClose, onConfirm }: Props) {
  const { user } = useAuth();
  const services = useActiveServices();
  const [phase, setPhase] = useState<Phase>("form");
  const [autoType, setAutoType] = useState(true);
  const [form, setForm] = useState<DeploymentInputData & { changeType: BackendChangeType; prUrl: string }>({
    service: "auth-service",
    branch: "main",
    environment: "production",
    commitMessage: "",
    triggeredBy: user?.name ?? "you",
    changeType: "code-deploy",
    prUrl: "",
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Synchronize dynamic services to select a valid one initially if auth-service is missing
  if (services.length > 0 && !services.includes(form.service)) {
    setForm((f) => ({ ...f, service: services[0] }));
  }

  if (!open) return null;

  function close() {
    setPhase("form");
    setResult(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    const inputForBackend: DeploymentInputData = {
      ...form,
      // analyzeDeployment infers change_type from commit message;
      // when the user has chosen one manually, prepend it as a hint.
      commitMessage: autoType
        ? form.commitMessage
        : `[${form.changeType}] ${form.commitMessage}`,
    };
    try {
      const r = await analyzeDeployment(inputForBackend);
      setResult(r);
      setPhase("result");
    } catch (err) {
      console.error(err);
      toast.error("SentinelAI backend unavailable — showing heuristic analysis");
      setResult(fallbackAnalysis(inputForBackend));
      setPhase("result");
    }
  }

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const inferredType = inferChangeType(form.commitMessage);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 animate-[fade-in_0.15s_ease-out]">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-md border border-border bg-card shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">
              {phase === "result" ? "SentinelAI Analysis" : "Trigger Deploy"}
            </h2>
          </div>
          <button onClick={close} className="h-7 w-7 grid place-items-center rounded-sm text-mute hover:text-foreground hover:bg-canvas-soft">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {phase === "form" && (
            <FormView
              form={form}
              update={update}
              autoType={autoType}
              setAutoType={setAutoType}
              inferredType={inferredType}
              onSubmit={submit}
              onCancel={close}
              services={services}
            />
          )}
          {phase === "loading" && <LoadingView />}
          {phase === "result" && result && (
            <ResultView
              result={result}
              onCancel={close}
              onConfirm={() => {
                onConfirm(form, result);
                close();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Form ---------- */
function FormView({
  form,
  update,
  autoType,
  setAutoType,
  inferredType,
  onSubmit,
  onCancel,
  services,
}: {
  form: DeploymentInputData & { changeType: BackendChangeType; prUrl: string };
  update: <K extends keyof (DeploymentInputData & { changeType: BackendChangeType; prUrl: string })>(
    k: K,
    v: (DeploymentInputData & { changeType: BackendChangeType; prUrl: string })[K],
  ) => void;
  autoType: boolean;
  setAutoType: (v: boolean) => void;
  inferredType: BackendChangeType;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  services: string[];
}) {
  return (
    <form onSubmit={onSubmit} className="p-5 space-y-4">
      <Field label="Service">
        <select value={form.service} onChange={(e) => update("service", e.target.value)} className={selectCls}>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Branch">
          <input value={form.branch} onChange={(e) => update("branch", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Environment">
          <select value={form.environment} onChange={(e) => update("environment", e.target.value)} className={selectCls}>
            {ENVS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Commit Message">
        <input
          required
          value={form.commitMessage}
          onChange={(e) => update("commitMessage", e.target.value)}
          placeholder="fix(api): tighten rate limit on /v1/charges"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={
            <span className="flex items-center gap-1.5">
              Change Type
              <label className="ml-auto flex items-center gap-1.5 text-[10px] text-mute font-normal normal-case tracking-normal">
                <input
                  type="checkbox"
                  checked={autoType}
                  onChange={(e) => setAutoType(e.target.checked)}
                  className="accent-foreground"
                />
                auto
              </label>
            </span>
          }
        >
          <select
            value={autoType ? inferredType : form.changeType}
            disabled={autoType}
            onChange={(e) => update("changeType", e.target.value as BackendChangeType)}
            className={cn(selectCls, autoType && "opacity-60 cursor-not-allowed")}
          >
            {CHANGE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Triggered By">
          <input value={form.triggeredBy} onChange={(e) => update("triggeredBy", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="PR URL (optional)">
        <input
          value={form.prUrl}
          onChange={(e) => update("prUrl", e.target.value)}
          placeholder="https://github.com/org/repo/pull/123"
          className={inputCls}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="h-8 px-3 rounded-sm border border-border text-sm text-foreground hover:bg-canvas-soft">
          Cancel
        </button>
        <button type="submit" className="h-8 px-3 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Analyze & Deploy
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full h-8 px-2.5 rounded-sm bg-canvas-soft border border-border text-sm text-foreground placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong";
const selectCls = inputCls + " appearance-none pr-7";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wider font-mono text-mute block">{label}</span>
      {children}
    </label>
  );
}

/* ---------- Loading ---------- */
function LoadingView() {
  return (
    <div className="p-12 grid place-items-center text-center">
      <div className="relative h-14 w-14 mb-4">
        <div className="absolute inset-0 rounded-full bg-foreground/10 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-foreground/20 animate-pulse" />
        <Brain className="absolute inset-0 m-auto h-7 w-7 text-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">SentinelAI is analyzing your deployment</p>
      <p className="text-xs text-muted-foreground mt-1.5 inline-flex items-center gap-1.5">
        Querying memory bank
        <span className="inline-flex gap-0.5">
          <Dot d={0} /><Dot d={200} /><Dot d={400} />
        </span>
      </p>
    </div>
  );
}
function Dot({ d }: { d: number }) {
  return <span className="h-1 w-1 rounded-full bg-foreground/70 animate-pulse" style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }} />;
}

/* ---------- Result ---------- */
function ResultView({
  result,
  onCancel,
  onConfirm,
}: {
  result: AnalysisResult;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const tone = riskTone(result.riskLevel);
  const rec = recBanner(result.recommendation);
  const disabled = result.recommendation === "ABORT";

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-3">
        <div className={cn("rounded-md border px-4 py-3 flex items-center gap-3", rec.cls)}>
          <rec.Icon className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{rec.title}</p>
            <p className="text-xs opacity-80">{rec.subtitle}</p>
          </div>
          <span className={cn("text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border", tone.badge)}>
            {result.riskLevel}
          </span>
        </div>

        <div className="rounded-md border border-border bg-canvas-soft px-4 py-3 flex items-center gap-4">
          <CircularScore score={result.riskScore} color={tone.ring} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-mono text-mute">Risk Score</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {result.riskScore}<span className="text-sm text-mute font-normal">/100</span>
            </p>
          </div>
        </div>
      </div>

      <Section title="Red Flags" count={result.redFlags.length}>
        {result.redFlags.map((f, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md border border-border bg-card px-3 py-2.5 flex gap-2.5 border-l-2",
              f.severity === "critical" ? "border-l-[oklch(0.66_0.30_0)]" : "border-l-[oklch(0.78_0.16_70)]",
            )}
          >
            {f.severity === "critical" ? (
              <AlertCircle className="h-4 w-4 text-[oklch(0.66_0.30_0)] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[oklch(0.78_0.16_70)] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Recommendations" count={result.improvements.length}>
        {result.improvements.map((imp, i) => (
          <div key={i} className="rounded-md border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{imp.title}</p>
              <PriorityPill priority={imp.priority} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{imp.description}</p>
          </div>
        ))}
      </Section>

      <Section title="Memories Recalled" count={result.memoriesRecalled.length}>
        {result.memoriesRecalled.map((m, i) => (
          <div key={i} className="rounded-md border border-border bg-card px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-mono text-mute px-1.5 py-0.5 rounded-xs border border-border bg-canvas-soft">
                {m.type}
              </span>
              <span className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">{m.title}</span>
              <span className="text-[10px] font-mono text-mute">{m.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-canvas-soft-2 rounded-full overflow-hidden">
                <div className="h-full bg-foreground/60" style={{ width: `${m.relevance}%` }} />
              </div>
              <span className="text-[10px] font-mono text-mute tabular-nums">{m.relevance}%</span>
            </div>
          </div>
        ))}
      </Section>

      <div className="rounded-md border border-border bg-canvas-soft px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider font-mono text-mute mb-1">Summary</p>
        <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <button onClick={onCancel} className="h-8 px-3 rounded-sm border border-border text-sm hover:bg-canvas-soft">
          Cancel Deploy
        </button>
        <button
          disabled={disabled}
          onClick={onConfirm}
          className={cn(
            "h-8 px-3 rounded-sm text-sm font-medium inline-flex items-center gap-1.5",
            disabled
              ? "bg-canvas-soft-2 text-mute cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-90",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Deploy
        </button>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider font-mono text-mute flex items-center gap-2">
        {title} <span className="text-mute">·</span> <span className="text-foreground">{count}</span>
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PriorityPill({ priority }: { priority: "low" | "medium" | "high" }) {
  const map = {
    high: "bg-[oklch(0.66_0.30_0/0.15)] text-[oklch(0.72_0.25_15)] border-[oklch(0.66_0.30_0/0.4)]",
    medium: "bg-[oklch(0.78_0.16_70/0.15)] text-[oklch(0.82_0.16_80)] border-[oklch(0.78_0.16_70/0.4)]",
    low: "bg-[oklch(0.78_0.17_155/0.15)] text-[oklch(0.78_0.17_155)] border-[oklch(0.78_0.17_155/0.4)]",
  } as const;
  return (
    <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border", map[priority])}>
      {priority}
    </span>
  );
}

function CircularScore({ score, color }: { score: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} stroke="oklch(0.27 0 0)" strokeWidth="3" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-mono text-foreground tabular-nums">
        {score}
      </span>
    </div>
  );
}

function riskTone(level: AnalysisResult["riskLevel"]) {
  switch (level) {
    case "LOW":
      return { ring: "oklch(0.78 0.17 155)", badge: "border-[oklch(0.78_0.17_155/0.4)] text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)]" };
    case "MEDIUM":
      return { ring: "oklch(0.82 0.16 80)", badge: "border-[oklch(0.78_0.16_70/0.4)] text-[oklch(0.82_0.16_80)] bg-[oklch(0.78_0.16_70/0.12)]" };
    case "HIGH":
      return { ring: "oklch(0.72 0.22 30)", badge: "border-[oklch(0.72_0.22_30/0.4)] text-[oklch(0.78_0.20_30)] bg-[oklch(0.72_0.22_30/0.12)]" };
    case "CRITICAL":
      return { ring: "oklch(0.66 0.30 0)", badge: "border-[oklch(0.66_0.30_0/0.5)] text-[oklch(0.72_0.25_15)] bg-[oklch(0.66_0.30_0/0.15)]" };
  }
}

function recBanner(rec: AnalysisResult["recommendation"]) {
  switch (rec) {
    case "PROCEED":
      return {
        Icon: CheckCircle2,
        title: "Safe to deploy",
        subtitle: "SentinelAI sees no blocking risks.",
        cls: "border-[oklch(0.78_0.17_155/0.4)] bg-[oklch(0.78_0.17_155/0.08)] text-[oklch(0.78_0.17_155)]",
      };
    case "PROCEED_WITH_CAUTION":
      return {
        Icon: AlertTriangle,
        title: "Deploy carefully",
        subtitle: "Address the red flags or roll out gradually.",
        cls: "border-[oklch(0.78_0.16_70/0.4)] bg-[oklch(0.78_0.16_70/0.08)] text-[oklch(0.82_0.16_80)]",
      };
    case "ABORT":
      return {
        Icon: XCircle,
        title: "Do not deploy",
        subtitle: "SentinelAI recommends aborting this deploy.",
        cls: "border-[oklch(0.66_0.30_0/0.5)] bg-[oklch(0.66_0.30_0/0.10)] text-[oklch(0.72_0.25_15)]",
      };
  }
}

void Loader2;
