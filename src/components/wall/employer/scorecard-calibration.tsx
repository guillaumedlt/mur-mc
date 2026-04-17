"use client";

import { useMemo } from "react";
import { useInterviews, type Scorecard } from "@/lib/supabase/use-interviews";
import { StarRatingCompact } from "./star-rating";

type Props = {
  applicationId: string;
};

const RECO_LABEL: Record<string, { label: string; tone: "accent" | "muted" | "destructive" }> = {
  strong_yes: { label: "Oui fort", tone: "accent" },
  yes: { label: "Oui", tone: "accent" },
  maybe: { label: "Peut-etre", tone: "muted" },
  no: { label: "Non", tone: "destructive" },
  strong_no: { label: "Non fort", tone: "destructive" },
};

export function ScorecardCalibration({ applicationId }: Props) {
  const { scorecards, loading } = useInterviews(applicationId);

  // Agrege : moyenne des notes par critere + consensus sur recommendation
  const summary = useMemo(() => {
    if (scorecards.length === 0) return null;
    // Collecte tous les criteres uniques
    const names = new Set<string>();
    for (const sc of scorecards) for (const c of sc.criteria) names.add(c.name);
    const criteriaAvg = Array.from(names).map((name) => {
      const vals = scorecards
        .flatMap((sc) => sc.criteria.filter((c) => c.name === name && c.rating > 0).map((c) => c.rating));
      const avg = vals.length > 0
        ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
        : 0;
      const spread = vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0;
      return { name, avg, spread, count: vals.length };
    });
    const overallAvg = Math.round(
      (scorecards.reduce((s, sc) => s + sc.overallRating, 0) / scorecards.length) * 10,
    ) / 10;

    // Consensus sur recommendation : oui_fort+oui vs non+non_fort
    const positive = scorecards.filter((s) =>
      s.recommendation === "yes" || s.recommendation === "strong_yes",
    ).length;
    const negative = scorecards.filter((s) =>
      s.recommendation === "no" || s.recommendation === "strong_no",
    ).length;
    const split = positive > 0 && negative > 0;

    return { criteriaAvg, overallAvg, split, positive, negative };
  }, [scorecards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="size-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (scorecards.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground italic">
        Aucune evaluation enregistree pour ce candidat.
      </p>
    );
  }

  // Cas simple : une seule scorecard → affichage compact
  if (scorecards.length === 1) {
    const sc = scorecards[0];
    return (
      <div>
        <ScorecardHeader scorecard={sc} />
        {sc.criteria.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {sc.criteria.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-foreground/70">{c.name}</span>
                <StarRatingCompact value={c.rating} />
              </li>
            ))}
          </ul>
        )}
        {sc.notes && (
          <p className="mt-3 text-[12.5px] text-foreground/75 italic border-l-2 border-[var(--border)] pl-3">
            {sc.notes}
          </p>
        )}
      </div>
    );
  }

  // Cas calibration : N scorecards → tableau comparatif
  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap mb-4 pb-4 border-b border-[var(--border)]">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50">
            Note globale moyenne
          </p>
          <p className="font-display text-[22px] text-foreground mt-0.5">
            {summary?.overallAvg}<span className="text-foreground/40 text-[14px]">/5</span>
          </p>
        </div>
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50">
            Evaluations
          </p>
          <p className="font-display text-[22px] text-foreground mt-0.5">
            {scorecards.length}
          </p>
        </div>
        {summary?.split && (
          <div
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium"
            title={`${summary.positive} positif(s), ${summary.negative} negatif(s)`}
          >
            Divergence entre evaluateurs
          </div>
        )}
      </div>

      {/* Tableau comparatif */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.06em] text-foreground/50">
              <th className="pb-2 pr-3 font-semibold">Evaluateur</th>
              <th className="pb-2 pr-3 text-center font-semibold">Reco</th>
              <th className="pb-2 pr-3 text-right font-semibold">Note</th>
              <th className="pb-2 pl-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {scorecards.map((sc) => {
              const reco = sc.recommendation ? RECO_LABEL[sc.recommendation] : null;
              return (
                <tr key={sc.id} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-3 font-medium text-foreground">{sc.interviewerName}</td>
                  <td className="py-2 pr-3 text-center">
                    {reco && (
                      <span
                        className={`inline-flex h-5 px-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.05em] items-center ${
                          reco.tone === "accent"
                            ? "bg-emerald-100 text-emerald-700"
                            : reco.tone === "destructive"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {reco.label}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-foreground">
                    {sc.overallRating}/5
                  </td>
                  <td className="py-2 pl-3 font-mono text-[11px] text-[var(--tertiary-foreground)]">
                    {new Date(sc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Moyenne par critere */}
      {summary && summary.criteriaAvg.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50 mb-2">
            Moyenne par critere
          </p>
          <ul className="flex flex-col gap-1.5">
            {summary.criteriaAvg.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-foreground/70 truncate">{c.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {c.spread >= 2 && (
                    <span
                      className="text-[9.5px] text-amber-700 font-medium uppercase tracking-[0.05em]"
                      title={`Ecart ${c.spread} etoiles entre evaluateurs`}
                    >
                      Desaccord
                    </span>
                  )}
                  <span className="font-mono text-foreground">
                    {c.avg}
                    <span className="text-foreground/40">/5</span>
                    <span className="text-foreground/40 ml-1">({c.count})</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScorecardHeader({ scorecard }: { scorecard: Scorecard }) {
  const reco = scorecard.recommendation ? RECO_LABEL[scorecard.recommendation] : null;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-foreground truncate">
          {scorecard.interviewerName}
        </p>
        <p className="text-[10.5px] font-mono text-[var(--tertiary-foreground)]">
          {new Date(scorecard.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      {reco && (
        <span
          className={`inline-flex h-6 px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.05em] items-center ${
            reco.tone === "accent"
              ? "bg-emerald-100 text-emerald-700"
              : reco.tone === "destructive"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {reco.label}
        </span>
      )}
      <span className="font-display text-[20px] text-foreground">
        {scorecard.overallRating}<span className="text-foreground/40 text-[13px]">/5</span>
      </span>
    </div>
  );
}
