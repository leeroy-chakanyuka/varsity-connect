import { useState } from "react";
import { useCreateComment } from "../../api/community";

/* one box under the thread, posts straight into the list */
export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const create = useCreateComment(postId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }
    try {
      setFailed(null);
      await create.mutateAsync(body.trim());
      setBody("");
    } catch {
      setFailed("could not post reply, try again");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {failed && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      <label htmlFor="comment-body" className="sr-only">
        write a reply
      </label>
      <textarea
        id="comment-body"
        rows={2}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="write a reply…"
        className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none"
      />
      <button
        type="submit"
        disabled={create.isPending || !body.trim()}
        className="self-end rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white disabled:opacity-60"
      >
        {create.isPending ? "posting…" : "reply"}
      </button>
    </form>
  );
}
