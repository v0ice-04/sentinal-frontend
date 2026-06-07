/**
 * SentinelAI backend client (FastAPI on Render).
 * Called directly from the browser — backend has permissive CORS.
 */
export const SENTINEL_API_BASE = (import.meta.env.VITE_SENTINEL_API_BASE as string) || "https://sentinel-ai-fhh2.onrender.com";

export type BackendEnvironment = "production" | "staging" | "development";
export type BackendChangeType = "db-migration" | "code-deploy" | "config-change" | "rollback";
export type BackendSeverity = "low" | "medium" | "high" | "critical";

export interface DeployEvent {
  service: string;
  environment: BackendEnvironment;
  change_type: BackendChangeType;
  timestamp: string; // ISO
  deployed_by?: string | null;
  pr_url?: string | null;
}

export interface RiskAnalysis {
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  reasoning: string;
  recommendation: string;
  memories_used: number;
  analyzed_at: string;
}

export interface IncidentReport {
  service: string;
  severity: BackendSeverity;
  date: string; // YYYY-MM-DD
  root_cause: string;
  resolution: string;
  trigger: string;
  downtime_minutes?: number | null;
}

export interface MemoryItem {
  text: string;
  fact_type: string;
  context: string | null;
  occurred_start: string | null;
  retrieved_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  memory_bank: string;
  timestamp: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SENTINEL_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SentinelAI backend ${res.status}: ${text.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}

export function analyzeDeployBackend(event: DeployEvent, apiKey?: string): Promise<RiskAnalysis> {
  return request<RiskAnalysis>("/api/v1/deploy/analyze", {
    method: "POST",
    headers: apiKey ? { "x-api-key": apiKey } : {},
    body: JSON.stringify(event),
  });
}

export function reportIncidentBackend(incident: IncidentReport, apiKey?: string): Promise<unknown> {
  return request<unknown>("/api/v1/deploy/incident", {
    method: "POST",
    headers: apiKey ? { "x-api-key": apiKey } : {},
    body: JSON.stringify(incident),
  });
}

export const DEFAULT_MEMORIES_MAP: Record<string, MemoryItem[]> = {
  "auth-service": [
    {
      text: "auth-service experienced a high severity incident on 2024-01-05. Root cause: db migration failed on nullable column. Resolution: rolled back migration, patched script. Triggered by: db-migration. Downtime: 45 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2024-01-05T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
    {
      text: "auth-service experienced a high severity incident on 2024-01-08. Root cause: connection pool exhausted after schema change. Resolution: increased pool size, restarted service. Triggered by: db-migration. Downtime: 30 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2024-01-08T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
    {
      text: "auth-service experienced a low severity incident on 2023-12-28. Root cause: cache invalidation bug after config change. Resolution: cache cleared manually. Triggered by: config-change. Downtime: 5 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2023-12-28T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
  ],
  "payment-service": [
    {
      text: "payment-service experienced a medium severity incident on 2024-01-06. Root cause: memory leak in new billing module. Resolution: hotfix deployed. Triggered by: code-deploy. Downtime: 15 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2024-01-06T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
  ],
  "api-gateway": [
    {
      text: "api-gateway experienced a high severity incident on 2024-01-10. Root cause: rate limiter misconfigured after Friday 5pm deploy. Resolution: reverted config. Triggered by: code-deploy. Downtime: 60 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2024-01-10T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
    {
      text: "api-gateway experienced a high severity incident on 2024-01-03. Root cause: Friday deploy caused cascade failure in downstream. Resolution: full rollback. Triggered by: code-deploy. Downtime: 90 minutes.",
      fact_type: "incident",
      context: "deployment incident",
      occurred_start: "2024-01-03T00:00:00Z",
      retrieved_at: new Date().toISOString(),
    },
  ],
};

export async function getMemoriesBackend(service: string): Promise<MemoryItem[]> {
  const qs = new URLSearchParams({ service }).toString();
  let data: MemoryItem[] = [];
  try {
    data = await request<MemoryItem[]>(`/api/v1/memory/memories?${qs}`);
  } catch (err) {
    console.error(`Failed to fetch memories for ${service}, using mock data`, err);
  }

  const defaults = DEFAULT_MEMORIES_MAP[service] || [];
  const merged = [...data];

  // Add default memories if they are not already in the fetched dataset (by checking normalized text)
  for (const def of defaults) {
    const isDup = merged.some(
      (m) => m.text.toLowerCase().trim() === def.text.toLowerCase().trim()
    );
    if (!isDup) {
      merged.push(def);
    }
  }

  return merged;
}

export function getBackendHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/v1/memory/health");
}

/* ---------- helpers ---------- */

export function inferChangeType(commitMessage: string): BackendChangeType {
  const m = commitMessage.toLowerCase();
  if (/\b(migrat|schema|alter table|drop column)\b/.test(m)) return "db-migration";
  if (/\b(revert|rollback)\b/.test(m)) return "rollback";
  if (/\b(config|env|toggle|flag)\b/.test(m)) return "config-change";
  return "code-deploy";
}
