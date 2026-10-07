import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SUPPORT_TYPES, useSupportRequests, type SupportType } from "../api/support";
import { EmergencyButton } from "../components/survival/EmergencyButton";

const urgencyTone: Record<string, string> = {
  LOW: "bg-sage/50 text-cocoa",
  MEDIUM: "bg-blush/40 text-cocoa",
  HIGH: "bg-orange-200 text-cocoa",
  CRITICAL: "bg-red-500 text-white",
};

/* open calls for help, freshest first */
export function SurvivalModePage() {
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(params.get("type") ?? "");
  const { data, isLoading, isError, refetch } = useSupportRequests();

  const rows = (data?.content ?? []).filter((row) =>
    ["OPEN", "OFFER_RECEIVED", "IN_PROGRESS"].includes(row.status),
  );
  const visible = type ? rows.filter((row) => row.type === type) : rows;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          survival mode<span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">stuck? ask campus, campus answers</p>
      </div>

      <p className="rounded-2xl border border-blush bg-blush/30 px-4 py-3 text-center text-sm lowercase text-cocoa">
        in immediate danger? call campus emergency first, post here after
      </p>
      <EmergencyButton />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          aria-label="type filter"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setParams(event.target.value ? { type: event.target.value } : {});
          }}
          className="rounded-xl border border-sage bg-white px-3 py-2.5 text-sm lowercase text-cocoa focus:border-rosewood focus:outline-none"
        >
          <option value="">all types</option>
          {SUPPORT_TYPES.map((option: SupportType) => (
            <option key={option} value={option}>
              {option.toLowerCase()}
            </option>
          ))}
        </select>
        <Link
          to="/survival/new"
          className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90"
        >
          request help
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3" aria-label="loading">
          {[0, 1, 2].map((index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-sage/60 bg-white p-5">
              <div className="h-4 w-1/3 rounded bg-sage/50" />
              <div className="mt-2 h-3 w-2/3 rounded bg-sage/40" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-blush bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">requests failed to load</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
        </div>
      )}

      {data && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-sage bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">all quiet</p>
          <p className="text-sm lowercase text-taupe">no open requests right now</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((row) => (
          <li key={row.id}>
            <Link
              to={`/survival/${row.id}`}
              className="flex flex-col gap-1 rounded-2xl border border-sage/70 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className={`rounded-full px-2.5 py-0.5 text-[11px] lowercase ${urgencyTone[row.urgency]}`}>
                  {row.urgency.toLowerCase()}
                </p>
                <p className="text-[11px] lowercase text-taupe">
                  {row.type.toLowerCase()} · {row.status.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
              <p className="font-display text-lg font-semibold lowercase text-cocoa">{row.title}</p>
              <p className="text-xs lowercase text-taupe">
                {row.location.toLowerCase()} · {row.requester.fullName.toLowerCase()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
