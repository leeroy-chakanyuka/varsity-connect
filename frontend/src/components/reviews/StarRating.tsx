/* five stars, buttons when interactive and plain text when not */
export function StarRating({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange?: (next: number) => void;
  max?: number;
}) {
  if (!onChange) {
    return (
      <p aria-label={`rated ${value} out of ${max}`} className="text-sm font-semibold text-cocoa">
        {"★".repeat(Math.max(0, Math.min(max, Math.round(value))))}
        <span className="font-normal text-taupe">
          {"☆".repeat(Math.max(0, max - Math.round(value)))}
        </span>
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="choose a rating" className="flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const lit = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`rate ${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange(star)}
            className={`rounded-lg px-1.5 py-1 text-2xl leading-none transition ${
              lit ? "text-rosewood" : "text-sage hover:text-rosewood"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
