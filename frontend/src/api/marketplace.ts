import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { PageResponse } from "../types/page";

/* mirrors the backend listing DTOs, money arrives as a plain number */
export type ListingCategory =
  | "TEXTBOOKS"
  | "ELECTRONICS"
  | "CLOTHING"
  | "FURNITURE"
  | "STUDY_MATERIALS"
  | "SERVICES"
  | "ACCOMMODATION"
  | "OTHER";

export type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export type ListingStatus = "ACTIVE" | "RESERVED" | "SOLD" | "ARCHIVED";

export const CATEGORIES: ListingCategory[] = [
  "TEXTBOOKS",
  "ELECTRONICS",
  "CLOTHING",
  "FURNITURE",
  "STUDY_MATERIALS",
  "SERVICES",
  "ACCOMMODATION",
  "OTHER",
];

export const CONDITIONS: ListingCondition[] = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

export interface ListingSeller {
  id: string;
  fullName: string;
}

export interface Listing {
  id: string;
  seller: ListingSeller;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  location: string | null;
  status: ListingStatus;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilters {
  search?: string;
  category?: ListingCategory;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  status?: ListingStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ListingPayload {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  location?: string;
  imageUrls?: string[];
}

export const listingKeys = {
  all: ["marketplace"] as const,
  list: (filters: ListingFilters) => ["marketplace", "list", filters] as const,
  detail: (id: string) => ["marketplace", "detail", id] as const,
};

/* thin wrappers, pages own the caching through the hooks below */
export async function fetchListings(filters: ListingFilters): Promise<PageResponse<Listing>> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.condition) params.condition = filters.condition;
  if (filters.minPrice !== undefined) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice !== undefined) params.maxPrice = String(filters.maxPrice);
  if (filters.sellerId) params.sellerId = filters.sellerId;
  if (filters.status) params.status = filters.status;
  params.page = String(filters.page ?? 0);
  params.size = String(filters.size ?? 12);
  if (filters.sort) params.sort = filters.sort;
  const { data } = await api.get<PageResponse<Listing>>("/marketplace/listings", { params });
  return data;
}

export async function fetchListing(id: string): Promise<Listing> {
  const { data } = await api.get<Listing>(`/marketplace/listings/${id}`);
  return data;
}

export async function createListing(payload: ListingPayload): Promise<Listing> {
  const { data } = await api.post<Listing>("/marketplace/listings", payload);
  return data;
}

export async function updateListing(id: string, payload: Partial<ListingPayload>): Promise<Listing> {
  const { data } = await api.patch<Listing>(`/marketplace/listings/${id}`, payload);
  return data;
}

export async function archiveListing(id: string): Promise<Listing> {
  const { data } = await api.delete<Listing>(`/marketplace/listings/${id}`);
  return data;
}

export function useListings(filters: ListingFilters) {
  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => fetchListings(filters),
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.detail(id ?? ""),
    queryFn: () => fetchListing(id ?? ""),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ListingPayload>) => updateListing(id, payload),
    onSuccess: (listing) => {
      queryClient.setQueryData(listingKeys.detail(id), listing);
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useArchiveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

/* rands, one decimal-free price string everywhere */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(price);
}
