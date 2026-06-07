import type { DeploymentStatus } from "@/types";
import type { RiskScore } from "@/lib/mock-data";

export interface FullDeployment {
  id: number;
  service: string;
  branch: string;
  sha: string;
  status: DeploymentStatus;
  durationMs: number;
  author: string;
  risk: RiskScore;
  at: string;
  message: string;
  env: "production" | "preview" | "staging";
}

export const SERVICES = [
  { id: "auth-service", color: "oklch(0.65 0.20 254)" },
  { id: "payment-service", color: "oklch(0.66 0.30 0)" },
  { id: "api-gateway", color: "oklch(0.78 0.16 70)" },
  { id: "frontend", color: "oklch(0.83 0.15 175)" },
  { id: "worker", color: "oklch(0.48 0.25 300)" },
] as const;

export function serviceColor(name: string) {
  return SERVICES.find((s) => s.id === name)?.color ?? "oklch(0.6 0 0)";
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function fakeLogs(d: FullDeployment): string[] {
  const ok = d.status !== "failed";
  return [
    `[00:00] ▲ SentinelAI runner picked up #${d.id} on ${d.branch}@${d.sha}`,
    `[00:01] Cloning ${d.service} ...`,
    `[00:04] Installing dependencies`,
    `[00:21] Resolved 482 packages`,
    `[00:24] Pre-build checks ...`,
    `[00:33] Building artifact ...`,
    `[01:04] Running test suite`,
    ok ? `[01:38] ✓ tests passed` : `[01:38] ✗ tests failed`,
    ok ? `[01:51] ✓ Deployed to ${d.env}` : `[01:40] ✗ Build halted`,
    ok ? `[01:53] ▲ Done in ${formatDuration(d.durationMs)}` : `[01:42] ▲ Failed in ${formatDuration(d.durationMs)}`,
  ];
}

export interface DeploymentMemory {
  title: string;
  date: string;
  learned: string;
}

export function riskRecommendation(d: FullDeployment): string {
  switch (d.risk) {
    case "HIGH":
      return `High-risk deploy on ${d.service}. Roll out via canary at 5% for 15 minutes and notify on-call before merge.`;
    case "MEDIUM":
      return `Medium-risk change on ${d.service}. Monitor P95 latency and error rate for the first 10 minutes.`;
    default:
      return `Low-risk deploy. Standard rollout.`;
  }
}
