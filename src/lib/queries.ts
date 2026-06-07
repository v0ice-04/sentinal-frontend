import { queryOptions, useQueries, useQueryClient, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getBackendHealth,
  getMemoriesBackend,
  SENTINEL_API_BASE,
  type HealthResponse,
  type MemoryItem,
} from "./sentinelBackend";

export const SERVICES = [
  "auth-service",
  "payment-service",
  "api-gateway",
  "frontend",
  "worker",
] as const;
export type Service = (typeof SERVICES)[number];

export interface Project {
  id: number;
  name: string;
  api_key: string;
}

export function projectsQueryOptions() {
  return queryOptions<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${SENTINEL_API_BASE}/api/v1/projects/`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useActiveServices() {
  const { data: projects = [] } = useQuery(projectsQueryOptions());
  return useMemo(() => {
    const names = projects.map((p) => p.name);
    return Array.from(new Set([...SERVICES, ...names]));
  }, [projects]);
}

export function memoriesQueryOptions(service: string) {
  return queryOptions({
    queryKey: ["memories", service],
    queryFn: () => getMemoriesBackend(service),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
}

export function healthQueryOptions() {
  return queryOptions<HealthResponse>({
    queryKey: ["sentinel-health"],
    queryFn: getBackendHealth,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
}

/** Returns memories grouped per service plus a flat union with `service` tag. */
export function useAllMemories() {
  const allServices = useActiveServices();
  const results = useQueries({
    queries: allServices.map((s) => memoriesQueryOptions(s)),
  });

  const byService: Record<string, MemoryItem[]> = {};
  const all: (MemoryItem & { service: string })[] = [];

  allServices.forEach((s, i) => {
    const data = (results[i]?.data ?? []) as MemoryItem[];
    byService[s] = data;
    for (const m of data) all.push({ ...m, service: s });
  });

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);
  const error = results.find((r) => r.error)?.error ?? null;

  return { byService, all, isLoading, isFetching, error, allServices };
}

export function useInvalidateMemories() {
  const qc = useQueryClient();
  return (service?: string) => {
    if (service) qc.invalidateQueries({ queryKey: ["memories", service] });
    else qc.invalidateQueries({ queryKey: ["memories"] });
  };
}
