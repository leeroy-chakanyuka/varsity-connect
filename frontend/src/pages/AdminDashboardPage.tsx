import { useState } from "react";
import { apiMessage } from "../api/client";
import {
  useAdminListings,
  useAdminPosts,
  useAdminSupport,
  useAdminUsers,
  useArchiveAdminListing,
  useDeleteAdminPost,
  useSetUserEnabled,
} from "../api/admin";

/* the moderation desk, four quiet sections with confirm steps */
export function AdminDashboardPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          moderation desk<span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">users, shelf, threads, and help requests</p>
      </div>

      <UsersSection />
      <ListingsSection />
      <PostsSection />
      <SupportSection />
    </section>
  );
}

function UsersSection() {
  const { data, isLoading } = useAdminUsers();
  const toggle = useSetUserEnabled();
  const [failed, setFailed] = useState<string | null>(null);

  const flip = async (id: string, enabled: boolean) => {
    try {
      setFailed(null);
      await toggle.mutateAsync({ id, enabled });
    } catch (error) {
      setFailed(apiMessage(error, "could not change account state"));
    }
  };

  return (
    <article aria-label="user management" className="rounded-2xl border border-sage/70 bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">users</h2>
      {failed && (
        <p role="alert" className="mt-2 text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      {isLoading ? (
        <p className="mt-2 animate-pulse text-sm lowercase text-taupe">loading users…</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {(data?.content ?? []).map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate lowercase text-cocoa">{user.fullName}</p>
                <p className="truncate text-xs text-taupe">
                  {user.email} · {user.role.toLowerCase()} · {user.enabled ? "enabled" : "disabled"}
                </p>
              </div>
              <button
                type="button"
                disabled={toggle.isPending}
                onClick={() => flip(user.id, !user.enabled)}
                aria-label={`${user.enabled ? "disable" : "enable"} ${user.fullName}`}
                className="shrink-0 rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa transition hover:border-rosewood hover:text-rosewood disabled:opacity-60"
              >
                {user.enabled ? "disable" : "enable"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ListingsSection() {
  const { data, isLoading } = useAdminListings();
  const archive = useArchiveAdminListing();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      setFailed(null);
      await archive.mutateAsync(id);
      setConfirming(null);
    } catch (error) {
      setFailed(apiMessage(error, "could not archive listing"));
    }
  };

  return (
    <article aria-label="listing moderation" className="rounded-2xl border border-sage/70 bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">shelf</h2>
      {failed && (
        <p role="alert" className="mt-2 text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      {isLoading ? (
        <p className="mt-2 animate-pulse text-sm lowercase text-taupe">loading listings…</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {(data?.content ?? []).map((listing) => (
            <li key={listing.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate lowercase text-cocoa">{listing.title}</p>
                <p className="text-xs lowercase text-taupe">
                  {listing.seller.fullName.toLowerCase()} · {listing.status.toLowerCase()}
                </p>
              </div>
              {confirming === listing.id ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={archive.isPending}
                    onClick={() => remove(listing.id)}
                    className="rounded-xl bg-red-500 px-3 py-1.5 text-xs lowercase text-white disabled:opacity-60"
                  >
                    yes, archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa"
                  >
                    keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`archive ${listing.title}`}
                  onClick={() => setConfirming(listing.id)}
                  className="shrink-0 rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa transition hover:border-red-400 hover:text-red-500"
                >
                  archive
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PostsSection() {
  const { data, isLoading } = useAdminPosts();
  const removePost = useDeleteAdminPost();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      setFailed(null);
      await removePost.mutateAsync(id);
      setConfirming(null);
    } catch (error) {
      setFailed(apiMessage(error, "could not remove thread"));
    }
  };

  return (
    <article aria-label="community moderation" className="rounded-2xl border border-sage/70 bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">threads</h2>
      {failed && (
        <p role="alert" className="mt-2 text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      {isLoading ? (
        <p className="mt-2 animate-pulse text-sm lowercase text-taupe">loading threads…</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {(data?.content ?? []).map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate lowercase text-cocoa">{post.title}</p>
                <p className="text-xs lowercase text-taupe">{post.author.fullName.toLowerCase()}</p>
              </div>
              {confirming === post.id ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={removePost.isPending}
                    onClick={() => remove(post.id)}
                    className="rounded-xl bg-red-500 px-3 py-1.5 text-xs lowercase text-white disabled:opacity-60"
                  >
                    yes, remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa"
                  >
                    keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`remove ${post.title}`}
                  onClick={() => setConfirming(post.id)}
                  className="shrink-0 rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa transition hover:border-red-400 hover:text-red-500"
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function SupportSection() {
  const { data, isLoading } = useAdminSupport();

  return (
    <article aria-label="support oversight" className="rounded-2xl border border-sage/70 bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">help requests</h2>
      {isLoading ? (
        <p className="mt-2 animate-pulse text-sm lowercase text-taupe">loading requests…</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {(data?.content ?? []).map((request) => (
            <li key={request.id} className="text-sm">
              <p className="lowercase text-cocoa">{request.title}</p>
              <p className="text-xs lowercase text-taupe">
                {request.requester.fullName.toLowerCase()} · {request.status.toLowerCase()} ·{" "}
                {request.type.toLowerCase()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
