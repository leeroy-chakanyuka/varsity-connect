import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateListing, type ListingPayload } from "../api/marketplace";
import { apiMessage } from "../api/client";
import { ListingForm } from "../components/marketplace/ListingForm";

/* new listing, straight to its page on success */
export function CreateListingPage() {
  const navigate = useNavigate();
  const create = useCreateListing();
  const [failed, setFailed] = useState<string | null>(null);

  const onSubmit = async (payload: ListingPayload) => {
    try {
      const listing = await create.mutateAsync(payload);
      navigate(`/market/${listing.id}`);
    } catch (error) {
      setFailed(apiMessage(error, "could not create listing, try again"));
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/market" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to market
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          sell something<span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">honest photos and fair prices move fastest</p>
      </div>
      <div className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
        <ListingForm
          pending={create.isPending}
          serverError={failed}
          onSubmit={onSubmit}
          submitLabel={create.isPending ? "listing…" : "list it"}
        />
      </div>
    </section>
  );
}
