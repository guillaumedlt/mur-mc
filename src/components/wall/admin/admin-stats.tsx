"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown } from "iconoir-react";

type Period = "7d" | "30d" | "90d" | "all";

type RawData = {
  companies: Array<{ id: string; name: string; plan: string; sector: string; created_at: string }>;
  jobs: Array<{ id: string; company_id: string; status: string; views: number; type: string; sector: string; level: string; remote: string; created_at: string; published_at: string }>;
  applications: Array<{ id: string; job_id: string; status: string; source: string; match_score: number; applied_at: string }>;
  candidates: Array<{ id: string; location: string | null; skills: string[]; languages: string[]; experience_years: number | null; open_to_work: boolean; created_at: string }>;
  alerts: Array<{ id: string; active: boolean; frequency: string; created_at: string }>;
  stories: Array<{ id: string; slug: string; created_at: string }>;
};

export function AdminStats() {
  const [data, setData] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d: RawData) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return <StatsView data={data} period={period} setPeriod={setPeriod} />;
}

function StatsView({ data, period, setPeriod }: { data: RawData; period: Period; setPeriod: (p: Period) => void }) {
  const stats = useMemo(() => {
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 9999;
    const since = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const prevSince = new Date(since.getTime() - days * 24 * 3600 * 1000);

    const inPeriod = (d: string) => new Date(d) >= since;
    const inPrev = (d: string) => { const dt = new Date(d); return dt >= prevSince && dt < since; };
    const trend = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    // KPIs
    const totalCompanies = data.companies.length;
    const newCompanies = data.companies.filter((c) => inPeriod(c.created_at)).length;
    const prevCompanies = data.companies.filter((c) => inPrev(c.created_at)).length;

    const totalJobs = data.jobs.length;
    const publishedJobs = data.jobs.filter((j) => j.status === "published").length;
    const newJobs = data.jobs.filter((j) => inPeriod(j.created_at)).length;
    const prevJobs = data.jobs.filter((j) => inPrev(j.created_at)).length;

    const totalViews = data.jobs.reduce((s, j) => s + (j.views ?? 0), 0);

    const totalApps = data.applications.length;
    const newApps = data.applications.filter((a) => inPeriod(a.applied_at)).length;
    const prevApps = data.applications.filter((a) => inPrev(a.applied_at)).length;

    const totalCandidates = data.candidates.length;
    const newCandidates = data.candidates.filter((c) => inPeriod(c.created_at)).length;
    const prevCandidates = data.candidates.filter((c) => inPrev(c.created_at)).length;

    const hiredCount = data.applications.filter((a) => a.status === "hired").length;
    const activeAlerts = data.alerts.filter((a) => a.active).length;

    // Avg match score
    const scores = data.applications.filter((a) => a.match_score > 0).map((a) => a.match_score);
    const avgMatch = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

    // Source breakdown
    const sources: Record<string, number> = {};
    for (const a of data.applications) {
      const src = a.source ?? "platform";
      sources[src] = (sources[src] ?? 0) + 1;
    }

    // Sector breakdown (jobs)
    const sectors: Record<string, number> = {};
    for (const j of data.jobs) sectors[j.sector] = (sectors[j.sector] ?? 0) + 1;

    // Contract type breakdown
    const contracts: Record<string, number> = {};
    for (const j of data.jobs) contracts[j.type] = (contracts[j.type] ?? 0) + 1;

    // Plan breakdown
    const plans: Record<string, number> = {};
    for (const c of data.companies) plans[c.plan ?? "starter"] = (plans[c.plan ?? "starter"] ?? 0) + 1;

    // Pipeline
    const pipeline: Record<string, number> = {};
    for (const a of data.applications) pipeline[a.status] = (pipeline[a.status] ?? 0) + 1;

    // Candidate locations
    const locations: Record<string, number> = {};
    for (const c of data.candidates) {
      const loc = c.location ?? "Non renseigne";
      locations[loc] = (locations[loc] ?? 0) + 1;
    }

    // Top skills
    const skillCounts: Record<string, number> = {};
    for (const c of data.candidates) for (const s of c.skills ?? []) skillCounts[s] = (skillCounts[s] ?? 0) + 1;
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

    // Open to work
    const openToWork = data.candidates.filter((c) => c.open_to_work).length;

    // Avg time on platform (days since signup)
    const avgDays = totalCandidates > 0
      ? Math.round(data.candidates.reduce((s, c) => s + (now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) / totalCandidates)
      : 0;

    return {
      totalCompanies, newCompanies, prevCompanies,
      totalJobs, publishedJobs, newJobs, prevJobs,
      totalViews,
      totalApps, newApps, prevApps,
      totalCandidates, newCandidates, prevCandidates,
      hiredCount, activeAlerts, avgMatch,
      sources, sectors, contracts, plans, pipeline, locations, topSkills,
      openToWork, avgDays,
      trend,
    };
  }, [data, period]);

  const t = stats.trend;

  return (
    <div className="flex flex-col gap-3">
      {/* Period selector */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-[20px] tracking-[-0.01em]">Statistiques globales</h2>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background-alt)]/60 p-0.5">
          {(["7d", "30d", "90d", "all"] as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`h-8 px-3 rounded-full text-[12px] font-medium transition-colors ${period === p ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"}`}>
              {p === "all" ? "Tout" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Entreprises" value={stats.totalCompanies} sub={`+${stats.newCompanies} periode`} trend={t(stats.newCompanies, stats.prevCompanies)} />
        <Kpi label="Offres totales" value={stats.totalJobs} sub={`${stats.publishedJobs} publiees`} trend={t(stats.newJobs, stats.prevJobs)} />
        <Kpi label="Vues totales" value={stats.totalViews.toLocaleString("fr-FR")} />
        <Kpi label="Candidatures" value={stats.totalApps} sub={`+${stats.newApps} periode`} trend={t(stats.newApps, stats.prevApps)} />
        <Kpi label="Candidats" value={stats.totalCandidates} sub={`+${stats.newCandidates} periode`} trend={t(stats.newCandidates, stats.prevCandidates)} />
        <Kpi label="Embauches" value={stats.hiredCount} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Match moyen" value={`${stats.avgMatch}%`} small />
        <Kpi label="Alertes actives" value={stats.activeAlerts} small />
        <Kpi label="Open to work" value={stats.openToWork} small />
        <Kpi label="Anciennete moy." value={`${stats.avgDays}j`} small />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BreakdownCard title="Sources candidatures" data={stats.sources} total={stats.totalApps} />
        <BreakdownCard title="Pipeline" data={stats.pipeline} total={stats.totalApps} />
        <BreakdownCard title="Offres par secteur" data={stats.sectors} total={stats.totalJobs} />
        <BreakdownCard title="Types de contrat" data={stats.contracts} total={stats.totalJobs} />
        <BreakdownCard title="Plans entreprises" data={stats.plans} total={stats.totalCompanies} />
        <BreakdownCard title="Localisation candidats" data={stats.locations} total={stats.totalCandidates} />
      </div>

      {/* Top skills */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
        <h3 className="font-display text-[18px] tracking-[-0.01em] mb-4">Top competences candidats</h3>
        <div className="flex flex-wrap gap-2">
          {stats.topSkills.map(([skill, count]) => (
            <span key={skill} className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 inline-flex items-center gap-2">
              {skill} <span className="font-mono text-[10.5px] text-foreground/40">{count}</span>
            </span>
          ))}
          {stats.topSkills.length === 0 && <span className="text-[13px] text-muted-foreground italic">Aucune competence renseignee.</span>}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, trend, small }: { label: string; value: string | number; sub?: string; trend?: number; small?: boolean }) {
  return (
    <div className={`bg-white border border-[var(--border)] rounded-2xl ${small ? "p-3" : "p-4"} text-center`}>
      <p className={`font-display tracking-[-0.01em] text-foreground ${small ? "text-[20px]" : "text-[26px]"}`}>{value}</p>
      <p className={`text-muted-foreground mt-0.5 ${small ? "text-[10px]" : "text-[10.5px]"}`}>{label}</p>
      {sub && <p className="text-[10px] text-foreground/40 mt-0.5">{sub}</p>}
      {trend !== undefined && trend !== 0 && (
        <p className={`text-[10px] font-mono mt-0.5 inline-flex items-center gap-0.5 ${trend > 0 ? "text-emerald-600" : "text-destructive"}`}>
          {trend > 0 ? <ArrowUp width={9} height={9} strokeWidth={2.5} /> : <ArrowDown width={9} height={9} strokeWidth={2.5} />}
          {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}

function BreakdownCard({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
      <h3 className="font-display text-[18px] tracking-[-0.01em] mb-4">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-[13px] text-muted-foreground italic">Aucune donnee.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map(([key, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[12.5px] text-foreground/70 w-[130px] shrink-0 truncate">{key}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-mono text-foreground/50 w-14 text-right">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
