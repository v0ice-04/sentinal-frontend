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

export function analyzeDeployBackend(event: DeployEvent): Promise<RiskAnalysis> {
  return request<RiskAnalysis>("/api/v1/deploy/analyze", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function reportIncidentBackend(incident: IncidentReport): Promise<unknown> {
  return request<unknown>("/api/v1/deploy/incident", {
    method: "POST",
    body: JSON.stringify(incident),
  });
}

export function getMemoriesBackend(service: string): Promise<MemoryItem[]> {
  const qs = new URLSearchParams({ service }).toString();
  return request<MemoryItem[]>(`/api/v1/memory/memories?${qs}`);
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
