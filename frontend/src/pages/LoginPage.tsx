import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { apiCode, apiMessage } from "../api/client";
import { Field, TextInput, useBanner } from "../components/ui/field";

const schema = z.object({
  identifier: z.string().trim().min(1, "email or student number is required"),
  password: z.string().min(1, "password is required"),
});

type Form = z.infer<typeof schema>;

/* email or student number, one box for both */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { banner, show } = useBanner();

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const role = (location.state as { role?: string } | null)?.role;
  const justRegistered = (location.state as { registered?: string } | null)?.registered;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    try {
      await login(values.identifier, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      /* wrong password reads plainly, everything else passes through */
      show(
        apiCode(error) === "INVALID_CREDENTIALS"
          ? "invalid credentials, check both fields and try again"
          : apiMessage(error, "login failed, try again"),
      );
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          welcome back<span className="text-rosewood">.</span>
        </h1>
        {role && (
          <p className="mt-1 inline-block rounded-full bg-blush/40 px-3 py-1 text-xs lowercase text-cocoa">
            logging in as {role.toLowerCase()}
          </p>
        )}
      </div>

      {justRegistered && (
        <p role="status" className="rounded-xl border border-sage bg-white px-4 py-2.5 text-sm lowercase text-cocoa">
          account created, log in to continue
        </p>
      )}

      {banner}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="email or student number" htmlFor="identifier" error={errors.identifier?.message}>
          <TextInput
            id="identifier"
            autoComplete="username"
            placeholder="you@cput.ac.za or 221234567"
            {...register("identifier")}
          />
        </Field>

        <Field label="password" htmlFor="password" error={errors.password?.message}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="your password"
            {...register("password")}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-cocoa px-4 py-3 text-sm lowercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "logging in…" : "log in"}
        </button>
      </form>

      <p className="text-center text-sm lowercase text-taupe">
        new here?{" "}
        <Link
          to="/register"
          state={role ? { role } : undefined}
          className="text-rosewood hover:underline"
        >
          create an account
        </Link>
      </p>
    </section>
  );
}
