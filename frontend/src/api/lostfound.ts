import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { PageResponse } from "../types/page";
import { CATEGORIES } from "./marketplace";

/* mirrors the backend report DTOs, categories shared with the market */
export type ReportType = "LOST" | "FOUND";
export type ReportStatus = "OPEN" | "MATCH_PENDING" | "MATCHED" | "RESOLVED" | "CLOSED";
export type ReportCategory = (typeof CATEGORIES)[number];

export { CATEGORIES };

export interface ReportOwner {
  id: string;
  fullName: string;
}

export interface Report {
  id: string;
  owner: ReportOwner;
  type: ReportType;
  itemName: string;
  category: ReportCategory;
  description: string;
  location: string;
  incidentDate: string;
  imageUrl: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  search?: string;
  type?: ReportType;
  category?: ReportCategory;
  location?: string;
  status?: ReportStatus;
  page?: number;
  size?: number;
}

export interface ReportPayload {
  type: ReportType;
  itemName: string;
  category: ReportCategory;
  description: string;
  location: string;
  incidentDate: string;
  imageUrl?: string;
}

export const reportKeys = {
  all: ["lostfound"] as const,
  list: (filters: ReportFilters) => ["lostfound", "list", filters] as const,
  detail: (id: string) => ["lostfound", "detail", id] as const,
};

export async function fetchReports(filters: ReportFilters): Promise<PageResponse<Report>> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.location) params.location = filters.location;
  if (filters.status) params.status = filters.status;
  params.page = String(filters.page ?? 0);
  params.size = String(filters.size ?? 12);
  const { data } = await api.get<PageResponse<Report>>("/lost-found/reports", { params });
  return data;
}

export async function fetchReport(id: string): Promise<Report> {
  const { data } = await api.get<Report>(`/lost-found/reports/${id}`);
  return data;
}

export async function createReport(payload: ReportPayload): Promise<Report> {
  const { data } = await api.post<Report>("/lost-found/reports", payload);
  return data;
}

export async function updateReport(id: string, payload: Partial<ReportPayload>): Promise<Report> {
  const { data } = await api.patch<Report>(`/lost-found/reports/${id}`, payload);
  return data;
}

export async function closeReport(id: string): Promise<Report> {
  const { data } = await api.delete<Report>(`/lost-found/reports/${id}`);
  return data;
}

export function useReports(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => fetchReports(filters),
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(id ?? ""),
    queryFn: () => fetchReport(id ?? ""),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useUpdateReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ReportPayload>) => updateReport(id, payload),
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(id), report);
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useCloseReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
