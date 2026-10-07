import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  notificationPath,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../api/notifications";

/* inbox, unread first and glowing */
export function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, isError, refetch } = useNotifications();
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const rows = data?.content ?? [];
  const visible = filter === "unread" ? rows.filter((row) => !row.readAt) : rows;

  const open = async (id: string, readAt: string | null, path: string) => {
    if (!readAt) {
      try {
        await markRead.mutateAsync(id);
      } catch {
        /* still navigate, the row stays bold */
      }
    }
    navigate(path);
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading notifications…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">inbox failed to load</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
        >
          retry
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          notifications<span className="text-rosewood">.</span>
        </h1>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || rows.every((row) => row.readAt)}
          className="rounded-xl border border-sage bg-white px-3 py-1.5 text-sm lowercase text-cocoa disabled:opacity-40"
        >
          mark all read
        </button>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="inbox filter">
        {(["all", "unread"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={filter === option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-xl px-4 py-2 text-sm lowercase transition ${
              filter === option ? "bg-cocoa text-white" : "border border-sage bg-white text-taupe"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-sage bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">
            {filter === "unread" ? "all caught up" : "nothing here yet"}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {visible.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => open(row.id, row.readAt, notificationPath(row))}
              className={`flex w-full flex-col gap-0.5 rounded-2xl border p-4 text-left transition hover:shadow-md ${
                row.readAt ? "border-sage/60 bg-white" : "border-rosewood/60 bg-blush/20"
              }`}
            >
              <p className={`text-sm ${row.readAt ? "text-cocoa" : "font-semibold text-cocoa"}`}>
                {row.title}
              </p>
              <p className="text-xs lowercase text-taupe">{row.message}</p>
              <p className="mt-1 text-[11px] lowercase text-taupe">
                {new Date(row.createdAt).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <Link to="/dashboard" className="text-center text-sm lowercase text-taupe hover:text-rosewood">
        back to dashboard
      </Link>
    </section>
  );
}
