import { Link } from "react-router-dom";
import { formatPrice } from "../api/marketplace";
import { useOrders } from "../api/orders";

/* your receipts, newest first */
export function OrdersPage() {
  const { data, isLoading, isError, refetch } = useOrders();

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading your orders…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">orders failed to load</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
        >
          retry
        </button>
      </section>
    );
  }

  if (data.content.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-3xl font-semibold lowercase text-cocoa">
          no orders yet<span className="text-rosewood">.</span>
        </p>
        <Link to="/market" className="mt-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white">
          browse the market
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        your orders<span className="text-rosewood">.</span>
      </h1>
      <ul className="flex flex-col gap-3">
        {data.content.map((order) => (
          <li key={order.id}>
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-sage/70 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div>
                <p className="text-sm lowercase text-cocoa">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                  {order.items[0]?.title}
                  {order.items.length > 1 ? "…" : ""}
                </p>
                <p className="mt-0.5 text-xs lowercase text-taupe">
                  {order.status.toLowerCase().replace(/_/g, " ")} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="font-semibold text-cocoa">{formatPrice(order.total)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
