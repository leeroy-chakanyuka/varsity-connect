import type { ReactElement } from "react";
import type { Role } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

/* same as protected, plus a role check — the backend stays authoritative */
export function RoleRoute({ allow, children }: { allow: Role[]; children: ReactElement }) {
  return (
    <ProtectedRoute>
      <RoleGate allow={allow}>{children}</RoleGate>
    </ProtectedRoute>
  );
}

function RoleGate({ allow, children }: { allow: Role[]; children: ReactElement }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (!allow.includes(user.role)) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-2 px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold lowercase text-cocoa">not allowed</p>
        <p className="text-sm lowercase text-taupe">
          your {user.role.toLowerCase()} account may not open this page
        </p>
      </section>
    );
  }

  return children;
}
