"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  SortDown,
} from "iconoir-react";
import { createClient } from "@/lib/supabase/client";

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
  sectors: string[];
  experienceYears: number | null;
  cvUrl: string | null;
  cvFileName: string | null;
  linkedinUrl: string | null;
  openToWork: boolean;
  applicationCount: number;
  createdAt: string;
};

type SortKey = "recent" | "name" | "applications" | "experience";

export function AdminCVTech() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*, applications(count)")
      .eq("role", "candidate")
      .order("created_at", { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        setCandidates(
          (data ?? []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => ({
              id: p.id,
              fullName: p.full_name ?? "",
              email: p.email ?? "",
              phone: p.phone ?? null,
              location: p.location ?? null,
              headline: p.headline ?? null,
              bio: p.bio ?? null,
              skills: p.skills ?? [],
              languages: p.languages ?? [],
              sectors: p.sectors ?? [],
              experienceYears: p.experience_years ?? null,
              cvUrl: p.cv_url ?? null,
              cvFileName: p.cv_file_name ?? null,
              linkedinUrl: p.linkedin_url ?? null,
              openToWork: p.open_to_work ?? false,
              applicationCount:
                Array.isArray(p.applications) && p.applications.length > 0
                  ? p.applications[0]?.count ?? 0
                  : 0,
              createdAt: p.created_at,
            }),
          ),
        );
        setLoading(false);
      });
  }

  // All unique skills and languages for filters
  const allSkills = useMemo(() => {
    const s = new Set<string>();
    for (const c of candidates) for (const sk of c.skills) s.add(sk);
    return Array.from(s).sort();
  }, [candidates]);

  const allLangs = useMemo(() => {
    const s = new Set<string>();
    for (const c of candidates) for (const l of c.languages) s.add(l);
    return Array.from(s).sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = candidates;

    if (q) {
      list = list.filter((c) => {
        const hay = `${c.fullName} ${c.headline ?? ""} ${c.email} ${c.skills.join(" ")} ${c.bio ?? ""} ${c.location ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (skillFilter) list = list.filter((c) => c.skills.includes(skillFilter));
    if (langFilter) list = list.filter((c) => c.languages.includes(langFilter));

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.fullName.localeCompare(b.fullName);
      if (sort === "applications") return b.applicationCount - a.applicationCount;
      if (sort === "experience") return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [candidates, query, skillFilter, langFilter, sort]);

  const exportCSV = () => {
    const header = "Nom,Email,Telephone,Localisation,Poste,Competences,Langues,Experience (ans),CV,LinkedIn,Open to work,Candidatures,Inscrit le";
    const rows = filtered.map((c) =>
      [
        c.fullName, c.email, c.phone ?? "", c.location ?? "",
        c.headline ?? "", c.skills.join("; "), c.languages.join("; "),
        c.experienceYears ?? "", c.cvUrl ?? "", c.linkedinUrl ?? "",
        c.openToWork ? "Oui" : "Non", c.applicationCount,
        new Date(c.createdAt).toLocaleDateString("fr-FR"),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mur-mc-cvtech-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6">
      {/* Header + search + filters */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-display text-[20px] tracking-[-0.01em]">
          CVTech ({filtered.length} / {candidates.length} candidats)
        </h2>
        <button
          type="button"
          onClick={exportCSV}
          className="h-9 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] font-medium text-foreground/80 hover:border-foreground/30 inline-flex items-center gap-1.5"
        >
          <Download width={12} height={12} strokeWidth={2} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--accent)] flex-1 min-w-[220px]">
          <Search width={14} height={14} strokeWidth={2} className="text-foreground/40 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un candidat (nom, competence, poste...)"
            className="flex-1 bg-transparent outline-none text-[13px]"
          />
        </div>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[12.5px]">
          <option value="">Toutes les competences</option>
          {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[12.5px]">
          <option value="">Toutes les langues</option>
          {allLangs.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[12.5px]">
          <option value="recent">Plus recents</option>
          <option value="name">Nom A-Z</option>
          <option value="applications">Plus de candidatures</option>
          <option value="experience">Plus d&apos;experience</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-[13px] text-muted-foreground italic py-8 text-center">Aucun candidat ne correspond a ces criteres.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-[0.06em] text-foreground/50 border-b border-[var(--border)]">
                <th className="pb-2 pr-3">Candidat</th>
                <th className="pb-2 pr-3">Poste</th>
                <th className="pb-2 pr-3">Competences</th>
                <th className="pb-2 pr-3">Langues</th>
                <th className="pb-2 pr-3 text-center">Exp.</th>
                <th className="pb-2 pr-3 text-center">Cand.</th>
                <th className="pb-2 pr-3">CV</th>
                <th className="pb-2">Inscrit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background-alt)]/40 cursor-pointer"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      {c.openToWork && <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="Open to work" />}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[180px]">{c.fullName}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-foreground/75 max-w-[160px] truncate">{c.headline ?? "—"}</td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.skills.slice(0, 3).map((s) => (
                        <span key={s} className="h-5 px-1.5 rounded bg-[var(--background-alt)] text-[10px] text-foreground/70 inline-flex items-center">{s}</span>
                      ))}
                      {c.skills.length > 3 && <span className="text-[10px] text-foreground/40">+{c.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-[12px] text-foreground/65">{c.languages.join(", ") || "—"}</td>
                  <td className="py-3 pr-3 text-center font-mono">{c.experienceYears ?? "���"}</td>
                  <td className="py-3 pr-3 text-center font-mono">{c.applicationCount}</td>
                  <td className="py-3 pr-3">
                    {c.cvUrl ? (
                      <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline text-[11px]" onClick={(e) => e.stopPropagation()}>
                        {c.cvFileName ?? "CV"}
                      </a>
                    ) : (
                      <span className="text-[11px] text-foreground/30">—</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-foreground/50">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (() => {
        const c = candidates.find((x) => x.id === expanded);
        if (!c) return null;
        return (
          <div className="mt-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.02] p-5">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h3 className="font-display text-[20px] text-foreground">{c.fullName}</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">{c.headline ?? "Candidat"}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.openToWork && <span className="h-6 px-2.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-semibold uppercase inline-flex items-center">Open to work</span>}
                {c.linkedinUrl && (
                  <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg border border-[var(--border)] bg-white text-[12px] inline-flex items-center gap-1 hover:border-foreground/30">
                    LinkedIn <ArrowUpRight width={10} height={10} strokeWidth={2.2} />
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[13px]">
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50 mb-1">Contact</p>
                <div className="flex flex-col gap-1 text-foreground/80">
                  <span className="inline-flex items-center gap-1.5"><Mail width={12} height={12} strokeWidth={2} />{c.email}</span>
                  {c.phone && <span className="inline-flex items-center gap-1.5"><Phone width={12} height={12} strokeWidth={2} />{c.phone}</span>}
                  {c.location && <span className="inline-flex items-center gap-1.5"><MapPin width={12} height={12} strokeWidth={2} />{c.location}</span>}
                </div>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50 mb-1">Competences</p>
                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s) => (
                    <span key={s} className="h-6 px-2 rounded-full bg-[var(--background-alt)] border border-[var(--border)] text-[11px] text-foreground/80 inline-flex items-center">{s}</span>
                  ))}
                  {c.skills.length === 0 && <span className="text-[12px] text-foreground/40 italic">Non renseigne</span>}
                </div>
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50 mb-1">Langues & experience</p>
                <p className="text-foreground/80">{c.languages.join(", ") || "Non renseigne"}</p>
                <p className="text-foreground/80 mt-1">{c.experienceYears ? `${c.experienceYears} ans d'experience` : "Non renseigne"}</p>
              </div>
            </div>

            {c.bio && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/50 mb-1">Bio</p>
                <p className="text-[13px] text-foreground/80 leading-[1.7] whitespace-pre-line">{c.bio}</p>
              </div>
            )}

            {c.cvUrl && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] font-medium inline-flex items-center gap-2 hover:border-foreground/30">
                  <Download width={12} height={12} strokeWidth={2} /> Telecharger {c.cvFileName ?? "le CV"}
                </a>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
