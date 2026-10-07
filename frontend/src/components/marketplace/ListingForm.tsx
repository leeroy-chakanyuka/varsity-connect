import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CATEGORIES,
  CONDITIONS,
  type Listing,
  type ListingPayload,
} from "../../api/marketplace";
import { ImageUploader } from "../ImageUploader";
import { Field, TextInput } from "../ui/field";

const schema = z.object({
  title: z.string().trim().min(3, "title must be at least 3 characters").max(150, "title is too long"),
  description: z.string().trim().min(1, "description is required").max(4000, "description is too long"),
  price: z.coerce.number({ invalid_type_error: "price is required" }).min(0, "price cannot be negative"),
  category: z.enum(CATEGORIES as [string, ...string[]], { errorMap: () => ({ message: "pick a category" }) }),
  condition: z.enum(CONDITIONS as [string, ...string[]], { errorMap: () => ({ message: "pick a condition" }) }),
  location: z.string().trim().max(200, "location is too long").optional().or(z.literal("")),
  imageUrls: z.array(z.string()).max(5, "at most 5 images allowed").default([]),
});

export type ListingFormValues = z.infer<typeof schema>;

const selectClasses =
  "w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none";

/* shared by create and edit, images ride the uploader */
export function ListingForm({
  initial,
  pending,
  serverError,
  onSubmit,
  submitLabel,
}: {
  initial?: Listing;
  pending: boolean;
  serverError: string | null;
  onSubmit: (payload: ListingPayload) => void;
  submitLabel: string;
}) {
  const { register, handleSubmit, reset, setValue, watch, formState } = useForm<ListingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? (undefined as unknown as number),
      category: initial?.category ?? undefined,
      condition: initial?.condition ?? undefined,
      location: initial?.location ?? "",
      imageUrls: initial?.imageUrls ?? [],
    },
  });
  const { errors } = formState;
  const imageUrls = watch("imageUrls");

  /* edit mode refills once the detail query lands */
  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title,
        description: initial.description,
        price: initial.price,
        category: initial.category,
        condition: initial.condition,
        location: initial.location ?? "",
        imageUrls: initial.imageUrls,
      });
    }
  }, [initial, reset]);

  const submit = (values: ListingFormValues) =>
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      price: values.price,
      category: values.category as ListingPayload["category"],
      condition: values.condition as ListingPayload["condition"],
      location: values.location?.trim() ? values.location.trim() : undefined,
      imageUrls: values.imageUrls,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {serverError}
        </p>
      )}

      <Field label="title" htmlFor="title" error={errors.title?.message}>
        <TextInput id="title" placeholder="calculus textbook" {...register("title")} />
      </Field>

      <Field label="description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          rows={4}
          placeholder="condition, edition, pickup point…"
          {...register("description")}
          className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="price (r)" htmlFor="price" error={errors.price?.message}>
          <TextInput id="price" inputMode="decimal" placeholder="350" {...register("price")} />
        </Field>
        <Field label="location (optional)" htmlFor="location" error={errors.location?.message}>
          <TextInput id="location" placeholder="bellville campus" {...register("location")} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="category" htmlFor="category" error={errors.category?.message}>
          <select id="category" {...register("category")} className={selectClasses}>
            <option value="" disabled>
              pick one
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="condition" htmlFor="condition" error={errors.condition?.message}>
          <select id="condition" {...register("condition")} className={selectClasses}>
            <option value="" disabled>
              pick one
            </option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm lowercase text-cocoa">images (up to 5)</p>
        <ImageUploader
          value={imageUrls}
          onChange={(urls) => setValue("imageUrls", urls, { shouldValidate: true })}
          purpose="LISTING"
          max={5}
        />
        {errors.imageUrls && (
          <p role="alert" className="text-xs lowercase text-red-500">
            {errors.imageUrls.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
