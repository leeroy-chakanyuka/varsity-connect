import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

/* one label + input + error shape reused by every form */
export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm lowercase text-cocoa">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClasses =
  "w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-taupe/60 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-blush/60 transition";

/* plain input so hook-form refs land on the real element */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${inputClasses} ${className ?? ""}`} />;
  },
);

export function useBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const banner = message ? (
    <p role="alert" className="rounded-xl border border-blush bg-blush/30 px-4 py-2.5 text-sm lowercase text-cocoa">
      {message}
    </p>
  ) : null;
  return { banner, show: setMessage, clear: () => setMessage(null) };
}
