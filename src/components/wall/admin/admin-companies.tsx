"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building, SendMail } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  jobQuota: number;
  sector: string;
  memberCount: number;
  jobCount: number;
  createdAt: string;
};

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter", quota: 3 },
  { value: "pro", label: "Pro", quota: 6 },
  { value: "business", label: "Business", quota: 10 },
  { value: "custom", label: "Sur mesure", quota: null },
];

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("companies")
      .select("id, name, slug, plan, job_quota, sector, created_at")
      .order("created_at", { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(async ({ data }: { data: any }) => {
        const list: Company[] = [];
        for (const c of data ?? []) {
          const { count: memberCount } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("company_id", c.id);
          const { count: jobCount } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("company_id", c.id)
            .in("status", ["published", "paused"]);
          list.push({
            id: c.id,
            name: c.name,
            slug: c.slug,
            plan: c.plan ?? "starter",
            jobQuota: c.job_quota ?? 3,
            sector: c.sector ?? "",
            memberCount: memberCount ?? 0,
            jobCount: jobCount ?? 0,
            createdAt: c.created_at,
          });
        }
        setCompanies(list);
        setLoading(false);
      });
  }

  const updatePlan = async (id: string, plan: string) => {
    const preset = PLAN_OPTIONS.find((p) => p.value === plan);
    const quota = preset?.quota;
    const supabase = createClient();
    if (quota !== null && quota !== undefined) {
      await supabase.from("companies").update({ plan, job_quota: quota }).eq("id", id);
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, plan, jobQuota: quota } : c));
    } else {
      await supabase.from("companies").update({ plan }).eq("id", id);
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, plan } : c));
    }
  };

  const updateQuota = async (id: string, quota: number) => {
    const supabase = createClient();
    await supabase.from("companies").update({ job_quota: quota }).eq("id", id);
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, jobQuota: quota } : c));
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !inviteCompany) return;
    setInviteMsg("Envoi...");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), teamRole: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteMsg(data?.error ?? "Erreur"); return; }
      setInviteMsg(data.linked ? "Compte lie directement" : `Invitation envoyee${data.inviteLink ? " — " + data.inviteLink : ""}`);
      setInviteEmail("");
    } catch { setInviteMsg("Erreur reseau"); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Invite recruteur */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-5">
        <p className="ed-label-sm mb-3">Inviter un recruteur</p>
        <div className="flex flex-wrap gap-2 items-end">
          <select value={inviteCompany} onChange={(e) => setInviteCompany(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] min-w-[200px]">
            <option value="">Entreprise...</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@entreprise.mc" className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] flex-1 min-w-[200px] outline-none focus:border-[var(--accent)]" />
          <button type="button" onClick={sendInvite} className="h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 inline-flex items-center gap-2">
            <SendMail width={13} height={13} strokeWidth={2} /> Inviter
          </button>
        </div>
        {inviteMsg && <p className="text-[12px] text-muted-foreground mt-2">{inviteMsg}</p>}
      </div>

      {/* Liste des entreprises */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
        <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">Entreprises ({companies.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-[0.06em] text-foreground/50 border-b border-[var(--border)]">
                <th className="pb-2 pr-3">Entreprise</th>
                <th className="pb-2 pr-3">Secteur</th>
                <th className="pb-2 pr-3 text-center">Membres</th>
                <th className="pb-2 pr-3 text-center">Offres</th>
                <th className="pb-2 pr-3">Plan</th>
                <th className="pb-2 pr-3">Quota</th>
                <th className="pb-2">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 pr-3">
                    <Link href={`/entreprises/${c.slug}`} target="_blank" className="font-medium text-foreground hover:text-[var(--accent)] inline-flex items-center gap-1">
                      {c.name} <ArrowUpRight width={10} height={10} strokeWidth={2.2} className="text-foreground/30" />
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-foreground/65">{c.sector}</td>
                  <td className="py-3 pr-3 text-center font-mono">{c.memberCount}</td>
                  <td className="py-3 pr-3 text-center font-mono">{c.jobCount}</td>
                  <td className="py-3 pr-3">
                    <select
                      value={c.plan}
                      onChange={(e) => updatePlan(c.id, e.target.value)}
                      className="h-8 px-2 rounded-lg border border-[var(--border)] bg-white text-[12px]"
                    >
                      {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    {c.plan === "custom" ? (
                      <input
                        type="number"
                        min={1}
                        value={c.jobQuota}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0) updateQuota(c.id, v);
                        }}
                        className="h-8 w-16 px-2 rounded-lg border border-[var(--border)] bg-white text-[12px] font-mono text-center outline-none focus:border-[var(--accent)]"
                      />
                    ) : (
                      <span className="font-mono text-[12px] text-foreground/60">{c.jobQuota}</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-foreground/50">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
