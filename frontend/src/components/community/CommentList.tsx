import type { PostComment } from "../../api/community";

/* flat reply list, oldest first */
export function CommentList({ comments }: { comments: PostComment[] }) {
  if (comments.length === 0) {
    return <p className="text-sm lowercase text-taupe">no replies yet — start it off</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-2xl border border-sage/60 bg-white p-4">
          <p className="text-xs lowercase text-taupe">
            {comment.author.fullName.toLowerCase()} ·{" "}
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-cocoa">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
