import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { CATEGORIES, useReports, type ReportCategory } from "../api/lostfound";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { ReportCard } from "../components/lostfound/ReportCard";

/* lost and found feed, tab lives in the url */
export function LostFoundPage() {
  const [params, setParams] = useSearchParams();
  const tab: "LOST" | "FOUND" = params.get("type") === "FOUND" ? "FOUND" : "LOST";
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const search = useDebouncedValue(draft);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [page, setPage] = useState(0);

  const filters = {
    search: search || undefined,
    type: tab,
    category: (category || undefined) as ReportCategory | undefined,
    location: location || undefined,
    page,
    size: 12,
  };
  const { data, isLoading, isError, refetch } = useReports(filters);

  const switchTab = (next: "LOST" | "FOUND") => {
    setParams(next === "LOST" ? {} : { type: "FOUND" });
    setPage(0);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
            lost &amp; found<span className="text-rosewood">.</span>
          </h1>
          <p className="mt-1 text-sm lowercase text-taupe">lost it, found it, get it back</p>
        </div>
        <Link
          to="/lost-found/new"
          className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90"
        >
          report an item
        </Link>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="report side">
        {(["LOST", "FOUND"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={tab === option}
            type="button"
            onClick={() => switchTab(option)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm lowercase transition sm:flex-none sm:px-8 ${
              tab === option ? "bg-cocoa text-white" : "border border-sage bg-white text-taupe"
            }`}
          >
            {option === "LOST" ? "lost" : "found"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          type="search"
          aria-label="search reports"
          placeholder="search wallets, laptops…"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setPage(0);
          }}
          className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm lowercase text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none"
        />
        <select
          aria-label="category filter"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-sage bg-white px-3 py-2.5 text-sm lowercase text-cocoa focus:border-rosewood focus:outline-none lg:w-56"
        >
          <option value="">all categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option.toLowerCase().replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          aria-label="location filter"
          placeholder="location…"
          value={location}
          onChange={(event) => {
            setLocation(event.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-sage bg-white px-4 py-2.5 text-sm lowercase text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none lg:w-56"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-sage/60 bg-white">
              <div className="aspect-video bg-sage/40" />
              <div className="flex flex-col gap-2 p-4">
                <div className="h-4 w-2/3 rounded bg-sage/50" />
                <div className="h-3 w-1/3 rounded bg-sage/50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-blush bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">reports failed to load</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
        </div>
      )}

      {data && data.content.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-sage bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">no reports yet</p>
          <p className="text-sm lowercase text-taupe">be the first to report one</p>
        </div>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <nav aria-label="report pages" className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={data.first}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa disabled:opacity-40"
              >
                ← newer
              </button>
              <p className="text-xs lowercase text-taupe">
                page {data.page + 1} of {data.totalPages}
              </p>
              <button
                type="button"
                disabled={data.last}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa disabled:opacity-40"
              >
                older →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
