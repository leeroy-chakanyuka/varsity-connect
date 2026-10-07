import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { PageResponse } from "../types/page";

/* mirrors the backend thread DTOs, flat replies only in v1 */
export interface PostAuthor {
  id: string;
  fullName: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  title: string;
  body: string;
  imageUrl: string | null;
  pinned: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: PostAuthor;
  body: string;
  createdAt: string;
}

export type FeedSort = "latest" | "trending";

export const communityKeys = {
  all: ["community"] as const,
  feed: (search: string | undefined, sort: FeedSort, page: number) =>
    ["community", "feed", search ?? "", sort, page] as const,
  detail: (id: string) => ["community", "detail", id] as const,
  comments: (id: string) => ["community", "comments", id] as const,
};

export async function fetchPosts(search: string | undefined, sort: FeedSort, page: number): Promise<PageResponse<Post>> {
  const { data } = await api.get<PageResponse<Post>>("/community/posts", {
    params: { ...(search ? { search } : {}), sort, page, size: 10 },
  });
  return data;
}

export async function fetchPost(id: string): Promise<Post> {
  const { data } = await api.get<Post>(`/community/posts/${id}`);
  return data;
}

export async function createPost(payload: { title: string; body: string; imageUrl?: string }): Promise<Post> {
  const { data } = await api.post<Post>("/community/posts", payload);
  return data;
}

export async function updatePost(id: string, payload: { title?: string; body?: string }): Promise<Post> {
  const { data } = await api.patch<Post>(`/community/posts/${id}`, payload);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/community/posts/${id}`);
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data } = await api.get<PostComment[]>(`/community/posts/${postId}/comments`);
  return data;
}

export async function createComment(postId: string, body: string): Promise<PostComment> {
  const { data } = await api.post<PostComment>(`/community/posts/${postId}/comments`, { body });
  return data;
}

export function useFeed(search: string | undefined, sort: FeedSort, page: number) {
  return useQuery({
    queryKey: communityKeys.feed(search, sort, page),
    queryFn: () => fetchPosts(search, sort, page),
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: communityKeys.detail(id ?? ""),
    queryFn: () => fetchPost(id ?? ""),
    enabled: !!id,
    retry: false,
  });
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.comments(postId ?? ""),
    queryFn: () => fetchComments(postId ?? ""),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useUpdatePost(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title?: string; body?: string }) => updatePost(id, payload),
    onSuccess: (post) => {
      queryClient.setQueryData(communityKeys.detail(id), post);
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
