import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAllMemories } from "@/lib/queries";
import { deriveActivity } from "@/lib/serviceActivity";

interface Props {
  /** Optional override; otherwise pulls live data from all services. */
  data?: { date: string; count: number }[];
}

export function DeploymentTimeline({ data }: Props) {
  const live = useAllMemories();
  const series = useMemo(
    () => data ?? deriveActivity(live.all).byDate,
    [data, live.all],
  );

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Incident timeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 14 days · live from SentinelAI memory bank
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-mute uppercase tracking-wider">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-link" /> incidents
          </span>
        </div>
      </div>

      <div className="h-64 mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} barGap={2} barCategoryGap={14}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-mute)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--color-mute)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
              contentStyle={{
                background: "var(--color-canvas-soft-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 12,
                color: "var(--color-foreground)",
              }}
              labelStyle={{ color: "var(--color-mute)", fontFamily: "var(--font-mono)" }}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            <Bar dataKey="count" name="Incidents" fill="var(--color-link)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
