export type DeploymentStatus = "success" | "failed" | "building" | "queued";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Deployment {
  id: string;
  commit: string;
  branch: string;
  status: DeploymentStatus;
  author: string;
  createdAt: string;
  durationMs: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  service: string;
  openedAt: string;
  resolvedAt?: string;
}
