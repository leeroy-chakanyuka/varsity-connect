import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { apiMessage } from "../api/client";
import { SUPPORT_TYPES, URGENCIES, useCreateSupportRequest, type SupportRequestPayload } from "../api/support";
import { Field, TextInput } from "../components/ui/field";

const schema = z.object({
  type: z.string().min(1, "pick a type"),
  title: z.string().trim().min(1, "title is required").max(150, "title is too long"),
  description: z.string().trim().min(1, "description is required").max(2000, "description is too long"),
  location: z.string().trim().min(1, "location is required").max(200, "location is too long"),
  urgency: z.string().min(1, "pick an urgency"),
});

type Form = z.infer<typeof schema>;

const selectClasses =
  "w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa focus:border-rosewood focus:outline-none";

/* ask campus for help */
export function CreateSupportRequestPage() {
  const navigate = useNavigate();
  const create = useCreateSupportRequest();
  const [failed, setFailed] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { type: "", title: "", description: "", location: "", urgency: "" },
  });
  const { errors } = formState;

  const onSubmit = async (values: Form) => {
    try {
      const request = await create.mutateAsync(values as SupportRequestPayload);
      navigate(`/survival/${request.id}`);
    } catch (error) {
      setFailed(apiMessage(error, "could not create request, try again"));
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/survival" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to survival mode
      </Link>
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        request help<span className="text-rosewood">.</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-2xl border border-sage/70 bg-white p-6 shadow-sm" noValidate>
        {failed && (
          <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
            {failed}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="type" htmlFor="type" error={errors.type?.message}>
            <select id="type" {...register("type")} className={selectClasses}>
              <option value="">pick one</option>
              {SUPPORT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="urgency" htmlFor="urgency" error={errors.urgency?.message}>
            <select id="urgency" {...register("urgency")} className={selectClasses}>
              <option value="">pick one</option>
              {URGENCIES.map((option) => (
                <option key={option} value={option}>
                  {option.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="title" htmlFor="title" error={errors.title?.message}>
          <TextInput id="title" placeholder="need dinner tonight" {...register("title")} />
        </Field>

        <Field label="description" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={3}
            placeholder="what happened, what would help…"
            {...register("description")}
            className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
          />
        </Field>

        <Field label="location" htmlFor="location" error={errors.location?.message}>
          <TextInput id="location" placeholder="res block c" {...register("location")} />
        </Field>

        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {create.isPending ? "sending…" : "send request"}
        </button>
      </form>
    </section>
  );
}
