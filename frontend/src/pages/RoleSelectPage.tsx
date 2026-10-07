import { GraduationCap, ShieldCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";

/* who are you joining as — pure ui intent, the backend owns your real role */
const roles = [
  {
    key: "STUDENT",
    title: "student",
    blurb: "buy, sell, find lost items, get help",
    icon: GraduationCap,
  },
  {
    key: "VENDOR",
    title: "vendor",
    blurb: "list what you sell to campus",
    icon: Store,
  },
  {
    key: "ADMIN",
    title: "university admin",
    blurb: "moderate, login only",
    icon: ShieldCheck,
  },
] as const;

export function RoleSelectPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          join as<span className="text-rosewood">…</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">pick the card that sounds like you</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {roles.map(({ key, title, blurb, icon: Icon }) => (
          <article
            key={key}
            className="flex flex-col items-center gap-2 rounded-2xl border border-sage/70 bg-white p-6 text-center shadow-sm"
          >
            <Icon className="h-8 w-8 text-rosewood" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold lowercase text-cocoa">{title}</h2>
            <p className="min-h-10 text-sm lowercase text-taupe">{blurb}</p>
            <Link
              to="/login"
              state={{ role: key }}
              className="mt-2 w-full rounded-xl bg-cocoa px-4 py-2.5 text-center text-sm lowercase text-white transition hover:opacity-90"
            >
              log in
            </Link>
            {key !== "ADMIN" && (
              <Link
                to="/register"
                state={{ role: key }}
                className="w-full rounded-xl border border-sage px-4 py-2.5 text-center text-sm lowercase text-cocoa transition hover:border-rosewood hover:text-rosewood"
              >
                create account
              </Link>
            )}
          </article>
        ))}
      </div>

      <p className="text-center text-xs lowercase text-taupe">
        admin accounts are created by the university, never through signup
      </p>
    </section>
  );
}
