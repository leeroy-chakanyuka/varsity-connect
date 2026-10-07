import { Link } from "react-router-dom";
import { formatPrice, type Listing } from "../../api/marketplace";
import { AddToCartButton } from "./AddToCartButton";

/* who sells it, linking to their public card */
export function SellerCard({ listing }: { listing: Listing }) {
  return (
    <article className="rounded-2xl border border-sage/70 bg-white p-5">
      <p className="text-xs lowercase tracking-wider text-taupe">seller</p>
      <p className="mt-1 font-display text-lg font-semibold lowercase text-cocoa">
        {listing.seller.fullName}
      </p>
      <Link
        to={`/profile/${listing.seller.id}`}
        className="mt-2 inline-block text-sm lowercase text-rosewood hover:underline"
      >
        view profile
      </Link>
      <div className="mt-3 border-t border-sage/60 pt-3">
        <p className="text-sm font-semibold text-cocoa">{formatPrice(listing.price)}</p>
        <p className="text-xs lowercase text-taupe">seller rating arrives with reviews</p>
      </div>
      <div className="mt-4">
        <AddToCartButton listing={listing} />
      </div>
    </article>
  );
}
