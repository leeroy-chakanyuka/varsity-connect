import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatPrice, useArchiveListing, useListing } from "../api/marketplace";
import { useAuth } from "../auth/AuthContext";
import { apiMessage } from "../api/client";
import { ListingGallery } from "../components/marketplace/ListingGallery";
import { SellerCard } from "../components/marketplace/SellerCard";

/* full card for one listing, owner tools only for owner and admin */
export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useListing(id);
  const archive = useArchiveListing();

  const mine = !!user && !!data && (data.seller.id === user.id || user.role === "ADMIN");

  const onArchive = async () => {
    if (!id) return;
    try {
      await archive.mutateAsync(id);
      navigate("/market");
    } catch (error) {
      setConfirming(false);
      setFailed(apiMessage(error, "archive failed, try again"));
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading listing…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">listing not found</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
          <Link
            to="/market"
            className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa"
          >
            back to market
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/market" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to market
      </Link>

      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ListingGallery listing={data} />
          <article className="rounded-2xl border border-sage/70 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
                {data.title}
              </h1>
              <p className="text-2xl font-semibold text-cocoa">{formatPrice(data.price)}</p>
            </div>
            <p className="mt-1 text-xs lowercase text-taupe">
              {data.condition.toLowerCase().replace("_", " ")} ·{" "}
              {data.category.toLowerCase().replace("_", " ")}
              {data.location ? ` · ${data.location.toLowerCase()}` : ""} ·{" "}
              listed {new Date(data.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-4 whitespace-pre-line text-sm text-cocoa">{data.description}</p>
          </article>

          {mine && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/market/${data.id}/edit`}
                className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-rosewood hover:text-rosewood"
              >
                edit listing
              </Link>
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={onArchive}
                    disabled={archive.isPending}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm lowercase text-white disabled:opacity-60"
                  >
                    {archive.isPending ? "archiving…" : "yes, archive it"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa"
                  >
                    keep it
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-red-400 hover:text-red-500"
                >
                  archive
                </button>
              )}
            </div>
          )}
        </div>

        <SellerCard listing={data} />
      </div>
    </section>
  );
}
