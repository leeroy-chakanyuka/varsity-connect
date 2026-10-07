import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/* real data from /auth/me, real modules arrive with their stages */
export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          hi, {user.fullName.split(" ")[0]?.toLowerCase()}
          <span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">your campus home is taking shape</p>
      </div>

      <article className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
        <p className="text-xs lowercase tracking-wider text-taupe">profile summary</p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="lowercase text-taupe">name</dt>
            <dd className="lowercase text-cocoa">{user.fullName}</dd>
          </div>
          <div>
            <dt className="lowercase text-taupe">email</dt>
            <dd className="text-cocoa">{user.email}</dd>
          </div>
          <div>
            <dt className="lowercase text-taupe">role</dt>
            <dd className="lowercase text-cocoa">{user.role.toLowerCase()}</dd>
          </div>
          {user.studentNumber && (
            <div>
              <dt className="lowercase text-taupe">student number</dt>
              <dd className="text-cocoa">{user.studentNumber}</dd>
            </div>
          )}
          {user.faculty && (
            <div>
              <dt className="lowercase text-taupe">faculty</dt>
              <dd className="lowercase text-cocoa">{user.faculty}</dd>
            </div>
          )}
        </dl>
      </article>

      <p className="rounded-full border border-sage bg-white px-4 py-2 text-center text-xs lowercase text-taupe">
        marketplace, lost &amp; found, and community plug in here next
      </p>

      <Link
        to="/profile"
        className="rounded-xl border border-sage bg-white px-4 py-3 text-center text-sm lowercase text-cocoa transition hover:border-rosewood hover:text-rosewood"
      >
        view my profile
      </Link>
      <Link
        to="/market"
        className="rounded-xl bg-cocoa px-4 py-3 text-center text-sm lowercase text-white transition hover:opacity-90"
      >
        browse the market
      </Link>
    </section>
  );
}
