import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { formatPrice } from "../api/marketplace";
import { useOrder } from "../api/orders";
import { apiMessage } from "../api/client";
import { usePayOrder } from "../api/payments";

/* one receipt, frozen rows plus what happens next */
export function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useOrder(id);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading order…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">order not found</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
          <Link to="/orders" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
            all orders
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <Link to="/orders" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← all orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          order<span className="text-rosewood">.</span>
        </h1>
        <p className="rounded-full bg-blush/40 px-3 py-1 text-xs lowercase text-cocoa">
          {data.status.toLowerCase().replace(/_/g, " ")}
        </p>
      </div>

      <article className="rounded-2xl border border-sage/70 bg-white p-5">
        <ul className="flex flex-col gap-2">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="lowercase text-cocoa">
                  {item.title} <span className="text-taupe">× {item.quantity}</span>
                </p>
                <p className="text-xs lowercase text-taupe">sold by {item.sellerName.toLowerCase()}</p>
              </div>
              <p className="font-semibold text-cocoa">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-sage/60 pt-3">
          <p className="text-sm lowercase text-taupe">total</p>
          <p className="font-display text-xl font-semibold text-cocoa">{formatPrice(data.total)}</p>
        </div>
      </article>

      <article className="rounded-2xl border border-sage/70 bg-white p-5 text-sm">
        <p className="lowercase text-taupe">
          collect: <span className="text-cocoa">{data.deliveryMethod.toLowerCase().replace(/_/g, " ")}</span>
        </p>
        <p className="mt-1 lowercase text-taupe">
          paying: <span className="text-cocoa">{data.paymentMethod.toLowerCase().replace(/_/g, " ")}</span>
        </p>
        {(data.status === "PENDING_PAYMENT" || data.status === "PAYMENT_FAILED") && (
          <DemoPaymentForm orderId={data.id} failedBefore={data.status === "PAYMENT_FAILED"} />
        )}
        {data.status === "PAID" && (
          <p className="mt-3 rounded-xl bg-milk px-3 py-2 text-xs lowercase text-taupe">
            paid — arrange collection with the seller
          </p>
        )}
      </article>
    </section>
  );
}

/* demo till, loudly not a real gateway — no card fields anywhere near it */
function DemoPaymentForm({ orderId, failedBefore }: { orderId: string; failedBefore: boolean }) {
  const navigate = useNavigate();
  const pay = usePayOrder(orderId);
  const [failed, setFailed] = useState<string | null>(null);

  const attempt = async (simulate: "SUCCESS" | "FAILURE") => {
    try {
      setFailed(null);
      await pay.mutateAsync(simulate);
      navigate(`/orders/${orderId}/result`);
    } catch (error) {
      setFailed(apiMessage(error, "payment call failed, try again"));
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl bg-milk p-4">
      <p className="text-xs lowercase tracking-wider text-taupe">
        demo payment — no real money, no card details
      </p>
      {failedBefore && (
        <p className="text-xs lowercase text-red-500">last attempt failed, your items are back on the shelf</p>
      )}
      {failed && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pay.isPending}
          onClick={() => attempt("SUCCESS")}
          className="flex-1 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pay.isPending ? "processing…" : "pay now (simulate success)"}
        </button>
        <button
          type="button"
          disabled={pay.isPending}
          onClick={() => attempt("FAILURE")}
          className="flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm lowercase text-cocoa transition hover:border-red-400 hover:text-red-500 disabled:opacity-60"
        >
          simulate failure
        </button>
      </div>
    </div>
  );
}
