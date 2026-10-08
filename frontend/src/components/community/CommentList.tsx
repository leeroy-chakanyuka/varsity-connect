import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { apiMessage } from "../../api/client";
import { useDeleteComment, useUpdateComment, type PostComment } from "../../api/community";

/* flat reply list, oldest first — authors edit, authors and admins remove */
export function CommentList({ comments, postId }: { comments: PostComment[]; postId: string }) {
  if (comments.length === 0) {
    return <p className="text-sm lowercase text-taupe">no replies yet — start it off</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentRow key={comment.id} comment={comment} postId={postId} />
      ))}
    </ul>
  );
}

function CommentRow({ comment, postId }: { comment: PostComment; postId: string }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [failed, setFailed] = useState<string | null>(null);
  const update = useUpdateComment(postId, comment.id);
  const remove = useDeleteComment(postId);

  const mine = !!user && comment.author.id === user.id;
  const mayRemove = mine || user?.role === "ADMIN";

  const save = async () => {
    if (!draft.trim()) {
      return;
    }
    try {
      setFailed(null);
      await update.mutateAsync(draft.trim());
      setEditing(false);
    } catch (error) {
      setFailed(apiMessage(error, "could not save reply, try again"));
    }
  };

  const destroy = async () => {
    try {
      setFailed(null);
      await remove.mutateAsync(comment.id);
    } catch (error) {
      setConfirming(false);
      setFailed(apiMessage(error, "could not remove reply, try again"));
    }
  };

  return (
    <li className="rounded-2xl border border-sage/60 bg-white p-4">
      <p className="text-xs lowercase text-taupe">
        {comment.author.fullName.toLowerCase()} ·{" "}
        {new Date(comment.createdAt).toLocaleDateString()}
      </p>
      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <label htmlFor={`edit-${comment.id}`} className="sr-only">
            edit reply
          </label>
          <textarea
            id={`edit-${comment.id}`}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
          />
          {failed && (
            <p role="alert" className="text-xs lowercase text-red-500">
              {failed}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={update.isPending || !draft.trim()}
              className="rounded-xl bg-cocoa px-3 py-1.5 text-xs lowercase text-white disabled:opacity-60"
            >
              {update.isPending ? "saving…" : "save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(comment.body);
              }}
              className="rounded-xl border border-sage px-3 py-1.5 text-xs lowercase text-cocoa"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 whitespace-pre-line text-sm text-cocoa">{comment.body}</p>
          {failed && (
            <p role="alert" className="mt-1 text-xs lowercase text-red-500">
              {failed}
            </p>
          )}
          {(mine || mayRemove) && (
            <div className="mt-2 flex gap-2">
              {mine && !confirming && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-xs lowercase text-taupe hover:text-rosewood"
                >
                  edit
                </button>
              )}
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={destroy}
                    disabled={remove.isPending}
                    className="rounded-lg bg-red-500 px-2.5 py-1 text-xs lowercase text-white disabled:opacity-60"
                  >
                    {remove.isPending ? "removing…" : "yes, remove"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-lg border border-sage px-2.5 py-1 text-xs lowercase text-cocoa"
                  >
                    keep
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  aria-label={`remove reply by ${comment.author.fullName}`}
                  onClick={() => setConfirming(true)}
                  className="text-xs lowercase text-taupe hover:text-red-500"
                >
                  remove
                </button>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}
