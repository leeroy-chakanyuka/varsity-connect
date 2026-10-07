import { Link, Outlet } from "react-router-dom";

/* minimal shell like stardust nav, lowercase + warm neutrals */
export function Shell() {
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
        <p className="hidden text-sm lowercase tracking-wide text-taupe sm:block">
          buy, find, survive campus
        </p>
      </nav>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
