import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/* minimal shell like stardust nav, lowercase + warm neutrals */
export function Shell() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

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
          {ready && user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm lowercase tracking-wide text-taupe transition-colors hover:text-rosewood"
              >
                {user.fullName.split(" ")[0]?.toLowerCase()}
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
