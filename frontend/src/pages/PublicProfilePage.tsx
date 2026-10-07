import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchProfile, profileKeys } from "../api/profile";
import { ProfileView } from "./profile-view";

/* anyone logged in can read anyone's card, contact included */
export function PublicProfilePage() {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: profileKeys.byId(id ?? ""),
    queryFn: () => fetchProfile(id ?? ""),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-12" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading profile…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">user not found</p>
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

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <Link to="/dashboard" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to dashboard
      </Link>
      <ProfileView profile={data} />
    </section>
  );
}
