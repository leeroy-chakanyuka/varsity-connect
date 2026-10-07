import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../api/cart";

/* minimal shell like stardust nav, lowercase + warm neutrals */
export function Shell() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  /* badge only for sessions, no token means no basket query */
  const { data: cart } = useCart();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-svh flex-col">
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-8 border-b border-sage/60 bg-white/95 px-6 py-4 backdrop-blur sm:px-8">
        <Link
          to="/"
          aria-label="varsity connect home"
          className="font-display text-2xl font-semibold lowercase tracking-tight text-cocoa select-none"
        >
          varsity connect<span className="text-rosewood">.</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/market"
            className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
          >
            market
          </Link>
          <Link
            to="/lost-found"
            className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
          >
            lost &amp; found
          </Link>
          {ready && user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
              >
                {user.fullName.split(" ")[0]?.toLowerCase()}
              </Link>
              <Link
                to="/orders"
                className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
              >
                orders
              </Link>
              <Link
                to="/cart"
                aria-label={`cart, ${cart?.itemCount ?? 0} items`}
                className="relative rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa transition hover:border-rosewood hover:text-rosewood"
              >
                cart
                {(cart?.itemCount ?? 0) > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rosewood px-1 text-[11px] font-semibold text-white">
                    {cart?.itemCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-sage px-3 py-1.5 text-sm lowercase text-cocoa transition hover:border-rosewood hover:text-rosewood"
              >
                log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
            >
              log in
            </Link>
          )}
        </div>
      </nav>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
