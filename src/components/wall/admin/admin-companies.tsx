"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building, PlusCircle, SendMail } from "iconoir-react";

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

  // Invite a un recruteur dans une company existante
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  // Cree une nouvelle company + admin par invitation
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanySector, setNewCompanySector] = useState("");
  const [newCompanyPlan, setNewCompanyPlan] = useState("starter");
  const [newCompanyMsg, setNewCompanyMsg] = useState("");
  const [newCompanySubmitting, setNewCompanySubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data: { companies?: Company[] }) => {
        if (cancelled) return;
        setCompanies(data.companies ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePlan = async (id: string, plan: string) => {
    const preset = PLAN_OPTIONS.find((p) => p.value === plan);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, plan }),
    });
    if (res.ok) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                plan,
                jobQuota:
                  preset && preset.quota !== null ? preset.quota : c.jobQuota,
              }
            : c,
        ),
      );
    }
  };

  const updateQuota = async (id: string, quota: number) => {
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, jobQuota: quota }),
    });
    if (res.ok) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, jobQuota: quota } : c)),
      );
    }
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

  const createCompanyAndInvite = async () => {
    if (!newCompanyName.trim() || !newCompanyEmail.trim()) {
      setNewCompanyMsg("Nom de la societe et email requis.");
      return;
    }
    setNewCompanySubmitting(true);
    setNewCompanyMsg("Creation et envoi de l'invitation...");
    try {
      const res = await fetch("/api/admin/companies/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newCompanyName.trim(),
          email: newCompanyEmail.trim(),
          sector: newCompanySector.trim() || undefined,
          plan: newCompanyPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewCompanyMsg(data?.error ?? "Erreur");
        return;
      }
      setNewCompanyMsg(
        data.linked
          ? `Entreprise creee, compte existant rattache directement.`
          : `Entreprise creee, invitation envoyee a ${newCompanyEmail.trim()}${
              data.inviteLink ? " — " + data.inviteLink : ""
            }`,
      );
      setNewCompanyName("");
      setNewCompanyEmail("");
      setNewCompanySector("");
      // Refetch companies
      const refresh = await fetch("/api/admin/companies");
      const j = await refresh.json();
      setCompanies(j.companies ?? []);
    } catch {
      setNewCompanyMsg("Erreur reseau");
    } finally {
      setNewCompanySubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Cree une nouvelle societe + invite l'admin */}
      <div className="bg-white border border-[var(--accent)]/30 rounded-2xl px-5 sm:px-7 py-5 ring-1 ring-[var(--accent)]/10">
        <p className="ed-label-sm text-[var(--accent)] mb-1 inline-flex items-center gap-1.5">
          <Building width={11} height={11} strokeWidth={2.2} /> Nouvelle entreprise
        </p>
        <p className="text-[12.5px] text-foreground/60 mb-3">
          Cree la fiche entreprise et envoie une invitation par email a l&apos;admin
          pour finaliser son inscription.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Nom de la societe"
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] outline-none focus:border-[var(--accent)]"
          />
          <input
            type="email"
            value={newCompanyEmail}
            onChange={(e) => setNewCompanyEmail(e.target.value)}
            placeholder="email du contact admin"
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] outline-none focus:border-[var(--accent)]"
          />
          <input
            type="text"
            value={newCompanySector}
            onChange={(e) => setNewCompanySector(e.target.value)}
            placeholder="Secteur (ex: Banque & Finance)"
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] outline-none focus:border-[var(--accent)]"
          />
          <select
            value={newCompanyPlan}
            onChange={(e) => setNewCompanyPlan(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px]"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                Plan {p.label}
                {p.quota !== null ? ` — ${p.quota} offres` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            type="button"
            onClick={createCompanyAndInvite}
            disabled={newCompanySubmitting}
            className="h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <PlusCircle width={13} height={13} strokeWidth={2} />
            Creer et inviter
          </button>
          {newCompanyMsg && (
            <p className="text-[12px] text-muted-foreground flex-1 break-all">{newCompanyMsg}</p>
          )}
        </div>
      </div>

      {/* Invite recruteur */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-5">
        <p className="ed-label-sm mb-3">Inviter un recruteur dans une entreprise existante</p>
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
