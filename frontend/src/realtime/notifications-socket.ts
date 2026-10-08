import { Client, type IMessage } from "@stomp/stompjs";
import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { notificationKeys, type AppNotification } from "../api/notifications";
import { supportKeys } from "../api/support";
import { communityKeys } from "../api/community";
import { orderKeys } from "../api/orders";
import { reportKeys as lostFoundKeys, matchKeys } from "../api/lostfound";
import { pushToast } from "./toast-store";

/* one client per tab, strict-mode double effects share it */
let client: Client | null = null;
let activeToken: string | null = null;
let starts = 0;

function wsUrl(): string {
  const http = import.meta.env.VITE_WS_URL ?? "http://localhost:8080/ws";
  return http.replace(/^http/, "ws");
}

function invalidateFor(queryClient: QueryClient, notification: AppNotification) {
  /* inbox always, feature caches depend on what the ping is about */
  queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  switch (notification.entityType) {
    case "report":
      queryClient.invalidateQueries({ queryKey: lostFoundKeys.all });
      if (notification.entityId) {
        queryClient.invalidateQueries({ queryKey: matchKeys.forReport(notification.entityId) });
      }
      break;
    case "support-request":
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
      break;
    case "post":
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      break;
    case "order":
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      break;
    case "profile":
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      break;
    case "listing":
      /* shelf refreshes on next visit, nothing cached by id */
      break;
    default:
      break;
  }
}

function onMessage(queryClient: QueryClient, frame: IMessage) {
  try {
    const notification = JSON.parse(frame.body) as AppNotification;
    if (!notification || !notification.id) {
      return;
    }
    pushToast(notification);
    invalidateFor(queryClient, notification);
  } catch {
    /* a malformed frame never breaks the socket */
  }
}

/* connect after login, jwt rides the CONNECT frame for the interceptor */
export function startNotificationsSocket(token: string, queryClient: QueryClient) {
  if (client && activeToken === token) {
    return;
  }
  stopNotificationsSocket();
  activeToken = token;
  starts += 1;
  const current = starts;
  const next = new Client({
    brokerURL: wsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    /* quiet backoff, the bell keeps polling meanwhile */
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      /* a newer start won the race, this one stands down */
      if (current !== starts || next !== client) {
        return;
      }
      next.subscribe("/user/queue/notifications", (frame) => onMessage(queryClient, frame));
    },
  });
  client = next;
  next.activate();
}

export function stopNotificationsSocket() {
  activeToken = null;
  starts += 1;
  const old = client;
  client = null;
  /* deactivate is async, fire and forget on logout */
  void old?.deactivate();
}

/* serene cache for tests */
export function __socketState() {
  return { activeToken, connected: client?.active ?? false };
}

/* lives beside auth state, token drives the whole lifecycle */
export function useNotificationsSocket() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      stopNotificationsSocket();
      return;
    }
    startNotificationsSocket(token, queryClient);
    return () => {
      /* strict-mode mounts twice, the singleton survives the first unmount */
    };
  }, [token, queryClient]);
}
