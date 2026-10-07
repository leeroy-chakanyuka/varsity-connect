import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  useCloseReport,
  useReport,
  useUpdateReport,
  type ReportPayload,
} from "../api/lostfound";
import { ReportForm } from "../components/lostfound/ReportForm";
import { PotentialMatches } from "../components/lostfound/PotentialMatches";

/* one report, owner tools only for the reporter and admins */
export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useReport(id);
  const update = useUpdateReport(id ?? "");
  const close = useCloseReport();

  const mine = !!user && !!data && (data.owner.id === user.id || user.role === "ADMIN");

  const onSubmit = async (payload: ReportPayload) => {
    try {
      setFailed(null);
      await update.mutateAsync(payload);
      setEditing(false);
    } catch (error) {
      setFailed(apiMessage(error, "could not save report, try again"));
    }
  };

  const onClose = async () => {
    if (!id) return;
    try {
      await close.mutateAsync(id);
      navigate("/lost-found");
    } catch (error) {
      setConfirming(false);
      setFailed(apiMessage(error, "could not close report, try again"));
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading report…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">report not found</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
          <Link to="/lost-found" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
            all reports
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <Link to="/lost-found" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← all reports
      </Link>

      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <article className="rounded-2xl border border-sage/70 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`rounded-full px-2.5 py-0.5 text-xs lowercase ${
              data.type === "LOST" ? "bg-blush/50 text-cocoa" : "bg-sage/50 text-cocoa"
            }`}
          >
            {data.type.toLowerCase()}
          </p>
          <p className="text-xs lowercase text-taupe">{data.status.toLowerCase().replace(/_/g, " ")}</p>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          {data.itemName}
        </h1>
        {data.imageUrl && (
          <img src={data.imageUrl} alt={data.itemName} className="mt-4 aspect-video w-full rounded-xl object-cover" />
        )}
        <p className="mt-4 whitespace-pre-line text-sm text-cocoa">{data.description}</p>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="lowercase text-taupe">reported by</dt>
            <dd className="lowercase text-cocoa">{data.owner.fullName}</dd>
          </div>
          <div>
            <dt className="lowercase text-taupe">location</dt>
            <dd className="lowercase text-cocoa">{data.location}</dd>
          </div>
          <div>
            <dt className="lowercase text-taupe">incident date</dt>
            <dd className="text-cocoa">{new Date(data.incidentDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="lowercase text-taupe">category</dt>
            <dd className="lowercase text-cocoa">{data.category.toLowerCase().replace("_", " ")}</dd>
          </div>
        </dl>
      </article>

      {mine && data.status !== "CLOSED" && <PotentialMatches reportId={data.id} />}

      {mine && !editing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-rosewood hover:text-rosewood"
          >
            edit report
          </button>
          {confirming ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={close.isPending}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm lowercase text-white disabled:opacity-60"
              >
                {close.isPending ? "closing…" : "yes, close it"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa"
              >
                keep it
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-red-400 hover:text-red-500"
            >
              close report
            </button>
          )}
        </div>
      )}

      {mine && editing && (
        <div className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
          <ReportForm
            initial={data}
            pending={update.isPending}
            serverError={failed}
            onSubmit={onSubmit}
            submitLabel={update.isPending ? "saving…" : "save changes"}
          />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-3 text-sm lowercase text-taupe hover:text-rosewood"
          >
            cancel editing
          </button>
        </div>
      )}
    </section>
  );
}
