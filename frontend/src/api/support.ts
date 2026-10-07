import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { PageResponse } from "../types/page";

/* mirrors the backend survival DTOs */
export type SupportType = "ACCOMMODATION" | "FOOD" | "TRANSPORT" | "FINANCIAL" | "ACADEMIC" | "OTHER";
export type SupportUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SupportStatus = "OPEN" | "OFFER_RECEIVED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "COMPLETED";

export const SUPPORT_TYPES: SupportType[] = [
  "ACCOMMODATION",
  "FOOD",
  "TRANSPORT",
  "FINANCIAL",
  "ACADEMIC",
  "OTHER",
];

export const URGENCIES: SupportUrgency[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export interface SupportRequest {
  id: string;
  requester: { id: string; fullName: string };
  type: SupportType;
  title: string;
  description: string;
  location: string;
  urgency: SupportUrgency;
  status: SupportStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportOffer {
  id: string;
  requestId: string;
  responder: { id: string; fullName: string };
  message: string;
  status: OfferStatus;
  createdAt: string;
}

export interface SupportRequestPayload {
  type: SupportType;
  title: string;
  description: string;
  location: string;
  urgency: SupportUrgency;
}

export const supportKeys = {
  all: ["support"] as const,
  list: (status?: string) => ["support", "list", status ?? "all"] as const,
  detail: (id: string) => ["support", "detail", id] as const,
  offers: (id: string) => ["support", "offers", id] as const,
};

export async function fetchSupportRequests(status?: SupportStatus): Promise<PageResponse<SupportRequest>> {
  const { data } = await api.get<PageResponse<SupportRequest>>("/support/requests", {
    params: status ? { status } : {},
  });
  return data;
}

export async function fetchSupportRequest(id: string): Promise<SupportRequest> {
  const { data } = await api.get<SupportRequest>(`/support/requests/${id}`);
  return data;
}

export async function createSupportRequest(payload: SupportRequestPayload): Promise<SupportRequest> {
  const { data } = await api.post<SupportRequest>("/support/requests", payload);
  return data;
}

export async function updateSupportRequest(id: string, payload: Partial<SupportRequestPayload>): Promise<SupportRequest> {
  const { data } = await api.patch<SupportRequest>(`/support/requests/${id}`, payload);
  return data;
}

export async function cancelSupportRequest(id: string): Promise<SupportRequest> {
  const { data } = await api.post<SupportRequest>(`/support/requests/${id}/cancel`);
  return data;
}

export async function resolveSupportRequest(id: string): Promise<SupportRequest> {
  const { data } = await api.post<SupportRequest>(`/support/requests/${id}/resolve`);
  return data;
}

export async function fetchSupportOffers(requestId: string): Promise<SupportOffer[]> {
  const { data } = await api.get<SupportOffer[]>(`/support/requests/${requestId}/offers`);
  return data;
}

export async function createSupportOffer(requestId: string, message: string): Promise<SupportOffer> {
  const { data } = await api.post<SupportOffer>(`/support/requests/${requestId}/offers`, { message });
  return data;
}

export async function acceptSupportOffer(offerId: string): Promise<SupportOffer> {
  const { data } = await api.post<SupportOffer>(`/support/offers/${offerId}/accept`);
  return data;
}

export async function declineSupportOffer(offerId: string): Promise<SupportOffer> {
  const { data } = await api.post<SupportOffer>(`/support/offers/${offerId}/decline`);
  return data;
}

export async function withdrawSupportOffer(offerId: string): Promise<SupportOffer> {
  const { data } = await api.post<SupportOffer>(`/support/offers/${offerId}/withdraw`);
  return data;
}

function useInvalidateSupport() {
  const queryClient = useQueryClient();
  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
    },
  };
}

export function useSupportRequests(status?: SupportStatus) {
  return useQuery({
    queryKey: supportKeys.list(status),
    queryFn: () => fetchSupportRequests(status),
  });
}

export function useSupportRequest(id: string | undefined) {
  return useQuery({
    queryKey: supportKeys.detail(id ?? ""),
    queryFn: () => fetchSupportRequest(id ?? ""),
    enabled: !!id,
    retry: false,
  });
}

export function useSupportOffers(requestId: string | undefined) {
  return useQuery({
    queryKey: supportKeys.offers(requestId ?? ""),
    queryFn: () => fetchSupportOffers(requestId ?? ""),
    enabled: !!requestId,
  });
}

export function useCreateSupportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
    },
  });
}

export function useOfferSupport(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => createSupportOffer(requestId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
    },
  });
}

export function useAcceptOffer() {
  return useMutation({ mutationFn: acceptSupportOffer, ...useInvalidateSupport() });
}

export function useDeclineOffer() {
  return useMutation({ mutationFn: declineSupportOffer, ...useInvalidateSupport() });
}

export function useWithdrawOffer() {
  return useMutation({ mutationFn: withdrawSupportOffer, ...useInvalidateSupport() });
}

export function useResolveRequest() {
  return useMutation({ mutationFn: resolveSupportRequest, ...useInvalidateSupport() });
}

export function useCancelRequest() {
  return useMutation({ mutationFn: cancelSupportRequest, ...useInvalidateSupport() });
}
