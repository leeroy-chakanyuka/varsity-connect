import { CATEGORIES, CONDITIONS, type ListingCategory, type ListingCondition } from "../../api/marketplace";

const selectClasses =
  "w-full rounded-xl border border-sage bg-white px-3 py-2 text-sm lowercase text-cocoa focus:border-rosewood focus:outline-none";

/* sidebar panel on desktop, stacked above the grid on phones */
export interface FilterValues {
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

export function ListingFilters({
  values,
  onChange,
  onReset,
}: {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  onReset: () => void;
}) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...values, ...patch });

  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-sage/70 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold lowercase text-cocoa">filters</p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs lowercase text-taupe hover:text-rosewood"
        >
          reset
        </button>
      </div>

      <label className="flex flex-col gap-1 text-xs lowercase text-taupe">
        category
        <select
          aria-label="category filter"
          value={values.category}
          onChange={(event) => set({ category: event.target.value })}
          className={selectClasses}
        >
          <option value="">all</option>
          {CATEGORIES.map((category: ListingCategory) => (
            <option key={category} value={category}>
              {category.toLowerCase().replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs lowercase text-taupe">
        condition
        <select
          aria-label="condition filter"
          value={values.condition}
          onChange={(event) => set({ condition: event.target.value })}
          className={selectClasses}
        >
          <option value="">all</option>
          {CONDITIONS.map((condition: ListingCondition) => (
            <option key={condition} value={condition}>
              {condition.toLowerCase().replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs lowercase text-taupe">
          min price
          <input
            aria-label="minimum price"
            inputMode="decimal"
            placeholder="0"
            value={values.minPrice}
            onChange={(event) => set({ minPrice: event.target.value })}
            className={selectClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs lowercase text-taupe">
          max price
          <input
            aria-label="maximum price"
            inputMode="decimal"
            placeholder="5000"
            value={values.maxPrice}
            onChange={(event) => set({ maxPrice: event.target.value })}
            className={selectClasses}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs lowercase text-taupe">
        sort
        <select
          aria-label="sort listings"
          value={values.sort}
          onChange={(event) => set({ sort: event.target.value })}
          className={selectClasses}
        >
          <option value="createdAt,desc">newest</option>
          <option value="price,asc">price low to high</option>
          <option value="price,desc">price high to low</option>
        </select>
      </label>
    </aside>
  );
}
