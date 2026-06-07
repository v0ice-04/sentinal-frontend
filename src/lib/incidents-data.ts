// Re-exports the canonical Severity type. Static dummy incident lists were
// removed — the Incidents view derives data from the live memory backend.
export type { Severity } from "./serviceActivity";
