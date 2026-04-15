"use client";

import { useMemo } from "react";
import {
  Bag,
  Calendar,
  Clock,
  Eye,
  Group,
  SendMail,
  Sparks,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates } from "@/lib/supabase/use-manual-candidates";
import { useReferrals } from "@/lib/supabase/use-referrals";
import { statusLabel } from "@/lib/employer-store";
import type { EmployerApplicationStatus } from "@/lib/employer-store";

export function ReportingDashboard() {
  const user = useUser();
  const { jobs } = useMyJobs();
  const { applications, candidates } = useMyApplications(null);
  const { candidates: manualCands } = useManualCandidates();
  const { referrals } = useReferrals();

  const stats = useMemo(() => {
    const totalApps = applications.length + manualCands.length;
    const totalViews = jobs.reduce((s, j) => s + (j.views ?? 0), 0);
    const publishedJobs = jobs.filter((j) => j.status === "published").length;
    const hiredCount = applications.filter((a) => a.status === "hired").length
      + manualCands.filter((mc) => mc.status === "hired").length;
    const rejectedCount = applications.filter((a) => a.status === "rejected").length
      + manualCands.filter((mc) => mc.status === "rejected").length;
    const interviewCount = applications.filter((a) => a.status === "interview").length
      + manualCands.filter((mc) => mc.status === "interview").length;

    // Conversion rates
    const viewToApp = totalViews > 0 ? Math.round((totalApps / totalViews) * 100) : 0;
    const appToInterview = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0;
    const interviewToHire = interviewCount > 0 ? Math.round((hiredCount / interviewCount) * 100) : 0;

    // Time to hire (average days between application and hire for hired candidates)
    const hiredApps = applications.filter((a) => a.status === "hired");
    const avgDays = hiredApps.length > 0
      ? Math.round(
          hiredApps.reduce((s, a) => {
            const applied = new Date(a.appliedAt).getTime();
            const updated = new Date(a.updatedAt).getTime();
            return s + (updated - applied) / (1000 * 60 * 60 * 24);
          }, 0) / hiredApps.length,
        )
      : 0;

    // Source breakdown
    const sources: Record<string, number> = {};
    for (const a of applications) sources["Plateforme"] = (sources["Plateforme"] ?? 0) + 1;
    for (const mc of manualCands) {
      const label = mc.source === "csv_import" ? "Import CSV" : mc.source === "referral" ? "Cooptation" : "Ajout manuel";
      sources[label] = (sources[label] ?? 0) + 1;
    }

    // Pipeline breakdown
    const pipeline: Record<EmployerApplicationStatus, number> = {
      received: 0, shortlisted: 0, reviewed: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
    };
    for (const a of applications) pipeline[a.status]++;
    for (const mc of manualCands) {
      const s = mc.status as EmployerApplicationStatus;
      if (s in pipeline) pipeline[s]++;
    }

    // Per-job stats
    const jobStats = jobs.map((j) => {
      const apps = applications.filter((a) => a.jobId === j.id).length
        + manualCands.filter((mc) => mc.jobId === j.id).length;
      return { title: j.title, views: j.views ?? 0, apps, conversionRate: j.views > 0 ? Math.round((apps / j.views) * 100) : 0 };
    });

    return {
      totalApps, totalViews, publishedJobs, hiredCount, rejectedCount, interviewCount,
      viewToApp, appToInterview, interviewToHire, avgDays,
      sources, pipeline, jobStats, referralCount: referrals.length,
    };
  }, [applications, manualCands, jobs, referrals]);

  if (!user) return null;

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm text-[var(--accent)]">Reporting</p>
        <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
          Analyse du recrutement
        </h1>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <Kpi icon={Bag} label="Offres actives" value={stats.publishedJobs} />
        <Kpi icon={Eye} label="Vues totales" value={stats.totalViews.toLocaleString("fr-FR")} />
        <Kpi icon={SendMail} label="Candidatures" value={stats.totalApps} />
        <Kpi icon={Calendar} label="Entretiens" value={stats.interviewCount} />
        <Kpi icon={Sparks} label="Embauches" value={stats.hiredCount} />
        <Kpi icon={Group} label="Cooptations" value={stats.referralCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Conversion funnel */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Taux de conversion</h2>
          <div className="flex flex-col gap-4">
            <FunnelRow label="Vue → Candidature" rate={stats.viewToApp} />
            <FunnelRow label="Candidature → Entretien" rate={stats.appToInterview} />
            <FunnelRow label="Entretien → Embauche" rate={stats.interviewToHire} />
          </div>
          {stats.avgDays > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-3">
              <Clock width={14} height={14} strokeWidth={2} className="text-foreground/50" />
              <div>
                <p className="text-[13px] font-medium text-foreground">Time-to-hire moyen</p>
                <p className="text-[12px] text-muted-foreground">{stats.avgDays} jours</p>
              </div>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Sources des candidatures</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
              const pct = stats.totalApps > 0 ? Math.round((count / stats.totalApps) * 100) : 0;
              return (
                <div key={source} className="flex items-center gap-3">
                  <span className="text-[13px] text-foreground/70 w-[120px] shrink-0 truncate">{source}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[12px] font-mono text-foreground/60 w-12 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline breakdown */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6 mb-3">
        <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Pipeline global</h2>
        <div className="flex flex-col gap-3">
          {(Object.entries(stats.pipeline) as Array<[EmployerApplicationStatus, number]>).map(([status, count]) => {
            const pct = stats.totalApps > 0 ? Math.round((count / stats.totalApps) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-[12.5px] text-foreground/70 w-[130px] shrink-0">{statusLabel(status)}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/70 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] font-mono text-foreground/60 w-10 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-job performance */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
        <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Performance par offre</h2>
        {stats.jobStats.length === 0 ? (
          <p className="text-[13px] text-muted-foreground italic">Aucune offre publiee.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-foreground/50">
                  <th className="pb-3 pr-4">Offre</th>
                  <th className="pb-3 pr-4 text-right">Vues</th>
                  <th className="pb-3 pr-4 text-right">Candidatures</th>
                  <th className="pb-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {stats.jobStats.map((j) => (
                  <tr key={j.title} className="border-t border-[var(--border)]">
                    <td className="py-2.5 pr-4 font-medium text-foreground max-w-[250px] truncate">{j.title}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-foreground/70">{j.views}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-foreground/70">{j.apps}</td>
                    <td className="py-2.5 text-right font-mono text-foreground/70">{j.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <Icon width={16} height={16} strokeWidth={2} className="text-foreground/45 mx-auto" />
      <p className="font-display text-[24px] tracking-[-0.01em] text-foreground mt-2">{value}</p>
      <p className="text-[10.5px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function FunnelRow({ label, rate }: { label: string; rate: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] text-foreground/70">{label}</span>
        <span className="text-[14px] font-display font-medium text-foreground">{rate}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--background-alt)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
    </div>
  );
}
