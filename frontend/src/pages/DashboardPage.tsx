import { Link } from "react-router-dom";
import { useDashboard } from "../api/dashboard";
import { ProfileView } from "./profile-view";
import { ListingGrid } from "../components/marketplace/ListingGrid";
import { PostCard } from "../components/community/PostCard";

/* real home now, every section reads live module state */
export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-12" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading your campus…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">dashboard failed to load</p>
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

  const stats = [
    { label: "active listings", value: data.activeListingCount, to: "/market" },
    { label: "open lost reports", value: data.openLostReportCount, to: "/lost-found" },
    { label: "open help requests", value: data.openSupportRequestCount, to: "/survival" },
    { label: "unread notifications", value: data.unreadNotifications, to: "/notifications" },
  ];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          hi, {data.user.fullName.split(" ")[0]?.toLowerCase()}
          <span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">here is campus today</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-2xl border border-sage/70 bg-white p-4 shadow-sm transition hover:border-rosewood"
          >
            <p className="font-display text-2xl font-semibold text-cocoa">{stat.value}</p>
            <p className="mt-0.5 text-xs lowercase text-taupe">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileView profile={data.user} />
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/profile"
            className="rounded-xl bg-cocoa px-4 py-3 text-center text-sm lowercase text-white transition hover:opacity-90"
          >
            view my profile
          </Link>
          <Link
            to="/market"
            className="rounded-xl border border-sage bg-white px-4 py-3 text-center text-sm lowercase text-cocoa transition hover:border-rosewood"
          >
            browse the market
          </Link>
          <Link
            to="/market/new"
            className="rounded-xl border border-sage bg-white px-4 py-3 text-center text-sm lowercase text-cocoa transition hover:border-rosewood"
          >
            sell something
          </Link>
        </div>
      </div>

      {data.myMatches.length > 0 && (
        <section aria-label="your lost and found matches">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
              possible matches<span className="text-rosewood">.</span>
            </h2>
            <Link to="/lost-found" className="text-sm lowercase text-taupe hover:text-rosewood">
              all reports
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {data.myMatches.map((match) => (
              <li key={match.id}>
                <Link
                  to={`/lost-found/${match.reportId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-sage/70 bg-white p-4 shadow-sm transition hover:border-rosewood"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm lowercase text-cocoa">{match.otherItemName}</p>
                    <p className="text-xs lowercase text-taupe">{match.otherLocation}</p>
                  </div>
                  <p className="shrink-0 rounded-full bg-blush/40 px-2.5 py-0.5 text-xs font-semibold text-cocoa">
                    {match.score}%
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="fresh on the market">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
            fresh on the market<span className="text-rosewood">.</span>
          </h2>
          <Link to="/market" className="text-sm lowercase text-taupe hover:text-rosewood">
            see all
          </Link>
        </div>
        <div className="mt-3">
          {data.latestListings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sage bg-white px-6 py-8 text-center text-sm lowercase text-taupe">
              nothing on the shelf yet
            </p>
          ) : (
            <ListingGrid listings={data.latestListings} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-label="latest threads">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
              campus talking<span className="text-rosewood">.</span>
            </h2>
            <Link to="/community" className="text-sm lowercase text-taupe hover:text-rosewood">
              join in
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {data.latestPosts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-sage bg-white px-6 py-8 text-center text-sm lowercase text-taupe">
                no threads yet
              </p>
            ) : (
              data.latestPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </section>

        <section aria-label="open help requests">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
              neighbours need a hand<span className="text-rosewood">.</span>
            </h2>
            <Link to="/survival" className="text-sm lowercase text-taupe hover:text-rosewood">
              survival board
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {data.openSupportRequests.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-sage bg-white px-6 py-8 text-center text-sm lowercase text-taupe">
                everyone is sorted for now
              </p>
            ) : (
              data.openSupportRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/survival/${request.id}`}
                  className="rounded-2xl border border-sage/70 bg-white p-4 shadow-sm transition hover:border-rosewood"
                >
                  <p className="text-sm lowercase text-cocoa">{request.title}</p>
                  <p className="mt-0.5 text-xs lowercase text-taupe">
                    {request.type.toLowerCase()} · {request.urgency.toLowerCase()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
