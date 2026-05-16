"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardData>("/dashboard/stats"),
    staleTime: 15_000,
  });
}
