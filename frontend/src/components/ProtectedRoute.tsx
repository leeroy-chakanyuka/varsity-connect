import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/* blocks the page until we know who is asking, then blocks strangers */
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  /* never render a protected page before the session resolves */
  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" role="status" aria-label="loading">
        <p className="animate-pulse text-sm lowercase text-taupe">checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
