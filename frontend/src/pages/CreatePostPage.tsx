import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { apiMessage } from "../api/client";
import { useCreatePost } from "../api/community";
import { ImageUploader } from "../components/ImageUploader";
import { Field, TextInput } from "../components/ui/field";

const schema = z.object({
  title: z.string().trim().min(1, "title is required").max(150, "title is too long"),
  body: z.string().trim().min(1, "say something first").max(5000, "thread is too long"),
  imageUrl: z.string().optional().or(z.literal("")),
});

type Form = z.infer<typeof schema>;

/* new thread, photo optional */
export function CreatePostPage() {
  const navigate = useNavigate();
  const create = useCreatePost();
  const [failed, setFailed] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", imageUrl: "" },
  });
  const { errors } = formState;
  const imageUrl = watch("imageUrl");

  const onSubmit = async (values: Form) => {
    try {
      const post = await create.mutateAsync({
        title: values.title.trim(),
        body: values.body.trim(),
        imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
      });
      navigate(`/community/${post.id}`);
    } catch (error) {
      setFailed(apiMessage(error, "could not post thread, try again"));
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/community" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to community
      </Link>
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        start a thread<span className="text-rosewood">.</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-2xl border border-sage/70 bg-white p-6 shadow-sm" noValidate>
        {failed && (
          <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
            {failed}
          </p>
        )}
        <Field label="title" htmlFor="title" error={errors.title?.message}>
          <TextInput id="title" placeholder="nsfas allowance dates?" {...register("title")} />
        </Field>
        <Field label="body" htmlFor="body" error={errors.body?.message}>
          <textarea
            id="body"
            rows={5}
            placeholder="what should campus know…"
            {...register("body")}
            className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm lowercase text-cocoa">photo (optional)</p>
          <ImageUploader
            value={imageUrl ? [imageUrl] : []}
            onChange={(urls) => setValue("imageUrl", urls[0] ?? "")}
            purpose="COMMUNITY"
            max={1}
          />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {create.isPending ? "posting…" : "post thread"}
        </button>
      </form>
    </section>
  );
}
