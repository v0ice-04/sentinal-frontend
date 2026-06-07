import type { MemoryItem } from "./sentinelBackend";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function parseSeverity(text: string): Severity {
  const t = text.toLowerCase();
  if (/\bcritical\b/.test(t)) return "CRITICAL";
  if (/\bhigh\s+severity\b|\bhigh-severity\b|\bhigh\b/.test(t)) return "HIGH";
  if (/\bmedium\b/.test(t)) return "MEDIUM";
  return "LOW";
}

export interface DerivedIncident {
  id: string;
  service: string;
  severity: Severity;
  title: string;
  description: string;
  date: string;
  occurredAt: number; // epoch ms
  source: MemoryItem;
}

export interface ServiceActivity {
  total: number;
  severityCounts: Record<Severity, number>;
  servicesTracked: number;
  lastIncidentDate: string | null;
  incidents: DerivedIncident[]; // sorted desc by date
  byDate: { date: string; count: number }[]; // last 14 days
}

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function isoDay(iso: string) {
  return iso.slice(0, 10);
}

/** Derive incident-like records from raw memories. */
export function deriveActivity(
  items: (MemoryItem & { service?: string })[],
  defaultService = "",
): ServiceActivity {
  // Deduplicate by (service, occurred_start day, normalized first sentence)
  const seen = new Set<string>();
  const incidents: DerivedIncident[] = [];

  for (const m of items) {
    const service = m.service ?? defaultService;
    const firstSentence =
      m.text.split(" | ")[0].split(/(?<=[.!?])\s+/)[0]?.trim() ?? m.text;
    const day = m.occurred_start ? isoDay(m.occurred_start) : "";
    const key = `${service}|${day}|${firstSentence.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const severity = parseSeverity(m.text);
    const occurredAt = m.occurred_start ? Date.parse(m.occurred_start) : 0;
    incidents.push({
      id: `${service}-${day || "x"}-${incidents.length}`,
      service,
      severity,
      title: firstSentence.replace(/\s*\|\s*When:.*$/, "").slice(0, 140),
      description: m.text,
      date: m.occurred_start ? isoDay(m.occurred_start) : "—",
      occurredAt,
      source: m,
    });
  }

  incidents.sort((a, b) => b.occurredAt - a.occurredAt);

  const severityCounts: Record<Severity, number> = {
    CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0,
  };
  for (const i of incidents) severityCounts[i.severity]++;
  void SEV_ORDER;

  const services = new Set<string>();
  for (const m of items) if (m.service) services.add(m.service);

  // 14-day bucket
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { date: string; count: number; key: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    buckets.push({ date: fmtDate(d), count: 0, key: d.toISOString().slice(0, 10) });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const inc of incidents) {
    if (!inc.source.occurred_start) continue;
    const k = isoDay(inc.source.occurred_start);
    const i = idx.get(k);
    if (i !== undefined) buckets[i].count++;
  }

  return {
    total: items.length,
    severityCounts,
    servicesTracked: services.size,
    lastIncidentDate: incidents[0]?.date ?? null,
    incidents,
    byDate: buckets.map(({ date, count }) => ({ date, count })),
  };
}

export function severityTone(sev: Severity) {
  switch (sev) {
    case "CRITICAL":
      return {
        text: "text-[oklch(0.72_0.25_15)]",
        bg: "bg-[oklch(0.66_0.30_0/0.12)]",
        border: "border-[oklch(0.66_0.30_0/0.4)]",
        dot: "oklch(0.66 0.30 0)",
      };
    case "HIGH":
      return {
        text: "text-error",
        bg: "bg-[oklch(0.62_0.24_27/0.12)]",
        border: "border-[oklch(0.62_0.24_27/0.3)]",
        dot: "oklch(0.62 0.24 27)",
      };
    case "MEDIUM":
      return {
        text: "text-warning",
        bg: "bg-[oklch(0.78_0.16_70/0.12)]",
        border: "border-[oklch(0.78_0.16_70/0.3)]",
        dot: "oklch(0.78 0.16 70)",
      };
    default:
      return {
        text: "text-[oklch(0.78_0.17_155)]",
        bg: "bg-[oklch(0.78_0.17_155/0.12)]",
        border: "border-[oklch(0.78_0.17_155/0.25)]",
        dot: "oklch(0.78 0.17 155)",
      };
  }
}
