import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useListing, useUpdateListing, type ListingPayload } from "../api/marketplace";
import { apiMessage } from "../api/client";
import { ListingForm } from "../components/marketplace/ListingForm";

/* edit your own listing, form arrives prefilled */
export function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError } = useListing(id);
  const update = useUpdateListing(id ?? "");

  const onSubmit = async (payload: ListingPayload) => {
    if (!id) return;
    try {
      await update.mutateAsync(payload);
      navigate(`/market/${id}`);
    } catch (error) {
      setFailed(apiMessage(error, "could not save listing, try again"));
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading listing…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">listing not found</p>
        <Link to="/market" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
          back to market
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to={`/market/${data.id}`} className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to listing
      </Link>
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        edit listing<span className="text-rosewood">.</span>
      </h1>
      <div className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
        <ListingForm
          initial={data}
          pending={update.isPending}
          serverError={failed}
          onSubmit={onSubmit}
          submitLabel={update.isPending ? "saving…" : "save changes"}
        />
      </div>
    </section>
  );
}
