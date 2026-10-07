import { Link } from "react-router-dom";
import { useClearCart, useCart, useRemoveCartItem, useUpdateCartItem } from "../api/cart";
import { formatPrice } from "../api/marketplace";

/* your basket, every total arrived from the server */
export function CartPage() {
  const { data, isLoading, isError, refetch } = useCart();
  const remove = useRemoveCartItem();
  const update = useUpdateCartItem();
  const clear = useClearCart();

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading your cart…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">cart failed to load</p>
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

  if (data.items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-3xl font-semibold lowercase text-cocoa">
          cart is empty<span className="text-rosewood">.</span>
        </p>
        <p className="text-sm lowercase text-taupe">go find something worth keeping</p>
        <Link
          to="/market"
          className="mt-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white"
        >
          browse the market
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          your cart<span className="text-rosewood">.</span>
        </h1>
        <button
          type="button"
          onClick={() => clear.mutate()}
          disabled={clear.isPending}
          className="text-xs lowercase text-taupe hover:text-red-500 disabled:opacity-40"
        >
          clear cart
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {data.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-2xl border border-sage/70 bg-white p-4 shadow-sm"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-milk">
                <p className="text-xs lowercase text-taupe">no image</p>
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                to={`/market/${item.listingId}`}
                className="truncate font-display text-lg font-semibold lowercase text-cocoa hover:text-rosewood"
              >
                {item.title}
              </Link>
              <p className="text-xs lowercase text-taupe">sold by {item.sellerName.toLowerCase()}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`one fewer ${item.title}`}
                    disabled={item.quantity <= 1 || update.isPending}
                    onClick={() => update.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    className="rounded-lg border border-sage px-2 py-0.5 text-sm text-cocoa disabled:opacity-40"
                  >
                    −
                  </button>
                  <p aria-label="quantity" className="min-w-6 text-center text-sm text-cocoa">
                    {item.quantity}
                  </p>
                  <button
                    type="button"
                    aria-label={`one more ${item.title}`}
                    disabled={update.isPending}
                    onClick={() => update.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    className="rounded-lg border border-sage px-2 py-0.5 text-sm text-cocoa disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold text-cocoa">{formatPrice(item.lineTotal)}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={`remove ${item.title}`}
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
              className="self-start text-xs lowercase text-taupe hover:text-red-500 disabled:opacity-40"
            >
              remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-2xl border border-sage/70 bg-white p-5">
        <p className="text-sm lowercase text-taupe">subtotal</p>
        <p className="font-display text-2xl font-semibold text-cocoa">{formatPrice(data.subtotal)}</p>
      </div>

      <Link
        to="/checkout"
        className="rounded-xl bg-cocoa px-4 py-3 text-center text-sm lowercase text-white transition hover:opacity-90"
      >
        checkout
      </Link>
    </section>
  );
}
