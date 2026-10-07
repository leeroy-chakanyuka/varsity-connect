import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { register as registerApi } from "../api/auth";
import { apiCode, apiFieldErrors, apiMessage } from "../api/client";
import { Field, TextInput, useBanner } from "../components/ui/field";

const schema = z.object({
  role: z.enum(["STUDENT", "VENDOR"]),
  fullName: z.string().trim().min(1, "full name is required").max(120, "full name is too long"),
  email: z.string().trim().min(1, "email is required").email("email is invalid"),
  studentNumber: z.string().trim().optional(),
  faculty: z.string().trim().max(120, "faculty is too long").optional(),
  password: z.string().min(8, "password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "repeat your password"),
    /* plain boolean here, the required tick lives in onSubmit next to the
     * other cross-field rules so everything shows together */
    acceptedTerms: z.boolean(),
  });

type Form = z.infer<typeof schema>;

/* no admin option here on purpose, that door stays shut publicly */
export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { banner, show } = useBanner();
  const [done, setDone] = useState(false);

  const incoming = (location.state as { role?: string } | null)?.role;
  const initialRole = incoming === "VENDOR" ? "VENDOR" : "STUDENT";

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: initialRole, acceptedTerms: false },
  });

  const role = watch("role");

  /* success shows, then hands you to login */
  useEffect(() => {
    if (!done) {
      return;
    }
    const timer = window.setTimeout(() => navigate("/login", { replace: true, state: { registered: "yes" } }), 1400);
    return () => window.clearTimeout(timer);
  }, [done, navigate]);

  const onSubmit = async (values: Form) => {
    /* cross-field rules live here so they show alongside zod errors —
     * zod skips object refinements once any base field fails */
    let invalid = false;
    if (values.role === "STUDENT" && !values.studentNumber?.trim()) {
      setError("studentNumber", { message: "student number is required for students" });
      invalid = true;
    }
    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", { message: "passwords do not match" });
      invalid = true;
    }
    if (!values.acceptedTerms) {
      setError("acceptedTerms", { message: "terms must be accepted" });
      invalid = true;
    }
    if (invalid) {
      return;
    }
    try {
      await registerApi({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        studentNumber: values.studentNumber?.trim() ? values.studentNumber.trim() : undefined,
        faculty: values.faculty?.trim() ? values.faculty.trim() : undefined,
        acceptedTerms: true,
      });
      /* login comes next, so the session starts there */
      setDone(true);
    } catch (error) {
      /* backend field errors land on their inputs, known codes get a plain banner */
      const code = apiCode(error);
      const fields = apiFieldErrors(error);
      let mapped = 0;
      for (const [field, message] of Object.entries(fields)) {
        if (field === "email" || field === "studentNumber" || field === "fullName" || field === "password") {
          setError(field, { message });
          mapped += 1;
        }
      }
      if (code === "EMAIL_ALREADY_EXISTS") {
        show("that email is already registered, try logging in");
      } else if (code === "STUDENT_NUMBER_ALREADY_EXISTS") {
        show("that student number is already registered");
      } else if (mapped > 0 && mapped === Object.keys(fields).length) {
        show("fix the highlighted fields and try again");
      } else {
        show(apiMessage(error, "registration failed, try again"));
      }
    }
  };

  if (done) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p role="status" className="font-display text-3xl font-semibold lowercase text-cocoa">
          you are in<span className="text-rosewood">.</span>
        </p>
        <p className="text-sm lowercase text-taupe">account created, taking you to login…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          create account<span className="text-rosewood">.</span>
        </h1>
      </div>

      {/* role tabs, student or vendor only */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-sage/70 bg-white p-1.5" role="tablist" aria-label="account type">
        {(["STUDENT", "VENDOR"] as const).map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-xl px-4 py-2 text-center text-sm lowercase transition ${
              role === option ? "bg-cocoa text-white" : "text-taupe hover:text-cocoa"
            }`}
          >
            <input type="radio" value={option} {...register("role")} className="sr-only" />
            {option.toLowerCase()}
          </label>
        ))}
      </div>

      {banner}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="full name" htmlFor="fullName" error={errors.fullName?.message}>
          <TextInput id="fullName" autoComplete="name" placeholder="lerato dlamini" {...register("fullName")} />
        </Field>

        <Field label="email" htmlFor="email" error={errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@cput.ac.za"
            {...register("email")}
          />
        </Field>

        {role === "STUDENT" && (
          <Field label="student number" htmlFor="studentNumber" error={errors.studentNumber?.message}>
            <TextInput id="studentNumber" autoComplete="off" placeholder="221234567" {...register("studentNumber")} />
          </Field>
        )}

        <Field label="faculty (optional)" htmlFor="faculty" error={errors.faculty?.message}>
          <TextInput id="faculty" autoComplete="off" placeholder="informatics and design" {...register("faculty")} />
        </Field>

        <Field label="password" htmlFor="password" error={errors.password?.message}>
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="at least 8 characters"
            {...register("password")}
          />
        </Field>

        <Field label="confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <TextInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="repeat it"
            {...register("confirmPassword")}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="acceptedTerms" className="flex cursor-pointer items-start gap-2 text-sm lowercase text-cocoa">
            <input id="acceptedTerms" type="checkbox" {...register("acceptedTerms")} className="mt-1 accent-[#E8A0B4]" />
            i accept the campus terms
          </label>
          {errors.acceptedTerms && (
            <p role="alert" className="text-xs lowercase text-red-500">
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "creating…" : "create account"}
        </button>
      </form>

      <p className="text-center text-sm lowercase text-taupe">
        have an account?{" "}
        <Link to="/login" className="text-rosewood hover:underline">
          log in
        </Link>
      </p>
    </section>
  );
}
