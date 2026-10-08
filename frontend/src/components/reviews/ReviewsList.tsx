import { useReviews } from "../../api/reviews";
import { StarRating } from "./StarRating";

/* every voice on this user, newest first from the server */
export function ReviewsList({ userId }: { userId: string }) {
  const { data, isLoading } = useReviews(userId);

  if (isLoading) {
    return (
      <p role="status" aria-label="loading" className="animate-pulse text-sm lowercase text-taupe">
        loading reviews…
      </p>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
        reviews<span className="text-rosewood">.</span>
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {data.map((review) => (
          <li key={review.id} className="border-t border-sage/60 pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <StarRating value={review.rating} />
              <p className="text-xs lowercase text-taupe">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
            <p className="mt-1 text-sm text-cocoa">{review.comment}</p>
            <p className="mt-1 text-xs lowercase text-taupe">
              by {review.reviewerName.toLowerCase()}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
