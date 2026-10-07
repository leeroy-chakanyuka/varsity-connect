import { Link } from "react-router-dom";
import { useDecideMatch, useMatches, type MatchDecision } from "../../api/lostfound";

/* candidate pairs for one report, never called ai — deterministic scores only */
export function PotentialMatches({ reportId }: { reportId: string }) {
  const { data, isLoading, isError, refetch } = useMatches(reportId);
  const decide = useDecideMatch(reportId);

  if (isLoading) {
    return (
      <div role="status" aria-label="loading" className="rounded-2xl border border-sage/70 bg-white p-5">
        <p className="animate-pulse text-sm lowercase text-taupe">checking for matches…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-sage/70 bg-white p-5 text-center">
        <p className="text-sm lowercase text-taupe">matches failed to load</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 rounded-xl bg-cocoa px-4 py-1.5 text-sm lowercase text-white"
        >
          retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sage bg-white p-5 text-center">
        <p className="text-sm lowercase text-taupe">no potential matches yet — new opposite reports check automatically</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold lowercase text-cocoa">
        potential matches<span className="text-rosewood">.</span>
      </h2>
      {data.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          deciding={decide.isPending}
          onDecide={(decision) => decide.mutate({ matchId: match.id, decision })}
        />
      ))}
    </div>
  );
}

function MatchCard({
  match,
  deciding,
  onDecide,
}: {
  match: MatchDecision;
  deciding: boolean;
  onDecide: (decision: "ACCEPT" | "REJECT") => void;
}) {
  const settled = match.myDecision !== "PENDING";
  const confirmed = match.myDecision === "ACCEPTED" && match.otherDecision === "ACCEPTED";

  return (
    <article className="rounded-2xl border border-sage/70 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rounded-full bg-blush/40 px-2.5 py-0.5 text-xs lowercase text-cocoa">
          potential match · {match.score.toFixed(0)}%
        </p>
        {confirmed && (
          <p className="rounded-full bg-sage/50 px-2.5 py-0.5 text-xs lowercase text-cocoa">
            both accepted
          </p>
        )}
      </div>
      <Link
        to={`/lost-found/${match.otherReportId}`}
        className="mt-2 block font-display text-lg font-semibold lowercase text-cocoa hover:text-rosewood"
      >
        {match.otherItemName}
      </Link>
      <p className="mt-1 text-sm text-cocoa">{match.otherDescription}</p>
      <p className="mt-1 text-xs lowercase text-taupe">{match.otherLocation.toLowerCase()}</p>

      {settled ? (
        <p className="mt-3 text-xs lowercase text-taupe">
          you {match.myDecision.toLowerCase()} this one
          {match.otherDecision === "PENDING" ? " — waiting on the other side" : ` — they ${match.otherDecision.toLowerCase()} too`}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={deciding}
            onClick={() => onDecide("ACCEPT")}
            className="flex-1 rounded-xl bg-cocoa px-4 py-2 text-sm lowercase text-white transition hover:opacity-90 disabled:opacity-60"
          >
            accept
          </button>
          <button
            type="button"
            disabled={deciding}
            onClick={() => onDecide("REJECT")}
            className="flex-1 rounded-xl border border-sage bg-white px-4 py-2 text-sm lowercase text-cocoa transition hover:border-red-400 hover:text-red-500 disabled:opacity-60"
          >
            reject
          </button>
        </div>
      )}
    </article>
  );
}
