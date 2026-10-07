import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

/* search box, quiet for 300ms before telling the parent */
export function ListingSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft);

  /* parent url is the truth, typing only drafts until the pause */
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-sage bg-white px-4 py-2.5 focus-within:border-rosewood focus-within:ring-2 focus-within:ring-blush/50 transition">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4 shrink-0 text-taupe"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        aria-label="search listings"
        placeholder="search textbooks, laptops…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm lowercase text-cocoa placeholder:text-taupe/60 focus:outline-none"
      />
    </div>
  );
}
