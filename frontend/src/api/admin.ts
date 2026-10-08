import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { PageResponse } from "../types/page";
import type { AuthUser } from "./auth";
import type { Listing } from "./marketplace";
import type { Post } from "./community";
import type { SupportRequest } from "./support";

/* moderation desk shapes, rows reuse their feature types */
export const adminKeys = {
  all: ["admin"] as const,
  users: ["admin", "users"] as const,
  listings: ["admin", "listings"] as const,
  posts: ["admin", "posts"] as const,
  support: ["admin", "support"] as const,
};

export async function fetchAdminUsers(): Promise<PageResponse<AuthUser>> {
  const { data } = await api.get<PageResponse<AuthUser>>("/admin/users", { params: { size: 50 } });
  return data;
}

export async function setUserEnabled(id: string, enabled: boolean): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>(`/admin/users/${id}/${enabled ? "enable" : "disable"}`);
  return data;
}

export async function fetchAdminListings(): Promise<PageResponse<Listing>> {
  const { data } = await api.get<PageResponse<Listing>>("/admin/listings", { params: { size: 50 } });
  return data;
}

export async function archiveAdminListing(id: string): Promise<void> {
  await api.delete(`/admin/listings/${id}`);
}

export async function fetchAdminPosts(): Promise<PageResponse<Post>> {
  const { data } = await api.get<PageResponse<Post>>("/admin/community/posts", { params: { size: 50 } });
  return data;
}

export async function deleteAdminPost(id: string): Promise<void> {
  await api.delete(`/admin/community/posts/${id}`);
}

export async function fetchAdminSupport(): Promise<PageResponse<SupportRequest>> {
  const { data } = await api.get<PageResponse<SupportRequest>>("/admin/support/requests", {
    params: { size: 50 },
  });
  return data;
}

export function useAdminUsers() {
  return useQuery({ queryKey: adminKeys.users, queryFn: fetchAdminUsers });
}

export function useSetUserEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setUserEnabled(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
}

export function useAdminListings() {
  return useQuery({ queryKey: adminKeys.listings, queryFn: fetchAdminListings });
}

export function useArchiveAdminListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveAdminListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.listings });
    },
  });
}

export function useAdminPosts() {
  return useQuery({ queryKey: adminKeys.posts, queryFn: fetchAdminPosts });
}

export function useDeleteAdminPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.posts });
    },
  });
}

export function useAdminSupport() {
  return useQuery({ queryKey: adminKeys.support, queryFn: fetchAdminSupport });
}
