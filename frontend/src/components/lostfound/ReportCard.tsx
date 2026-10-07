import { Link } from "react-router-dom";
import type { Report } from "../../api/lostfound";

/* one card in the lost/found feed */
export function ReportCard({ report }: { report: Report }) {
  return (
    <Link
      to={`/lost-found/${report.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sage/70 bg-white shadow-sm transition hover:shadow-md"
    >
      {report.imageUrl ? (
        <img src={report.imageUrl} alt={report.itemName} className="aspect-video w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-milk" aria-hidden="true">
          <p className="text-xs lowercase text-taupe">no photo</p>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-2">
          <p
            className={`rounded-full px-2 py-0.5 text-[11px] lowercase ${
              report.type === "LOST" ? "bg-blush/50 text-cocoa" : "bg-sage/50 text-cocoa"
            }`}
          >
            {report.type.toLowerCase()}
          </p>
          <p className="text-[11px] lowercase text-taupe">{report.status.toLowerCase().replace(/_/g, " ")}</p>
        </div>
        <p className="font-display text-lg font-semibold lowercase text-cocoa group-hover:text-rosewood">
          {report.itemName}
        </p>
        <p className="text-xs lowercase text-taupe">
          {report.location.toLowerCase()} · {new Date(report.incidentDate).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
