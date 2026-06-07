import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Triangle,
  Brain,
  Sparkles,
  Database,
  AlertTriangle,
  GitBranch,
  Activity,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { chatWithAgent } from "@/lib/sentinelAgent";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Agent Chat — SentinelAI" },
      { name: "description", content: "Talk to SentinelAI about your pipeline." },
    ],
  }),
  component: ChatPage,
});

/* ---------- Types ---------- */
type Role = "user" | "agent";
type MemKind = "DEPLOYMENT" | "INCIDENT" | "PATTERN";

interface MemoryCardData {
  kind: MemKind;
  title: string;
  date: string;
  match: number;
  summary: string;
}

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  memories?: MemoryCardData[]; // for agent messages
}

/* ---------- Seed conversation ---------- */
const seedMessages: ChatMessage[] = [
  { id: "m1", role: "user", text: "Why did the payment-service fail last Tuesday?" },
  {
    id: "m2",
    role: "agent",
    text:
      "Based on my memory, the payment-service deployment on Tuesday failed because of a **database connection pool exhaustion**. I've seen this pattern twice before — on March 3rd and Feb 18th — both times triggered by a high-traffic deploy without a pre-warm step.\n\nI'd recommend adding a connection pool check to your pre-deploy checklist.",
    memories: [
      { kind: "INCIDENT", title: "Payment DB pool exhaustion", date: "Mar 3, 2026", match: 94, summary: "Pool of 40 exhausted under Stripe replay burst." },
      { kind: "INCIDENT", title: "Payment DB pool exhaustion (replay)", date: "Feb 18, 2026", match: 89, summary: "Same root cause, no pre-warm before promo deploy." },
      { kind: "PATTERN", title: "High-traffic deploy without pre-warm", date: "Recurring", match: 86, summary: "Pre-warm step missing in 3 of last 6 risky deploys." },
    ],
  },
  { id: "m3", role: "user", text: "Is it safe to deploy auth-service to prod right now?" },
  {
    id: "m4",
    role: "agent",
    text:
      "I'd advise caution. Here's what I'm seeing in memory:\n\n— auth-service has failed **2 of its last 5 Friday deployments**\n— Current CPU on prod is at **78%** (elevated)\n— A similar pattern on April 12th led to a **40-minute outage**\n\n**Risk assessment: HIGH.** Recommendation: wait for CPU to drop below 60% or deploy during off-peak hours.",
    memories: [
      { kind: "PATTERN", title: "Friday deploy failure pattern", date: "Recurring", match: 87, summary: "auth-service Friday deploys: 40% failure rate over 90 days." },
      { kind: "DEPLOYMENT", title: "auth-service #1031 failure", date: "Apr 12, 2026", match: 81, summary: "High CPU at deploy time led to 40-min cascade outage." },
      { kind: "INCIDENT", title: "JWT rotation blocked refresh calls", date: "May 24, 2026", match: 73, summary: "Auth instability tends to compound under load." },
    ],
  },
  { id: "m5", role: "user", text: "What should I watch out for with the new checkout feature?" },
  {
    id: "m6",
    role: "agent",
    text:
      "The `checkout-v2` branch touches **payment-service and api-gateway simultaneously**. From memory, the last time both services were deployed together (Jan 29th), there was a **12-minute degradation window**.\n\nI'd recommend a staggered deploy: **api-gateway first, wait 5 minutes, then payment-service**.",
    memories: [
      { kind: "DEPLOYMENT", title: "Joint payment + gateway deploy", date: "Jan 29, 2026", match: 92, summary: "12-min degradation when both services shipped within 1 min." },
      { kind: "PATTERN", title: "Cross-service simultaneous deploys", date: "Recurring", match: 84, summary: "Same-minute deploys of dependent services 3x outage risk." },
      { kind: "INCIDENT", title: "Checkout 5xx after Apple Pay rollout", date: "Jun 4, 2026", match: 71, summary: "Checkout area sensitive to wallet-related changes." },
    ],
  },
];

/* ---------- Canned responses by keyword ---------- */
function generateReply(prompt: string): ChatMessage {
  const p = prompt.toLowerCase();

  if (/(safe|ok|should i|right now|deploy now)/.test(p)) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      text:
        "Looking at the current pipeline state, **error budget is at 92%** and no active incidents are open. However, the last 3 deploys touching `payment-service` happened in the same 2-hour window — I'd avoid clustering risky changes.\n\n**Risk assessment: MEDIUM.** Safe to ship low-risk services, hold payment-service for a quieter window.",
      memories: [
        { kind: "PATTERN", title: "Deploy clustering raises risk", date: "Recurring", match: 88, summary: "Risk doubles when 3+ deploys ship in <2h on same service." },
        { kind: "DEPLOYMENT", title: "payment-service #1049", date: "3 hours ago", match: 79, summary: "Recent payment deploy still inside watch window." },
        { kind: "INCIDENT", title: "Active payment latency spike", date: "2 hours ago", match: 72, summary: "Open incident on adjacent surface — exercise caution." },
      ],
    };
  }

  if (/(incident|outage|broke|failed|fail)/.test(p)) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      text:
        "Last week's most impactful incident was the **payment-service latency spike** (INC-2041) on Tuesday. Root cause: the 3DS retry hotfix amplified acquirer 502s into a retry storm.\n\nI've already added a memory: *acquirer 502s correlate with our retry storm; cap retries at 2 with jitter.*",
      memories: [
        { kind: "INCIDENT", title: "Payment latency spike (INC-2041)", date: "2 hours ago", match: 96, summary: "3DS retry hotfix amplified acquirer 502s." },
        { kind: "PATTERN", title: "Retry storm pattern", date: "Recurring", match: 83, summary: "Retries > 2 without jitter cascade under acquirer 5xx." },
        { kind: "DEPLOYMENT", title: "hotfix/3ds-retry #1054", date: "12 min ago", match: 78, summary: "Triggering deploy still live; watching error budget." },
      ],
    };
  }

  if (/(high risk|risky|risk)/.test(p)) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      text:
        "Highest-risk services right now, ranked by recent failure rate × blast radius:\n\n1. **payment-service** — 2 failed deploys in last 24h, open incident\n2. **auth-service** — Friday-cohort instability, elevated CPU\n3. **api-gateway** — recent CORS regression, edge runtime upgrade pending\n\nI'd freeze payment-service deploys until INC-2041 closes.",
      memories: [
        { kind: "PATTERN", title: "Service risk score model", date: "Recurring", match: 91, summary: "Weights: failure rate (0.5) × blast radius (0.5)." },
        { kind: "INCIDENT", title: "Payment latency spike", date: "2 hours ago", match: 89, summary: "Open critical incident dominates current risk surface." },
        { kind: "DEPLOYMENT", title: "auth-service Friday cohort", date: "Recurring", match: 76, summary: "auth-service failure rate elevated on Fridays." },
      ],
    };
  }

  return {
    id: crypto.randomUUID(),
    role: "agent",
    text:
      "I checked my memory across deployments, incidents, and patterns. Nothing in my recent recalls flags a strong signal for that query — pipeline health looks **nominal** in the relevant area.\n\nWant me to surface the closest-matching past events anyway?",
    memories: [
      { kind: "PATTERN", title: "Nominal-pipeline baseline", date: "Recurring", match: 64, summary: "Background recall when no high-confidence match exists." },
      { kind: "DEPLOYMENT", title: "Last 24h overview", date: "Today", match: 58, summary: "12 deploys, 1 failure, success rate 91.7%." },
      { kind: "INCIDENT", title: "Open incidents snapshot", date: "Today", match: 55, summary: "3 active, 1 critical (payment-service)." },
    ],
  };
}

/* ---------- Suggested prompts ---------- */
const suggestedPrompts = [
  "Is it safe to deploy now?",
  "What caused last week's incident?",
  "Show me high risk services",
];

/* ---------- Memory stats / sparkline ---------- */
const memoryStats = {
  total: 847,
  deployments: 312,
  incidents: 47,
  patterns: 23,
};

const memoryGrowth = [
  640, 648, 651, 660, 663, 668, 672, 678, 681, 689, 695, 701, 707, 712,
  718, 724, 731, 738, 745, 751, 760, 768, 775, 783, 791, 800, 812, 824, 836, 847,
].map((v, i) => ({ d: i, v }));

/* ---------- Page ---------- */
function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Memory panel reflects the most recent agent response
  const activeMemories = useMemo(() => {
    const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
    return lastAgent?.memories ?? [];
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Focus textarea
  useEffect(() => {
    inputRef.current?.focus();
  }, [thinking]);

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || thinking) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: value };
    const history = [...messages, userMsg];
    setMessages(history);
    setThinking(true);
    const mock = generateReply(value); // for memory cards
    try {
      const apiMessages = history.map((m) => ({
        role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant",
        content: m.text,
      }));
      const reply = await chatWithAgent(apiMessages);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "agent", text: reply, memories: mock.memories },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("SentinelAI is unavailable, showing cached analysis");
      setMessages((prev) => [...prev, mock]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] min-h-0">
      {/* LEFT: Chat */}
      <section className="flex flex-col min-h-0 border-r border-border">
        <ChatHeader />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} text={m.text} /> : <AgentBubble key={m.id} msg={m} />))}
          {thinking && <ThinkingBubble />}
        </div>

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={() => send()}
          onPickPrompt={(p) => {
            setInput(p);
            send(p);
          }}
          textareaRef={inputRef}
          disabled={thinking}
        />
      </section>

      {/* RIGHT: Memory context */}
      <aside className="flex flex-col min-h-0 bg-canvas-soft/40">
        <MemoryHeader />
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeMemories.map((m, i) => (
            <MemoryCard key={`${m.title}-${i}`} data={m} index={i} />
          ))}
        </div>
        <MemoryStats />
      </aside>
    </div>
  );
}

/* ---------- Chat sub-components ---------- */

function ChatHeader() {
  return (
    <header className="px-6 py-4 border-b border-border flex items-center gap-3">
      <div className="h-10 w-10 rounded-md bg-foreground text-background grid place-items-center relative overflow-hidden">
        <Triangle className="h-5 w-5 fill-background" strokeWidth={0} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-foreground tracking-tight">SentinelAI</h1>
          <span className="text-[11px] font-mono text-mute">v0.1.0</span>
        </div>
        <p className="text-xs text-muted-foreground">Memory-driven DevOps Intelligence</p>
      </div>
      <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.78_0.17_155)] opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.78_0.17_155)]" />
        </span>
        Active · 847 memories
      </div>
    </header>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-[fade-in_0.3s_ease-out]">
      <div className="max-w-[80%] rounded-md bg-foreground text-background px-3.5 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function AgentBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3 animate-[fade-in_0.4s_ease-out]">
      <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center shrink-0 mt-0.5">
        <Triangle className="h-3.5 w-3.5 fill-background" strokeWidth={0} />
      </div>
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="rounded-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
          <MiniMarkdown text={msg.text} />
        </div>
        {msg.memories && msg.memories.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-mute h-5 px-2 rounded-full border border-border bg-canvas-soft">
              <Sparkles className="h-3 w-3 text-cyan" />
              {msg.memories.length} memories recalled
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center shrink-0 mt-0.5">
        <Triangle className="h-3.5 w-3.5 fill-background" strokeWidth={0} />
      </div>
      <div className="rounded-md border border-border bg-card px-4 py-3 inline-flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className="inline-flex items-center gap-1">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </span>
        <span>Searching memory…</span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-pulse"
      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
    />
  );
}

/* Minimal markdown: **bold**, `code`, line breaks */
function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <p key={idx} className="whitespace-pre-wrap">
          {renderInline(line)}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string) {
  const tokens = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((t, i) => {
    if (t.startsWith("**") && t.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{t.slice(2, -2)}</strong>;
    if (t.startsWith("`") && t.endsWith("`"))
      return <code key={i} className="font-mono text-xs px-1 py-0.5 rounded-xs bg-canvas-soft-2 border border-border text-foreground">{t.slice(1, -1)}</code>;
    return <span key={i}>{t}</span>;
  });
}

function ChatComposer({
  value,
  onChange,
  onSend,
  onPickPrompt,
  textareaRef,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onPickPrompt: (p: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="relative rounded-md border border-border bg-canvas-soft focus-within:border-hairline-strong">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask SentinelAI about your pipeline..."
          rows={1}
          className="w-full resize-none bg-transparent px-3.5 py-3 pr-12 text-sm text-foreground placeholder:text-mute focus:outline-none"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "absolute right-2 bottom-2 h-7 w-7 grid place-items-center rounded-sm transition-colors",
            value.trim() && !disabled
              ? "bg-foreground text-background hover:opacity-90"
              : "bg-canvas-soft-2 text-mute cursor-not-allowed",
          )}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onPickPrompt(p)}
            disabled={disabled}
            className="h-7 px-2.5 rounded-full border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-canvas-soft-2 transition-colors disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Memory panel sub-components ---------- */

function MemoryHeader() {
  return (
    <header className="px-5 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-foreground" />
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Memory Context</h2>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        What SentinelAI recalled for the last response
      </p>
    </header>
  );
}

function MemoryCard({ data, index }: { data: MemoryCardData; index: number }) {
  const tone =
    data.kind === "INCIDENT"
      ? "text-error bg-[oklch(0.62_0.24_27/0.12)] border-[oklch(0.62_0.24_27/0.3)]"
      : data.kind === "PATTERN"
        ? "text-warning bg-[oklch(0.78_0.16_70/0.12)] border-[oklch(0.78_0.16_70/0.3)]"
        : "text-link bg-[oklch(0.65_0.20_254/0.12)] border-[oklch(0.65_0.20_254/0.3)]";
  const Icon = data.kind === "INCIDENT" ? AlertTriangle : data.kind === "PATTERN" ? Activity : GitBranch;

  return (
    <article
      className="rounded-md border border-border bg-card p-3.5 animate-[fade-in_0.4s_ease-out]"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 h-5 px-1.5 rounded-xs border text-[10px] font-semibold font-mono tracking-wider", tone)}>
          <Icon className="h-3 w-3" />
          {data.kind}
        </span>
        <span className="text-[11px] font-mono text-link">{data.match}% match</span>
      </div>
      <h3 className="mt-2 text-sm font-medium text-foreground leading-snug">{data.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{data.summary}</p>
      <div className="mt-2 text-[11px] font-mono text-mute">{data.date}</div>

      <div className="mt-2 h-1 rounded-full bg-canvas-soft-2 overflow-hidden">
        <div
          className="h-full bg-link"
          style={{ width: `${data.match}%`, transition: "width 600ms ease-out" }}
        />
      </div>
    </article>
  );
}

function MemoryStats() {
  return (
    <div className="border-t border-border p-5 space-y-3 bg-background">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total memories" value={memoryStats.total} icon={Database} />
        <Stat label="Deployments" value={memoryStats.deployments} icon={GitBranch} />
        <Stat label="Incidents learned" value={memoryStats.incidents} icon={AlertTriangle} />
        <Stat label="Patterns" value={memoryStats.patterns} icon={Activity} />
      </div>
      <div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-mute mb-1">
          <span>Memory growth · 30d</span>
          <span className="text-[oklch(0.78_0.17_155)] normal-case">+207</span>
        </div>
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={memoryGrowth} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="memSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-link)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-link)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--color-link)"
                strokeWidth={1.5}
                fill="url(#memSpark)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-sm border border-border bg-card p-2.5">
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-mute">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-lg font-semibold text-foreground tracking-tight mt-0.5">{value}</div>
    </div>
  );
}
