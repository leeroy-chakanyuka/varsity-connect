import { useSyncExternalStore } from "react";
import type { AppNotification } from "../api/notifications";

/* tiny toast bus, no store dependency — socket pushes, shell renders */
export interface Toast extends AppNotification {
  toastId: number;
}

let toastId = 0;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function pushToast(notification: AppNotification) {
  toastId += 1;
  /* newest first, keep the pile small */
  toasts = [{ ...notification, toastId }, ...toasts].slice(0, 3);
  emit();
}

export function dismissToast(id: number) {
  toasts = toasts.filter((toast) => toast.toastId !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): Toast[] {
  return toasts;
}

/* serene cache: tests reset the pile between runs */
export function resetToasts() {
  toasts = [];
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
