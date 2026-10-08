import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import { useAuth } from "../auth/AuthContext";
import type { Listing } from "./marketplace";
import type { Post } from "./community";
import type { SupportRequest } from "./support";
import type { MatchDecision } from "./lostfound";
import type { AuthUser } from "./auth";

/* mirrors the backend home aggregate, everything capped server-side */
export interface DashboardData {
  user: AuthUser;
  unreadNotifications: number;
  latestListings: Listing[];
  latestPosts: Post[];
  openSupportRequests: SupportRequest[];
  myMatches: MatchDecision[];
  activeListingCount: number;
  openLostReportCount: number;
  openSupportRequestCount: number;
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
}

export function useDashboard() {
  const { token } = useAuth();
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    enabled: !!token,
  });
}
