import { Link, useParams } from "react-router-dom";
import { formatPrice } from "../api/marketplace";
import { useOrder } from "../api/orders";

/* what the demo till left behind, with a way back for failures */
export function PaymentResultPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading result…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">order not found</p>
        <Link to="/orders" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
          all orders
        </Link>
      </section>
    );
  }

  const ok = data.status === "PAID";

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-3xl font-semibold lowercase text-cocoa">
        {ok ? (
          <>payment successful<span className="text-rosewood">.</span></>
        ) : (
          <>payment failed<span className="text-rosewood">.</span></>
        )}
      </p>
      <p className="text-sm lowercase text-taupe">
        {ok
          ? `paid ${formatPrice(data.total)}, arrange collection with the seller`
          : "nothing moved, your items are back on the shelf"}
      </p>
      {ok ? (
        <Link to="/orders" className="mt-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white">
          back to orders
        </Link>
      ) : (
        <div className="mt-2 flex gap-2">
          <Link
            to={`/orders/${data.id}`}
            className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white"
          >
            try again
          </Link>
          <Link
            to="/orders"
            className="rounded-xl border border-sage px-4 py-2.5 text-sm lowercase text-cocoa"
          >
            all orders
          </Link>
        </div>
      )}
    </section>
  );
}
