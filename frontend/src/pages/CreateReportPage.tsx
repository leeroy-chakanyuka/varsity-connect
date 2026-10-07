import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateReport, type ReportPayload } from "../api/lostfound";
import { apiMessage } from "../api/client";
import { ReportForm } from "../components/lostfound/ReportForm";

/* new report, straight to its page on success */
export function CreateReportPage() {
  const navigate = useNavigate();
  const create = useCreateReport();
  const [failed, setFailed] = useState<string | null>(null);

  const onSubmit = async (payload: ReportPayload) => {
    try {
      const report = await create.mutateAsync(payload);
      navigate(`/lost-found/${report.id}`);
    } catch (error) {
      setFailed(apiMessage(error, "could not create report, try again"));
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <Link to="/lost-found" className="text-sm lowercase text-taupe hover:text-rosewood">
        ← back to lost &amp; found
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold lowercase tracking-tight text-cocoa">
          report an item<span className="text-rosewood">.</span>
        </h1>
        <p className="mt-1 text-sm lowercase text-taupe">details help it find its way back</p>
      </div>
      <div className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
        <ReportForm
          pending={create.isPending}
          serverError={failed}
          onSubmit={onSubmit}
          submitLabel={create.isPending ? "reporting…" : "report it"}
        />
      </div>
    </section>
  );
}
