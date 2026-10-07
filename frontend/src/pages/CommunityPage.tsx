import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFeed, type FeedSort } from "../api/community";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PostCard } from "../components/community/PostCard";

/* campus wall, latest or loudest first */
export function CommunityPage() {
  const [params, setParams] = useSearchParams();
  const sort: FeedSort = params.get("sort") === "trending" ? "trending" : "latest";
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const search = useDebouncedValue(draft) || undefined;
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useFeed(search, sort, page);

  const switchSort = (next: FeedSort) => {
    setParams(next === "latest" ? {} : { sort: next });
    setPage(0);
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
            community<span className="text-rosewood">.</span>
          </h1>
          <p className="mt-1 text-sm lowercase text-taupe">threads from your campus</p>
        </div>
        <Link
          to="/community/new"
          className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90"
        >
          start a thread
        </Link>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="feed order">
        {(["latest", "trending"] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={sort === option}
            type="button"
            onClick={() => switchSort(option)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm lowercase transition sm:flex-none sm:px-8 ${
              sort === option ? "bg-cocoa text-white" : "border border-sage bg-white text-taupe"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <input
        type="search"
        aria-label="search threads"
        placeholder="search threads…"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setPage(0);
        }}
        className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm lowercase text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none"
      />

      {isLoading && (
        <div className="flex flex-col gap-3" aria-label="loading">
          {[0, 1, 2].map((index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-sage/60 bg-white p-4">
              <div className="h-4 w-2/3 rounded bg-sage/50" />
              <div className="mt-2 h-3 w-1/3 rounded bg-sage/40" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-blush bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold lowercase text-cocoa">threads failed to load</p>
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
          <p className="font-display text-xl font-semibold lowercase text-cocoa">quiet here</p>
          <p className="text-sm lowercase text-taupe">start the first thread</p>
        </div>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <nav aria-label="thread pages" className="flex items-center justify-center gap-3 pt-2">
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
