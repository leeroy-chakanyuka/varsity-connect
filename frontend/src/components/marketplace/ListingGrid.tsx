import type { ReactNode } from "react";
import type { Listing } from "../../api/marketplace";
import { ListingCard } from "./ListingCard";

/* grid plus its three quiet states, retry included */
export function ListingGrid({
  listings,
  emptyAction,
}: {
  listings: Listing[];
  emptyAction?: ReactNode;
}) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sage bg-white px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold lowercase text-cocoa">nothing found</p>
        <p className="text-sm lowercase text-taupe">try a different search or clear the filters</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function ListingSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="loading">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-sage/60 bg-white">
          <div className="aspect-square bg-sage/40" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-3/4 rounded bg-sage/50" />
            <div className="h-4 w-1/3 rounded bg-sage/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-blush bg-white px-6 py-16 text-center">
      <p className="font-display text-xl font-semibold lowercase text-cocoa">listings failed to load</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
      >
        retry
      </button>
    </div>
  );
}
