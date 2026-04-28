"use client";

import { useMemo } from "react";
import type { MyJob } from "@/lib/supabase/use-my-jobs";
import type {
  EmployerApplication,
  EmployerApplicationStatus,
} from "@/lib/employer-store";
import type { ManualCandidate } from "@/lib/supabase/use-manual-candidates";

export type Period = "7d" | "30d" | "90d" | "ytd" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  ytd: "Annee en cours",
  all: "Tout",
};

type Input = {
  applications: EmployerApplication[];
  manualCands: ManualCandidate[];
  jobs: MyJob[];
  referrals: Array<{ status?: string }>;
  period: Period;
};

export type ReportingStats = {
  /** KPIs principaux avec variation vs periode precedente (en %) */
  kpis: {
    publishedJobs: number;
    totalViews: number;
    totalApps: number;
    interviewCount: number;
    hiredCount: number;
    referralCount: number;
    /** null = pas de comparaison possible */
    appsTrend: number | null;
    hiresTrend: number | null;
    interviewsTrend: number | null;
  };
  /** Taux de conversion */
  funnel: {
    viewToApp: number;
    appToInterview: number;
    interviewToHire: number;
  };
  /** Time-to-hire moyen en jours (0 si aucune embauche). */
  avgDaysToHire: number;
  /** Sources des candidatures */
  sources: Array<{ label: string; count: number; pct: number }>;
  /** Repartition par statut */
  pipeline: Array<{ status: EmployerApplicationStatus; count: number; pct: number }>;
  /** Motifs de refus structures */
  rejectionReasons: Array<{ reason: string; label: string; count: number; pct: number }>;
  /** Performance par offre */
  jobStats: Array<{ id: string; title: string; views: number; apps: number; conversionRate: number }>;
};

const REJECTION_LABELS: Record<string, string> = {
  skills_gap: "Competences manquantes",
  experience_gap: "Experience insuffisante",
  culture_fit: "Adequation culture",
  overqualified: "Surqualifie",
  location: "Localisation",
  salary: "Salaire",
  no_response: "Pas de reponse",
  hired_elsewhere: "Recrute ailleurs",
  other: "Autre",
};

function periodBounds(period: Period): { start: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : null;

  if (days !== null) {
    const start = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const prevEnd = start;
    const prevStart = new Date(start.getTime() - days * 24 * 3600 * 1000);
    return { start, prevStart, prevEnd };
  }
  if (period === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return { start, prevStart, prevEnd };
  }
  return { start: null, prevStart: null, prevEnd: null };
}

function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prev) / prev) * 100);
}

export function useReportingStats(input: Input): ReportingStats {
  return useMemo(() => {
    const { applications, manualCands, jobs, referrals, period } = input;
    const { start, prevStart, prevEnd } = periodBounds(period);

    const inPeriod = (dateIso: string | null | undefined): boolean => {
      if (!start) return true;
      if (!dateIso) return false;
      return new Date(dateIso) >= start;
    };
    const inPrevPeriod = (dateIso: string | null | undefined): boolean => {
      if (!prevStart || !prevEnd) return false;
      if (!dateIso) return false;
      const d = new Date(dateIso);
      return d >= prevStart && d < prevEnd;
    };

    const periodApps = applications.filter((a) => inPeriod(a.appliedAt));
    const periodManual = manualCands.filter((m) => inPeriod(m.createdAt));
    const totalApps = periodApps.length + periodManual.length;

    const prevApps = applications.filter((a) => inPrevPeriod(a.appliedAt));
    const prevManual = manualCands.filter((m) => inPrevPeriod(m.createdAt));
    const prevTotalApps = prevApps.length + prevManual.length;

    const publishedJobs = jobs.filter((j) => j.status === "published").length;
    const totalViews = jobs.reduce((s, j) => s + (j.views ?? 0), 0);

    const hiredCount =
      periodApps.filter((a) => a.status === "hired").length +
      periodManual.filter((m) => m.status === "hired").length;
    const prevHired =
      prevApps.filter((a) => a.status === "hired").length +
      prevManual.filter((m) => m.status === "hired").length;

    const interviewCount =
      periodApps.filter((a) => a.status === "interview").length +
      periodManual.filter((m) => m.status === "interview").length;
    const prevInterviews =
      prevApps.filter((a) => a.status === "interview").length +
      prevManual.filter((m) => m.status === "interview").length;

    // Funnel (sur la periode)
    const viewToApp = totalViews > 0 ? Math.round((totalApps / totalViews) * 100) : 0;
    const appToInterview = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0;
    const interviewToHire = interviewCount > 0 ? Math.round((hiredCount / interviewCount) * 100) : 0;

    // Time to hire
    const hiredApps = periodApps.filter((a) => a.status === "hired");
    const avgDaysToHire = hiredApps.length > 0
      ? Math.round(
          hiredApps.reduce((s, a) => {
            const applied = new Date(a.appliedAt).getTime();
            const updated = new Date(a.updatedAt).getTime();
            return s + (updated - applied) / (1000 * 60 * 60 * 24);
          }, 0) / hiredApps.length,
        )
      : 0;

    // Sources (sur la periode)
    const sourceCounts: Record<string, number> = {};
    if (periodApps.length > 0) sourceCounts["Monte Carlo Work"] = periodApps.length;
    for (const mc of periodManual) {
      const label = mc.source === "csv_import" ? "Import CSV" : mc.source === "referral" ? "Cooptation" : "Ajout manuel";
      sourceCounts[label] = (sourceCounts[label] ?? 0) + 1;
    }
    const sources = Object.entries(sourceCounts)
      .map(([label, count]) => ({
        label,
        count,
        pct: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Pipeline (sur la periode)
    const pipeCounts: Record<EmployerApplicationStatus, number> = {
      received: 0, shortlisted: 0, reviewed: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
    };
    for (const a of periodApps) pipeCounts[a.status]++;
    for (const m of periodManual) {
      const s = m.status as EmployerApplicationStatus;
      if (s in pipeCounts) pipeCounts[s]++;
    }
    const pipeline = (Object.entries(pipeCounts) as Array<[EmployerApplicationStatus, number]>).map(
      ([status, count]) => ({
        status,
        count,
        pct: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
      }),
    );

    // Rejection reasons (sur la periode, applications seulement — manuals n'ont pas le champ)
    const reasonCounts: Record<string, number> = {};
    for (const a of periodApps) {
      if (a.status === "rejected" && a.rejectionReason) {
        reasonCounts[a.rejectionReason] = (reasonCounts[a.rejectionReason] ?? 0) + 1;
      }
    }
    const rejectedTotal = Object.values(reasonCounts).reduce((s, c) => s + c, 0);
    const rejectionReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        label: REJECTION_LABELS[reason] ?? reason,
        count,
        pct: rejectedTotal > 0 ? Math.round((count / rejectedTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Per-job (on ne filtre pas le vues par periode car views est un cumul)
    const jobStats = jobs.map((j) => {
      const appsCount =
        periodApps.filter((a) => a.jobId === j.id).length +
        periodManual.filter((m) => m.jobId === j.id).length;
      return {
        id: j.id,
        title: j.title,
        views: j.views ?? 0,
        apps: appsCount,
        conversionRate: j.views > 0 ? Math.round((appsCount / j.views) * 100) : 0,
      };
    });

    return {
      kpis: {
        publishedJobs,
        totalViews,
        totalApps,
        interviewCount,
        hiredCount,
        referralCount: referrals.length,
        appsTrend: trendPct(totalApps, prevTotalApps),
        hiresTrend: trendPct(hiredCount, prevHired),
        interviewsTrend: trendPct(interviewCount, prevInterviews),
      },
      funnel: { viewToApp, appToInterview, interviewToHire },
      avgDaysToHire,
      sources,
      pipeline,
      rejectionReasons,
      jobStats,
    };
  }, [input]);
}

/** Export les stats en CSV, declenche un download. */
export function exportStatsCsv(stats: ReportingStats, period: Period): void {
  const rows: string[] = [];
  const esc = (v: string | number) => {
    const s = String(v);
    return /[,;\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  rows.push(`Rapport recrutement — ${PERIOD_LABELS[period]}`);
  rows.push("");
  rows.push("KPI,Valeur");
  rows.push(`Offres publiees,${stats.kpis.publishedJobs}`);
  rows.push(`Vues totales,${stats.kpis.totalViews}`);
  rows.push(`Candidatures,${stats.kpis.totalApps}`);
  rows.push(`Entretiens,${stats.kpis.interviewCount}`);
  rows.push(`Embauches,${stats.kpis.hiredCount}`);
  rows.push(`Cooptations,${stats.kpis.referralCount}`);
  rows.push(`Time-to-hire moyen (jours),${stats.avgDaysToHire}`);
  rows.push("");
  rows.push("Source,Nombre,Part (%)");
  for (const s of stats.sources) rows.push(`${esc(s.label)},${s.count},${s.pct}`);
  rows.push("");
  rows.push("Statut,Nombre,Part (%)");
  for (const p of stats.pipeline) rows.push(`${esc(p.status)},${p.count},${p.pct}`);
  rows.push("");
  rows.push("Motif de refus,Nombre,Part (%)");
  for (const r of stats.rejectionReasons) rows.push(`${esc(r.label)},${r.count},${r.pct}`);
  rows.push("");
  rows.push("Offre,Vues,Candidatures,Conversion (%)");
  for (const j of stats.jobStats) rows.push(`${esc(j.title)},${j.views},${j.apps},${j.conversionRate}`);

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mur-mc-reporting-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
