import { useState } from "react";
import type { Listing } from "../../api/marketplace";

/* photo strip with a big viewer, calm placeholder when imageless */
export function ListingGallery({ listing }: { listing: Listing }) {
  const [active, setActive] = useState(0);
  const current = listing.imageUrls[active];

  return (
    <div className="flex flex-col gap-2">
      {current ? (
        <img
          src={current}
          alt={listing.title}
          className="aspect-square w-full rounded-2xl border border-sage/70 object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-sage bg-milk">
          <p className="text-sm lowercase text-taupe">no images yet</p>
        </div>
      )}
      {listing.imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {listing.imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`view image ${index + 1}`}
              className={`shrink-0 overflow-hidden rounded-xl border-2 ${
                index === active ? "border-rosewood" : "border-transparent"
              }`}
            >
              <img src={url} alt="" className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
