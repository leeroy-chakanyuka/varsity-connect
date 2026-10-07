import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* hello screen, then straight to role picking */
export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/welcome", { replace: true }), 1600);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 bg-milk px-6 py-16 text-center">
      <p className="font-display text-5xl font-semibold lowercase tracking-tight text-cocoa">
        varsity connect<span className="text-rosewood">.</span>
      </p>
      <p className="text-base lowercase text-taupe">buy, find, survive campus</p>
      <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-sage/60" aria-hidden="true">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-rosewood" />
      </div>
    </section>
  );
}
