import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, TextInput } from "../components/ui/field";
import { apiMessage } from "../api/client";
import {
  fetchMyProfile,
  profileKeys,
  updateMyProfile,
  type Profile,
} from "../api/profile";
import { ProfileView } from "./profile-view";
import { ReviewsList } from "../components/reviews/ReviewsList";

const schema = z.object({
  fullName: z.string().trim().min(1, "full name is required").max(120, "full name is too long"),
  faculty: z.string().trim().max(120, "faculty is too long").optional().or(z.literal("")),
  phoneNumber: z.string().trim().max(40, "phone number is too long").optional().or(z.literal("")),
  bio: z.string().trim().max(1000, "bio is too long").optional().or(z.literal("")),
  profileImageUrl: z
    .string()
    .trim()
    .max(500, "profile image url is too long")
    .optional()
    .or(z.literal("")),
});

type Form = z.infer<typeof schema>;

/* your own page, view on top and the edit form below it */
export function MyProfilePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchMyProfile,
  });

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-12" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">loading your profile…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">profile failed to load</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white"
        >
          retry
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        my profile<span className="text-rosewood">.</span>
      </h1>
      <ProfileView profile={data} />
      <ReviewsList userId={data.id} />
      <EditProfileForm key={data.id} initial={data} />
    </section>
  );
}

function EditProfileForm({ initial }: { initial: Profile }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: initial.fullName,
      faculty: initial.faculty ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      bio: initial.bio ?? "",
      profileImageUrl: initial.profileImageUrl ?? "",
    },
  });
  const { errors, isSubmitting } = formState;

  /* fresh server data refills the form, edits never go stale */
  useEffect(() => {
    reset({
      fullName: initial.fullName,
      faculty: initial.faculty ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      bio: initial.bio ?? "",
      profileImageUrl: initial.profileImageUrl ?? "",
    });
  }, [initial, reset]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.me, profile);
      /* shell reads this copy for your display name */
      queryClient.setQueryData(["auth", "me"], (old: Profile | undefined) => ({ ...old, ...profile }));
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
      setFailed(null);
      setSaved(true);
    },
    onError: (error) => {
      setSaved(false);
      setFailed(apiMessage(error, "update failed, try again"));
    },
  });

  const onSubmit = (values: Form) => {
    /* blanks mean untouched, only send what changed */
    const payload: Record<string, string> = {};
    if (values.fullName.trim() !== initial.fullName) {
      payload.fullName = values.fullName.trim();
    }
    for (const field of ["faculty", "phoneNumber", "bio", "profileImageUrl"] as const) {
      const next = values[field]?.trim() ?? "";
      const current = initial[field] ?? "";
      if (next !== current && next) {
        payload[field] = next;
      }
    }
    setSaved(false);
    mutation.mutate(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-2xl border border-sage/70 bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">edit profile</h2>

      {saved && (
        <p role="status" className="rounded-xl border border-sage bg-milk px-4 py-2.5 text-sm lowercase text-cocoa">
          profile updated
        </p>
      )}
      {failed && (
        <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
          {failed}
        </p>
      )}

      <Field label="full name" htmlFor="fullName" error={errors.fullName?.message}>
        <TextInput id="fullName" autoComplete="name" {...register("fullName")} />
      </Field>

      <Field label="faculty" htmlFor="faculty" error={errors.faculty?.message}>
        <TextInput id="faculty" autoComplete="off" placeholder="informatics and design" {...register("faculty")} />
      </Field>

      <Field label="phone number" htmlFor="phoneNumber" error={errors.phoneNumber?.message}>
        <TextInput id="phoneNumber" autoComplete="tel" placeholder="012 345 6789" {...register("phoneNumber")} />
      </Field>

      <Field label="bio" htmlFor="bio" error={errors.bio?.message}>
        <textarea
          id="bio"
          rows={3}
          placeholder="final year, selling textbooks…"
          {...register("bio")}
          className="w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "saving…" : "save changes"}
      </button>
    </form>
  );
}
