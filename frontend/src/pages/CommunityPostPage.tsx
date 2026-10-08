import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useComments, useDeletePost, usePost, useUpdatePost } from "../api/community";
import { CommentForm } from "../components/community/CommentForm";
import { CommentList } from "../components/community/CommentList";

/* full thread with flat replies, owner and admin hold the broom */
export function CommunityPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = usePost(id);
  const { data: comments } = useComments(id);
  const remove = useDeletePost();
  const update = useUpdatePost(id ?? "");
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const canModerate =
    !!user && !!data && (data.author.id === user.id || user.role === "ADMIN");
  const canEdit = !!user && !!data && data.author.id === user.id;

  const onDelete = async () => {
    if (!id) return;
    try {
      await remove.mutateAsync(id);
      navigate("/community");
    } catch (error) {
      setConfirming(false);
      setFailed(apiMessage(error, "could not remove thread, try again"));
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-8" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading thread…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">thread not found</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
          >
            retry
          </button>
          <Link to="/community" className="rounded-xl border border-sage px-4 py-2 text-sm lowercase text-cocoa">
            all threads
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <Link to="/community" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← all threads
      </Link>

      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <article className="rounded-2xl border border-sage/70 bg-white p-6">
        <p className="text-xs lowercase text-taupe">
          {data.author.fullName.toLowerCase()} · {new Date(data.createdAt).toLocaleDateString()}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          {data.title}
        </h1>
        {data.imageUrl && (
          <img src={data.imageUrl} alt={data.title} className="mt-4 aspect-video w-full rounded-xl object-cover" />
        )}
        <p className="mt-3 whitespace-pre-line text-sm text-cocoa">{data.body}</p>

        {canModerate && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => {
                  setDraftTitle(data.title);
                  setDraftBody(data.body);
                  setEditing(true);
                }}
                className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-rosewood hover:text-rosewood"
              >
                edit thread
              </button>
            )}
            {confirming ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={remove.isPending}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm lowercase text-white disabled:opacity-60"
                >
                  {remove.isPending ? "removing…" : "yes, remove it"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa"
                >
                  keep it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa hover:border-red-400 hover:text-red-500"
              >
                {user?.id === data.author.id ? "delete thread" : "remove thread (admin)"}
              </button>
            )}
          </div>
        )}
      </article>

      {canEdit && editing && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setFailed(null);
              await update.mutateAsync({ title: draftTitle.trim(), body: draftBody.trim() });
              setEditing(false);
            } catch (error) {
              setFailed(apiMessage(error, "could not save thread, try again"));
            }
          }}
          className="flex flex-col gap-3 rounded-2xl border border-sage/70 bg-white p-5"
        >
          <label className="flex flex-col gap-1 text-sm lowercase text-cocoa">
            title
            <input
              aria-label="edit title"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm lowercase text-cocoa">
            body
            <textarea
              aria-label="edit body"
              rows={4}
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={update.isPending}
              className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white disabled:opacity-60"
            >
              {update.isPending ? "saving…" : "save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa"
            >
              cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
          replies<span className="text-rosewood">.</span>
        </h2>
        <CommentForm postId={data.id} />
        <CommentList comments={comments ?? []} postId={data.id} />
      </div>
    </section>
  );
}
