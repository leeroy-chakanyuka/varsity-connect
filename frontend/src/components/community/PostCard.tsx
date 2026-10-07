import { Link } from "react-router-dom";
import type { Post } from "../../api/community";

/* one thread in the feed, avatar is initials until photos land */
export function PostCard({ post }: { post: Post }) {
  const initials = post.author.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to={`/community/${post.id}`}
      className="flex gap-3 rounded-2xl border border-sage/70 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush/50 font-display text-sm font-semibold lowercase text-cocoa"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs lowercase text-taupe">
          {post.author.fullName.toLowerCase()} · {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <p className="mt-0.5 font-display text-lg font-semibold lowercase leading-snug text-cocoa">
          {post.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-cocoa/80">{post.body}</p>
        <p className="mt-2 text-xs lowercase text-taupe">
          {post.commentCount} {post.commentCount === 1 ? "reply" : "replies"}
        </p>
      </div>
    </Link>
  );
}
