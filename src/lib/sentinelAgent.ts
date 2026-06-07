import { chatWithAgentFn } from "./sentinelAgent.functions";
import {
  analyzeDeployBackend,
  getMemoriesBackend,
  inferChangeType,
  SENTINEL_API_BASE,
  type BackendEnvironment,
  type MemoryItem,
  type RiskAnalysis,
} from "./sentinelBackend";

export interface RedFlag {
  title: string;
  description: string;
  severity: "warning" | "critical";
}
export interface Improvement {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}
export interface MemoryRecalled {
  type: "DEPLOYMENT" | "INCIDENT" | "PATTERN";
  title: string;
  date: string;
  relevance: number;
}
export interface AnalysisResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  redFlags: RedFlag[];
  improvements: Improvement[];
  memoriesRecalled: MemoryRecalled[];
  summary: string;
  recommendation: "PROCEED" | "PROCEED_WITH_CAUTION" | "ABORT";
}

export interface DeploymentInputData {
  service: string;
  branch: string;
  environment: string;
  commitMessage: string;
  triggeredBy: string;
  currentCpuUsage?: number;
  recentFailures?: number;
  lastDeployStatus?: string;
}

function mapEnv(env: string): BackendEnvironment {
  if (env === "production" || env === "staging" || env === "development") return env;
  return "production";
}

function levelFromScore(score: number): AnalysisResult["riskLevel"] {
  if (score >= 86) return "CRITICAL";
  if (score >= 61) return "HIGH";
  if (score >= 31) return "MEDIUM";
  return "LOW";
}

function memoryToRecall(m: MemoryItem, idx: number, total: number): MemoryRecalled {
  const t = m.fact_type.toLowerCase();
  const type: MemoryRecalled["type"] =
    t.includes("experience") || t.includes("incident")
      ? "INCIDENT"
      : t.includes("pattern") || t.includes("observation")
        ? "PATTERN"
        : "DEPLOYMENT";
  const date = m.occurred_start
    ? new Date(m.occurred_start).toISOString().slice(0, 10)
    : "—";
  const relevance = Math.max(40, Math.round(95 - (idx / Math.max(1, total)) * 50));
  return { type, title: m.text.split(" | ")[0].slice(0, 110), date, relevance };
}

function deriveRedFlags(reasoning: string, level: AnalysisResult["riskLevel"]): RedFlag[] {
  const sentences = reasoning
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  const sev: RedFlag["severity"] =
    level === "CRITICAL" || level === "HIGH" ? "critical" : "warning";
  return sentences.slice(0, 3).map((s, i) => ({
    title: `Historical signal #${i + 1}`,
    description: s,
    severity: sev,
  }));
}

function deriveImprovements(recommendation: string): Improvement[] {
  const parts = recommendation
    .split(/(?:,|\band\b|\.\s|;)/i)
    .map((s) => s.trim().replace(/^[-•]\s*/, ""))
    .filter((s) => s.length > 6);
  return parts.slice(0, 4).map((p, i) => ({
    title: p.length > 60 ? p.slice(0, 57) + "…" : p,
    description: p,
    priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
  }));
}

export async function analyzeDeployment(
  d: DeploymentInputData,
): Promise<AnalysisResult> {
  // Fetch projects to find the matching API Key for this service/project name
  let apiKey = "";
  try {
    const res = await fetch(`${SENTINEL_API_BASE}/api/v1/projects/`);
    if (res.ok) {
      const projects = await res.json() as { name: string; api_key: string }[];
      const proj = projects.find((p) => p.name === d.service);
      if (proj) {
        apiKey = proj.api_key;
      }
    }
  } catch (err) {
    console.error("Failed to lookup API key in analyzeDeployment", err);
  }

  const [risk, memories] = await Promise.all([
    analyzeDeployBackend({
      service: d.service,
      environment: mapEnv(d.environment),
      change_type: inferChangeType(d.commitMessage),
      timestamp: new Date().toISOString(),
      deployed_by: d.triggeredBy,
    }, apiKey),
    getMemoriesBackend(d.service).catch(() => [] as MemoryItem[]),
  ]);
  const level = levelFromScore(risk.risk_score);
  const rec: AnalysisResult["recommendation"] =
    level === "CRITICAL" ? "ABORT" : level === "LOW" ? "PROCEED" : "PROCEED_WITH_CAUTION";
  return {
    riskLevel: level,
    riskScore: risk.risk_score,
    redFlags: deriveRedFlags(risk.reasoning, level),
    improvements: deriveImprovements(risk.recommendation),
    memoriesRecalled: memories.slice(0, 3).map((m, i) => memoryToRecall(m, i, memories.length)),
    summary: risk.reasoning,
    recommendation: rec,
  };
}

export async function chatWithAgent(
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const { content } = await chatWithAgentFn({ data: { messages } });
  return content;
}

/* ---------- Fallback (used on API failure) ---------- */
export function fallbackAnalysis(d: DeploymentInputData): AnalysisResult {
  const cpu = d.currentCpuUsage ?? 50;
  const fails = d.recentFailures ?? 0;
  const score = Math.min(
    95,
    Math.round(cpu * 0.6 + fails * 12 + (d.environment === "production" ? 15 : 0)),
  );
  const level = levelFromScore(score);
  const rec: AnalysisResult["recommendation"] =
    level === "CRITICAL" ? "ABORT" : level === "LOW" ? "PROCEED" : "PROCEED_WITH_CAUTION";
  return {
    riskLevel: level,
    riskScore: score,
    redFlags: [
      {
        title: "Backend unavailable",
        description: "Live SentinelAI backend did not respond. Showing heuristic fallback.",
        severity: "warning",
      },
    ],
    improvements: [
      { title: "Add canary stage", description: "Roll out to 5% of traffic before full promotion.", priority: "high" },
      { title: "Pre-warm connections", description: "Warm DB connection pool before promoting to production.", priority: "medium" },
    ],
    memoriesRecalled: [
      { type: "PATTERN", title: `${d.service} ${d.environment} baseline`, date: "Recurring", relevance: 70 },
    ],
    summary: `Heuristic risk for ${d.service} → ${d.environment} is ${level} (${score}/100). Backend offline.`,
    recommendation: rec,
  };
}
