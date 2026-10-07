import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CATEGORIES, type Report, type ReportPayload, type ReportType } from "../../api/lostfound";
import { ImageUploader } from "../ImageUploader";
import { Field, TextInput } from "../ui/field";

const schema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  itemName: z.string().trim().min(1, "item name is required").max(150, "item name is too long"),
  category: z.string().min(1, "pick a category"),
  description: z.string().trim().min(1, "description is required").max(2000, "description is too long"),
  location: z.string().trim().min(1, "location is required").max(200, "location is too long"),
  incidentDate: z.string().min(1, "incident date is required"),
  imageUrl: z.string().optional().or(z.literal("")),
});

export type ReportFormValues = z.infer<typeof schema>;

const selectClasses =
  "w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none";

/* shared by report and edit, one photo at most */
export function ReportForm({
  initial,
  fixedType,
  pending,
  serverError,
  onSubmit,
  submitLabel,
}: {
  initial?: Report;
  fixedType?: ReportType;
  pending: boolean;
  serverError: string | null;
  onSubmit: (payload: ReportPayload) => void;
  submitLabel: string;
}) {
  const { register, handleSubmit, reset, setValue, watch, formState } = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initial?.type ?? fixedType ?? "LOST",
      itemName: initial?.itemName ?? "",
      category: initial?.category ?? "",
      description: initial?.description ?? "",
      location: initial?.location ?? "",
      incidentDate: initial?.incidentDate ?? "",
      imageUrl: initial?.imageUrl ?? "",
    },
  });
  const { errors } = formState;
  const imageUrl = watch("imageUrl");
  const type = watch("type");

  useEffect(() => {
    if (initial) {
      reset({
        type: initial.type,
        itemName: initial.itemName,
        category: initial.category,
        description: initial.description,
        location: initial.location,
        incidentDate: initial.incidentDate,
        imageUrl: initial.imageUrl ?? "",
      });
    }
  }, [initial, reset]);

  const submit = (values: ReportFormValues) =>
    onSubmit({
      type: values.type as ReportType,
      itemName: values.itemName.trim(),
      category: values.category as ReportPayload["category"],
      description: values.description.trim(),
      location: values.location.trim(),
      incidentDate: values.incidentDate,
      imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {serverError}
        </p>
      )}

      {!initial && !fixedType && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-sage/70 bg-white p-1.5" role="radiogroup" aria-label="report type">
          {(["LOST", "FOUND"] as const).map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-xl px-4 py-2 text-center text-sm lowercase transition ${
                type === option ? "bg-cocoa text-white" : "text-taupe hover:text-cocoa"
              }`}
            >
              <input type="radio" value={option} {...register("type")} className="sr-only" />
              {option === "LOST" ? "i lost it" : "i found it"}
            </label>
          ))}
        </div>
      )}

      <Field label="item name" htmlFor="itemName" error={errors.itemName?.message}>
        <TextInput id="itemName" placeholder="black wallet" {...register("itemName")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="category" htmlFor="category" error={errors.category?.message}>
          <select id="category" {...register("category")} className={selectClasses}>
            <option value="">pick one</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="incident date" htmlFor="incidentDate" error={errors.incidentDate?.message}>
          <TextInput id="incidentDate" type="date" {...register("incidentDate")} />
        </Field>
      </div>

      <Field label="description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          placeholder="what does it look like, where exactly…"
          {...register("description")}
          className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
        />
      </Field>

      <Field label="location" htmlFor="location" error={errors.location?.message}>
        <TextInput id="location" placeholder="library steps" {...register("location")} />
      </Field>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm lowercase text-cocoa">photo (optional)</p>
        <ImageUploader
          value={imageUrl ? [imageUrl] : []}
          onChange={(urls) => setValue("imageUrl", urls[0] ?? "", { shouldValidate: true })}
          purpose="LOST_FOUND"
          max={1}
        />
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
