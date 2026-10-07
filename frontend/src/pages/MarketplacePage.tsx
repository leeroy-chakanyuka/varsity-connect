import { Link, useSearchParams } from "react-router-dom";
import {
  useListings,
  type ListingCategory,
  type ListingCondition,
} from "../api/marketplace";
import { ListingError, ListingGrid, ListingSkeletons } from "../components/marketplace/ListingGrid";
import { ListingFilters, type FilterValues } from "../components/marketplace/ListingFilters";
import { ListingSearch } from "../components/marketplace/ListingSearch";

/* browse everything, url holds the filters so refresh and back survive */
export function MarketplacePage() {
  const [params, setParams] = useSearchParams();

  const values: FilterValues = {
    category: params.get("category") ?? "",
    condition: params.get("condition") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    sort: params.get("sort") ?? "createdAt,desc",
  };
  const search = params.get("q") ?? "";
  const page = Math.max(Number(params.get("page") ?? "0") || 0, 0);

  const patch = (next: Record<string, string | undefined>, resetPage = true) => {
    const merged = new URLSearchParams(params);
    for (const [key, val] of Object.entries(next)) {
      if (val) {
        merged.set(key, val);
      } else {
        merged.delete(key);
      }
    }
    if (resetPage) {
      merged.delete("page");
    }
    setParams(merged);
  };

  const filters = {
    search: search || undefined,
    category: (values.category || undefined) as ListingCategory | undefined,
    condition: (values.condition || undefined) as ListingCondition | undefined,
    minPrice: values.minPrice ? Number(values.minPrice) : undefined,
    maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
    status: "ACTIVE" as const,
    page,
    size: 12,
    sort: values.sort,
  };

  const { data, isLoading, isError, refetch } = useListings(filters);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
            marketplace<span className="text-rosewood">.</span>
          </h1>
          <p className="mt-1 text-sm lowercase text-taupe">textbooks to laptops, from your campus</p>
        </div>
        <Link
          to="/market/new"
          className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90"
        >
          sell something
        </Link>
      </div>

      <ListingSearch value={search} onChange={(next) => patch({ q: next || undefined })} />

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64">
          <ListingFilters
            values={values}
            onChange={(next) =>
              patch({
                category: next.category || undefined,
                condition: next.condition || undefined,
                minPrice: next.minPrice || undefined,
                maxPrice: next.maxPrice || undefined,
                sort: next.sort === "createdAt,desc" ? undefined : next.sort,
              })
            }
            onReset={() => setParams({})}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {isLoading && <ListingSkeletons />}
          {isError && <ListingError onRetry={() => refetch()} />}
          {data && (
            <>
              <ListingGrid
                listings={data.content}
                emptyAction={
                  <button
                    type="button"
                    onClick={() => setParams({})}
                    className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa hover:border-rosewood hover:text-rosewood"
                  >
                    clear search and filters
                  </button>
                }
              />
              {data.totalPages > 1 && (
                <nav aria-label="listing pages" className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={data.first}
                    onClick={() => patch({ page: String(page - 1) }, false)}
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
                    onClick={() => patch({ page: String(page + 1) }, false)}
                    className="rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa disabled:opacity-40"
                  >
                    older →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
