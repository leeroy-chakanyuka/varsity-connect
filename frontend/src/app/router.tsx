import { Route, Routes } from "react-router-dom";
import { Shell } from "../components/shell";

/* empty router for now, real routes land with their stages */
export function Router() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Placeholder />} />
        <Route path="*" element={<Placeholder />} />
      </Route>
    </Routes>
  );
}

/* placeholder home, replaced stage by stage */
function Placeholder() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
        varsity connect<span className="text-rosewood">.</span>
      </p>
      <p className="text-base lowercase text-taupe">
        marketplace, lost &amp; found, and survival mode for campus life
      </p>
      <p className="rounded-full border border-sage bg-white px-4 py-1.5 text-sm lowercase text-taupe">
        stage 0 shell — real pages arrive with their stages
      </p>
    </section>
  );
}
