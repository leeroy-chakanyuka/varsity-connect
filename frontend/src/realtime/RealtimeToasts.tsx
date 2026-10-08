import { useEffect } from "react";
import { Link } from "react-router-dom";
import { notificationPath } from "../api/notifications";
import { dismissToast, useToasts } from "./toast-store";

/* little cards over the bell, click walks to whatever changed */
export function RealtimeToasts() {
  const toasts = useToasts();

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      dismissToast(toasts[0].toastId);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 top-20 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <Link
          key={toast.toastId}
          to={notificationPath(toast)}
          onClick={() => dismissToast(toast.toastId)}
          className="pointer-events-auto rounded-2xl border border-sage/70 bg-white p-4 shadow-lg transition hover:border-rosewood"
        >
          <p className="font-display text-sm font-semibold lowercase text-cocoa">{toast.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs lowercase text-taupe">{toast.message}</p>
        </Link>
      ))}
    </div>
  );
}
