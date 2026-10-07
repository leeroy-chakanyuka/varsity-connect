import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  useAcceptOffer,
  useCancelRequest,
  useDeclineOffer,
  useOfferSupport,
  useResolveRequest,
  useSupportOffers,
  useSupportRequest,
  useWithdrawOffer,
} from "../api/support";
import { Field } from "../components/ui/field";

/* one call for help with its raised hands, sides decide their own moves */
export function SupportRequestDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [offerOpen, setOfferOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useSupportRequest(id);
  const { data: offers } = useSupportOffers(id);
  const offerSupport = useOfferSupport(id ?? "");
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();
  const withdraw = useWithdrawOffer();
  const resolve = useResolveRequest();
  const cancel = useCancelRequest();

  const mine = !!user && !!data && data.requester.id === user.id;
  const active = data && !["RESOLVED", "CANCELLED"].includes(data.status);

  const run = async (work: () => Promise<unknown>) => {
    try {
      setFailed(null);
      await work();
    } catch (error) {
      setFailed(apiMessage(error, "that did not work, try again"));
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading request…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">request not found</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
          <Link to="/survival" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
            survival mode
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <Link to="/survival" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← survival mode
      </Link>

      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <article className="rounded-2xl border border-sage/70 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full bg-blush/40 px-2.5 py-0.5 text-xs lowercase text-cocoa">
            {data.urgency.toLowerCase()}
          </p>
          <p className="text-xs lowercase text-taupe">
            {data.type.toLowerCase()} · {data.status.toLowerCase().replace(/_/g, " ")}
          </p>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          {data.title}
        </h1>
        <p className="mt-3 whitespace-pre-line text-sm text-cocoa">{data.description}</p>
        <p className="mt-3 text-xs lowercase text-taupe">
          {data.location.toLowerCase()} · asked by {data.requester.fullName.toLowerCase()}
        </p>
      </article>

      {/* requester sees every hand, strangers only get the offer button */}
      {mine && offers && offers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
            offers<span className="text-rosewood">.</span>
          </h2>
          {offers.map((offer) => (
            <article key={offer.id} className="rounded-2xl border border-sage/70 bg-white p-4">
              <p className="text-sm text-cocoa">{offer.message}</p>
              <p className="mt-1 text-xs lowercase text-taupe">
                {offer.responder.fullName.toLowerCase()} · {offer.status.toLowerCase()}
              </p>
              {offer.status === "PENDING" && active && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => run(() => accept.mutateAsync(offer.id))}
                    className="rounded-xl bg-cocoa px-3 py-1.5 text-sm lowercase text-white"
                  >
                    accept
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => decline.mutateAsync(offer.id))}
                    className="rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa"
                  >
                    decline
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!mine && active && (
        <div>
          {!offerOpen ? (
            <button
              type="button"
              onClick={() => setOfferOpen(true)}
              className="w-full rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90"
            >
              offer help
            </button>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (message.trim()) {
                  run(() => offerSupport.mutateAsync(message.trim())).then(() => {
                    setMessage("");
                    setOfferOpen(false);
                  });
                }
              }}
              className="flex flex-col gap-2 rounded-2xl border border-sage/70 bg-white p-4"
            >
              <Field label="how can you help" htmlFor="offer-message">
                <textarea
                  id="offer-message"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="i can bring food around 7…"
                  className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none"
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={offerSupport.isPending || !message.trim()}
                  className="flex-1 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white disabled:opacity-60"
                >
                  {offerSupport.isPending ? "sending…" : "send offer"}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferOpen(false)}
                  className="rounded-xl border border-sage px-4 py-2.5 text-sm lowercase text-cocoa"
                >
                  cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* responders manage their own pending hands */}
      {!mine &&
        offers
          ?.filter((offer) => offer.responder.id === user?.id && offer.status === "PENDING")
          .map((offer) => (
            <button
              key={offer.id}
              type="button"
              onClick={() => run(() => withdraw.mutateAsync(offer.id))}
              className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-red-400 hover:text-red-500"
            >
              withdraw my offer
            </button>
          ))}

      {mine && active && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run(() => resolve.mutateAsync(data.id))}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            mark resolved
          </button>
          {["OPEN", "OFFER_RECEIVED"].includes(data.status) && (
            <button
              type="button"
              onClick={() => run(() => cancel.mutateAsync(data.id))}
              className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-red-400 hover:text-red-500"
            >
              cancel request
            </button>
          )}
        </div>
      )}
    </section>
  );
}
