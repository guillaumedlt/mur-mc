"use client";

import { useState } from "react";
import {
  Bag,
  Calendar,
  Clock,
  Download,
  Eye,
  Group,
  SendMail,
  Sparks,
  ArrowUp,
  ArrowDown,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates } from "@/lib/supabase/use-manual-candidates";
import { useReferrals } from "@/lib/supabase/use-referrals";
import { statusLabel } from "@/lib/employer-store";
import type { EmployerApplicationStatus } from "@/lib/employer-store";
import {
  useReportingStats,
  exportStatsCsv,
  PERIOD_LABELS,
  type Period,
} from "./use-reporting-stats";

const PERIODS: Period[] = ["7d", "30d", "90d", "ytd", "all"];

export function ReportingDashboard() {
  const user = useUser();
  const { jobs } = useMyJobs();
  const { applications } = useMyApplications(null);
  const { candidates: manualCands } = useManualCandidates();
  const { referrals } = useReferrals();
  const [period, setPeriod] = useState<Period>("30d");

  const stats = useReportingStats({
    applications,
    manualCands,
    jobs,
    referrals,
    period,
  });

  if (!user) return null;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header + period selector + export */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="ed-label-sm text-[var(--accent)]">Reporting</p>
            <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Analyse du recrutement
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-1.5">
              {PERIOD_LABELS[period]}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background-alt)]/60 p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`h-8 px-3 rounded-full text-[12px] font-medium transition-colors ${
                    period === p
                      ? "bg-foreground text-background"
                      : "text-foreground/65 hover:text-foreground"
                  }`}
                >
                  {p === "all" ? "Tout" : p === "ytd" ? "YTD" : p.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => exportStatsCsv(stats, period)}
              className="h-8 px-3 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--background-alt)] text-[12px] font-medium text-foreground/80 inline-flex items-center gap-1.5 transition-colors"
            >
              <Download width={11} height={11} strokeWidth={2} />
              CSV
            </button>
          </div>
        </div>
      </header>

      {/* KPIs avec trends */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <Kpi icon={Bag} label="Offres actives" value={stats.kpis.publishedJobs} />
        <Kpi icon={Eye} label="Vues totales" value={stats.kpis.totalViews.toLocaleString("fr-FR")} />
        <Kpi
          icon={SendMail}
          label="Candidatures"
          value={stats.kpis.totalApps}
          trend={stats.kpis.appsTrend}
        />
        <Kpi
          icon={Calendar}
          label="Entretiens"
          value={stats.kpis.interviewCount}
          trend={stats.kpis.interviewsTrend}
        />
        <Kpi
          icon={Sparks}
          label="Embauches"
          value={stats.kpis.hiredCount}
          trend={stats.kpis.hiresTrend}
        />
        <Kpi icon={Group} label="Cooptations" value={stats.kpis.referralCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Funnel */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Taux de conversion</h2>
          <div className="flex flex-col gap-4">
            <FunnelRow label="Vue → Candidature" rate={stats.funnel.viewToApp} />
            <FunnelRow label="Candidature → Entretien" rate={stats.funnel.appToInterview} />
            <FunnelRow label="Entretien → Embauche" rate={stats.funnel.interviewToHire} />
          </div>
          {stats.avgDaysToHire > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-3">
              <Clock width={14} height={14} strokeWidth={2} className="text-foreground/50" />
              <div>
                <p className="text-[13px] font-medium text-foreground">Time-to-hire moyen</p>
                <p className="text-[12px] text-muted-foreground">
                  {stats.avgDaysToHire} jours
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Sources des candidatures</h2>
          {stats.sources.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Aucune candidature sur la periode.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.sources.map((s) => (
                <StatRow key={s.label} label={s.label} count={s.count} pct={s.pct} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline + Rejection reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">Pipeline</h2>
          <div className="flex flex-col gap-3">
            {stats.pipeline.map((p) => (
              <StatRow
                key={p.status}
                label={statusLabel(p.status as EmployerApplicationStatus)}
                count={p.count}
                pct={p.pct}
                tone="muted"
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
          <h2 className="font-display text-[18px] tracking-[-0.01em] mb-5">
            Motifs de refus
          </h2>
          {stats.rejectionReasons.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Aucun refus structure sur la periode.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.rejectionReasons.map((r) => (
                <StatRow
                  key={r.reason}
                  label={r.label}
                  count={r.count}
                  pct={r.pct}
                  tone="destructive"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-job */}
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
                  <tr key={j.id} className="border-t border-[var(--border)]">
                    <td className="py-2.5 pr-4 font-medium text-foreground max-w-[250px] truncate">
                      {j.title}
                    </td>
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
  trend,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number | string;
  trend?: number | null;
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <Icon width={16} height={16} strokeWidth={2} className="text-foreground/45 mx-auto" />
      <p className="font-display text-[24px] tracking-[-0.01em] text-foreground mt-2">{value}</p>
      <p className="text-[10.5px] text-muted-foreground mt-0.5">{label}</p>
      {trend !== null && trend !== undefined && (
        <TrendPill value={trend} />
      )}
    </div>
  );
}

function TrendPill({ value }: { value: number }) {
  if (value === 0) {
    return <p className="text-[10px] text-foreground/40 mt-1 font-mono">= 0%</p>;
  }
  const up = value > 0;
  return (
    <p
      className={`text-[10px] mt-1 font-mono inline-flex items-center gap-0.5 ${
        up ? "text-emerald-600" : "text-destructive"
      }`}
    >
      {up ? (
        <ArrowUp width={9} height={9} strokeWidth={2.5} />
      ) : (
        <ArrowDown width={9} height={9} strokeWidth={2.5} />
      )}
      {Math.abs(value)}%
    </p>
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

function StatRow({
  label,
  count,
  pct,
  tone = "accent",
}: {
  label: string;
  count: number;
  pct: number;
  tone?: "accent" | "muted" | "destructive";
}) {
  const barClass =
    tone === "destructive"
      ? "bg-destructive/70"
      : tone === "muted"
      ? "bg-foreground/70"
      : "bg-[var(--accent)]";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12.5px] text-foreground/70 w-[140px] shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] font-mono text-foreground/60 w-14 text-right tabular-nums">
        {count} ({pct}%)
      </span>
    </div>
  );
}
