import { useState } from "react";
import { apiMessage } from "../../api/client";
import { usePostReview } from "../../api/reviews";
import { StarRating } from "./StarRating";

/* one voice per seller per order, the server guards every rule */
export function ReviewForm({
  orderId,
  revieweeId,
  revieweeName,
}: {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [posted, setPosted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const post = usePostReview(revieweeId);

  if (posted) {
    return (
      <p role="status" className="rounded-xl border border-sage bg-milk px-4 py-2.5 text-sm lowercase text-cocoa">
        review posted, thank you
      </p>
    );
  }

  const submit = async () => {
    try {
      setFailed(null);
      await post.mutateAsync({ orderId, rating, comment: comment.trim() });
      setPosted(true);
    } catch (error) {
      setFailed(apiMessage(error, "review failed, try again"));
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-milk p-4">
      <p className="text-xs lowercase tracking-wider text-taupe">
        rate {revieweeName.toLowerCase()}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <label htmlFor={`comment-${orderId}-${revieweeId}`} className="sr-only">
        review comment
      </label>
      <textarea
        id={`comment-${orderId}-${revieweeId}`}
        rows={2}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="how did it go…"
        className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
      />
      {failed && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {failed}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={post.isPending || rating < 1 || !comment.trim()}
        className="rounded-xl bg-cocoa px-4 py-2.5 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {post.isPending ? "posting…" : "post review"}
      </button>
    </div>
  );
}
