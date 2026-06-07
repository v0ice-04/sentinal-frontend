import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TriggerDeployDialog } from "@/components/dashboard/TriggerDeployDialog";
import type { FullDeployment } from "@/lib/deployments-data";
import type { RiskScore } from "@/lib/mock-data";
import type { AnalysisResult, DeploymentInputData } from "@/lib/sentinelAgent";
import { useInvalidateMemories } from "@/lib/queries";

interface DeployContextValue {
  openDeploy: () => void;
  extraRows: FullDeployment[];
}

const DeployContext = createContext<DeployContextValue | null>(null);

export function useDeploy() {
  const ctx = useContext(DeployContext);
  if (!ctx) throw new Error("useDeploy must be used inside DeployProvider");
  return ctx;
}

let nextAdHocId = 9999;

export function DeployProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [extraRows, setExtraRows] = useState<FullDeployment[]>([]);
  const invalidate = useInvalidateMemories();

  const openDeploy = useCallback(() => setOpen(true), []);

  const handleConfirm = useCallback(
    (input: DeploymentInputData, result: AnalysisResult) => {
      const risk: RiskScore =
        result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH"
          ? "HIGH"
          : result.riskLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW";
      const envMap: Record<string, FullDeployment["env"]> = {
        production: "production",
        staging: "staging",
        development: "preview",
      };
      const newRow: FullDeployment = {
        id: ++nextAdHocId,
        service: input.service,
        branch: input.branch || "main",
        sha: Math.random().toString(36).slice(2, 9),
        status: result.recommendation === "ABORT" ? "failed" : "success",
        durationMs: 90_000 + Math.floor(Math.random() * 120_000),
        author: input.triggeredBy,
        risk,
        at: "just now",
        env: envMap[input.environment] ?? "production",
        message: input.commitMessage,
      };
      setExtraRows((prev) => [newRow, ...prev]);
      // Refresh live memory queries so dashboards reflect any backend updates.
      invalidate(input.service);
    },
    [invalidate],
  );

  const value = useMemo(() => ({ openDeploy, extraRows }), [openDeploy, extraRows]);

  return (
    <DeployContext.Provider value={value}>
      {children}
      <TriggerDeployDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </DeployContext.Provider>
  );
}
