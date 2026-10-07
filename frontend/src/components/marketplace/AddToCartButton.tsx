import { Link } from "react-router-dom";
import { useState } from "react";
import { useAddToCart, useCart } from "../../api/cart";
import type { Listing } from "../../api/marketplace";
import { useAuth } from "../../auth/AuthContext";
import { apiCode, apiMessage } from "../../api/client";

/* wakes up the disabled placeholder from stage 7, still quiet for owners */
export function AddToCartButton({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const { data: cart } = useCart();
  const add = useAddToCart();
  const [failed, setFailed] = useState<string | null>(null);

  const mine = !!user && user.id === listing.seller.id;
  const already = cart?.items.some((item) => item.listingId === listing.id) ?? false;

  if (mine) {
    return (
      <p className="w-full rounded-xl bg-sage/50 px-4 py-3 text-center text-sm lowercase text-taupe">
        this is your listing
      </p>
    );
  }

  if (listing.status !== "ACTIVE") {
    return (
      <p className="w-full rounded-xl bg-sage/50 px-4 py-3 text-center text-sm lowercase text-taupe">
        no longer available
      </p>
    );
  }

  if (already) {
    return (
      <Link
        to="/cart"
        className="block w-full rounded-xl border border-rosewood bg-white px-4 py-3 text-center text-sm lowercase text-rosewood"
      >
        in your cart → view it
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {failed && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      <button
        type="button"
        disabled={add.isPending}
        onClick={async () => {
          try {
            setFailed(null);
            await add.mutateAsync(listing.id);
          } catch (error) {
            setFailed(
              apiCode(error) === "LISTING_NOT_AVAILABLE"
                ? "sorry, that just sold"
                : apiMessage(error, "could not add to cart, try again"),
            );
          }
        }}
        className="w-full rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {add.isPending ? "adding…" : "add to cart"}
      </button>
    </div>
  );
}
