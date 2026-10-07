import { Phone } from "lucide-react";

/* campus emergency line, number comes from env — never hardcoded here */
export function EmergencyButton() {
  const number = import.meta.env.VITE_CPUT_EMERGENCY_PHONE as string | undefined;

  if (!number) {
    return (
      <p role="note" className="rounded-2xl border border-blush bg-blush/30 px-4 py-3 text-center text-sm lowercase text-cocoa">
        emergency line not configured — ask your campus office for the number
      </p>
    );
  }

  return (
    <a
      href={`tel:${number}`}
      className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm lowercase text-white transition hover:opacity-90"
    >
      <Phone className="h-4 w-4" aria-hidden="true" />
      call campus emergency
    </a>
  );
}
