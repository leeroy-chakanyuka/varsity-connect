import { Link } from "react-router-dom";
import { formatPrice, type Listing } from "../../api/marketplace";

/* one card in the grid, image first like stardust product cards */
export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.imageUrls[0];

  return (
    <Link
      to={`/market/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sage/70 bg-white shadow-sm transition hover:shadow-md"
    >
      {cover ? (
        <img src={cover} alt={listing.title} className="aspect-square w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-milk" aria-hidden="true">
          <p className="text-xs lowercase text-taupe">no image</p>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="font-display text-lg font-semibold lowercase text-cocoa group-hover:text-rosewood">
          {listing.title}
        </p>
        <p className="text-base font-semibold text-cocoa">{formatPrice(listing.price)}</p>
        <p className="text-xs lowercase text-taupe">
          {listing.condition.toLowerCase().replace("_", " ")} · {listing.category.toLowerCase().replace("_", " ")}
        </p>
      </div>
    </Link>
  );
}
