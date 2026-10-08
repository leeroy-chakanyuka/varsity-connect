import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { useAuth } from "../auth/AuthContext";
import type { PageResponse } from "../types/page";

/* mirrors the backend inbox rows */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export async function fetchNotifications(): Promise<PageResponse<AppNotification>> {
  const { data } = await api.get<PageResponse<AppNotification>>("/notifications", {
    params: { size: 50 },
  });
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await api.post<AppNotification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}

/* routes derive from entity type + id, never stored urls */
export function notificationPath(notification: AppNotification): string {
  const id = notification.entityId ?? "";
  switch (notification.entityType) {
    case "listing":
      return `/market/${id}`;
    case "order":
      return `/orders/${id}`;
    case "report":
      return `/lost-found/${id}`;
    case "support-request":
      return `/survival/${id}`;
    case "post":
      return `/community/${id}`;
    case "profile":
      return "/profile";
    default:
      return "/dashboard";
  }
}

export function useNotifications() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: fetchNotifications,
    enabled: !!token,
  });
}

export function useUnreadCount() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadCount,
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
