import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiCode, apiMessage } from "../api/client";
import { useCart } from "../api/cart";
import { formatPrice } from "../api/marketplace";
import { useCheckout, type DeliveryMethod, type PaymentMethod } from "../api/orders";

/* turn the basket into an order, prices refreeze server-side */
export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError } = useCart();
  const [delivery, setDelivery] = useState<DeliveryMethod>("CAMPUS_COLLECTION");
  const [payment, setPayment] = useState<PaymentMethod>("MOCK_CARD");
  const [failed, setFailed] = useState<string | null>(null);
  const order = useCheckout();

  const submit = async () => {
    try {
      setFailed(null);
      const created = await order.mutateAsync({ deliveryMethod: delivery, paymentMethod: payment });
      navigate(`/orders/${created.id}`);
    } catch (error) {
      setFailed(
        apiCode(error) === "CART_EMPTY"
          ? "your cart is empty"
          : apiCode(error) === "LISTING_NOT_AVAILABLE"
            ? "something in your cart just sold, review it and try again"
            : apiMessage(error, "checkout failed, try again"),
      );
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading checkout…</p>
      </section>
    );
  }

  if (isError || !cart) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">checkout failed to load</p>
        <Link to="/cart" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
          back to cart
        </Link>
      </section>
    );
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-3xl font-semibold lowercase text-cocoa">
          nothing to check out<span className="text-rosewood">.</span>
        </p>
        <p className="text-sm lowercase text-taupe">your cart is empty</p>
        <Link to="/market" className="mt-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white">
          browse the market
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/cart" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to cart
      </Link>
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        checkout<span className="text-rosewood">.</span>
      </h1>

      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <article className="rounded-2xl border border-sage/70 bg-white p-5">
        <p className="text-xs lowercase tracking-wider text-taupe">order summary</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <p className="lowercase text-cocoa">
                {item.title} <span className="text-taupe">× {item.quantity}</span>
              </p>
              <p className="font-semibold text-cocoa">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-sage/60 pt-3">
          <p className="text-sm lowercase text-taupe">total</p>
          <p className="font-display text-xl font-semibold text-cocoa">{formatPrice(cart.subtotal)}</p>
        </div>
      </article>

      <fieldset className="rounded-2xl border border-sage/70 bg-white p-5">
        <legend className="px-1 text-xs lowercase tracking-wider text-taupe">how do you collect</legend>
        <div className="flex flex-col gap-2">
          {(
            [
              ["CAMPUS_COLLECTION", "campus collection"],
              ["SELLER_ARRANGEMENT", "arrange with seller"],
            ] as [DeliveryMethod, string][]
          ).map(([option, label]) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-sm lowercase text-cocoa">
              <input
                type="radio"
                name="delivery"
                checked={delivery === option}
                onChange={() => setDelivery(option)}
                className="accent-[#E8A0B4]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-sage/70 bg-white p-5">
        <legend className="px-1 text-xs lowercase tracking-wider text-taupe">how do you pay</legend>
        <div className="flex flex-col gap-2">
          {(
            [
              ["MOCK_CARD", "card (demo, no real money moves)"],
              ["CASH_ON_COLLECTION", "cash on collection"],
            ] as [PaymentMethod, string][]
          ).map(([option, label]) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-sm lowercase text-cocoa">
              <input
                type="radio"
                name="payment"
                checked={payment === option}
                onChange={() => setPayment(option)}
                className="accent-[#E8A0B4]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={submit}
        disabled={order.isPending}
        className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {order.isPending ? "placing order…" : `place order · ${formatPrice(cart.subtotal)}`}
      </button>
    </section>
  );
}
