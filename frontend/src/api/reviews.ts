import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { orderKeys } from "./orders";

/* mirrors the backend review DTOs, newest first everywhere */
export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewPayload {
  orderId: string;
  rating: number;
  comment: string;
}

export const reviewKeys = {
  all: ["reviews"] as const,
  forUser: (userId: string) => ["reviews", "user", userId] as const,
};

export async function fetchReviews(userId: string): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/users/${userId}/reviews`);
  return data;
}

export async function postReview(userId: string, payload: ReviewPayload): Promise<Review> {
  const { data } = await api.post<Review>(`/users/${userId}/reviews`, payload);
  return data;
}

export function useReviews(userId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.forUser(userId ?? ""),
    queryFn: () => fetchReviews(userId ?? ""),
    enabled: !!userId,
    retry: false,
  });
}

export function usePostReview(revieweeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewPayload) => postReview(revieweeId, payload),
    onSuccess: () => {
      /* fresh voice, profile numbers and the order receipt all move */
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
