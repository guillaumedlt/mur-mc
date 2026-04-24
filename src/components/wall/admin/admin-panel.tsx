"use client";

import { useState } from "react";
import { BadgeCheck, Building, Check, Copy, Mail, SendMail, Sparks, Trash, Xmark } from "iconoir-react";
import { useUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["delachetg@gmail.com"];

type ContactRequest = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  message: string | null;
  plan: string;
  status: string;
  createdAt: string;
};

type Company = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  jobQuota: number;
};

export function AdminPanel() {
  const user = useUser();

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-[440px] text-center">
          <h1 className="font-display text-[28px] text-foreground">Acces refuse</h1>
          <p className="text-[14px] text-muted-foreground mt-2">Cette page est reservee aux administrateurs Mur.mc.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-[1100px] mx-auto">
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 mb-3">
          <p className="ed-label-sm text-destructive">Admin Mur.mc</p>
          <h1 className="font-display text-[28px] tracking-[-0.015em] text-foreground mt-1">
            Panel d&apos;administration
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ContactRequests />
          <CompanyManager />
        </div>
      </div>
    </div>
  );
}

function ContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRequests(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).map((r: any) => ({
            id: r.id,
            companyName: r.company_name,
            contactName: r.contact_name,
            email: r.email,
            phone: r.phone,
            message: r.message,
            plan: r.plan,
            status: r.status,
            createdAt: r.created_at,
          })),
        );
        setLoading(false);
      });
  }

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from("contact_requests").update({ status }).eq("id", id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
      <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
        Demandes recruteurs
      </h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-[13px] text-muted-foreground italic">Aucune demande.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">{r.companyName}</p>
                  <p className="text-[12px] text-muted-foreground">{r.contactName} · {r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                  <p className="text-[11px] text-foreground/50 mt-1">Forfait: {r.plan} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                  {r.message && <p className="text-[12px] text-foreground/70 mt-1 italic">{r.message}</p>}
                </div>
                <span className={`shrink-0 h-6 px-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.05em] inline-flex items-center ${
                  r.status === "new" ? "bg-amber-100 text-amber-800" :
                  r.status === "contacted" ? "bg-blue-100 text-blue-800" :
                  r.status === "converted" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {r.status === "new" && (
                  <button type="button" onClick={() => updateStatus(r.id, "contacted")} className="h-7 px-2.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100">
                    Contacte
                  </button>
                )}
                {(r.status === "new" || r.status === "contacted") && (
                  <button type="button" onClick={() => updateStatus(r.id, "converted")} className="h-7 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100">
                    Converti
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button type="button" onClick={() => updateStatus(r.id, "rejected")} className="h-7 px-2.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-medium hover:bg-red-100">
                    Rejete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompanyManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [inviteLink, setInviteLink] = useState("");

  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("companies")
      .select("id, name, slug, plan, job_quota")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCompanies(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            plan: c.plan ?? "starter",
            jobQuota: c.job_quota ?? 3,
          })),
        );
        setLoading(false);
      });
  }

  const updatePlan = async (id: string, plan: string) => {
    const quotaMap: Record<string, number> = { starter: 3, pro: 6, business: 10, custom: 999 };
    const supabase = createClient();
    await supabase.from("companies").update({ plan, job_quota: quotaMap[plan] ?? 3 }).eq("id", id);
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, plan, jobQuota: quotaMap[plan] ?? 3 } : c)));
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !inviteCompany) return;
    setInviteStatus("loading");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), teamRole: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus("error");
        return;
      }
      if (data.inviteLink) setInviteLink(data.inviteLink);
      setInviteStatus("done");
    } catch {
      setInviteStatus("error");
    }
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 py-6">
      <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
        Entreprises
      </h2>

      {/* Invite form */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)]/40 p-3 mb-4">
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60 mb-2">Inviter un recruteur</p>
        <div className="flex flex-col gap-2">
          <select value={inviteCompany} onChange={(e) => setInviteCompany(e.target.value)} className="h-9 px-3 rounded-lg border border-[var(--border)] bg-white text-[12.5px]">
            <option value="">Choisir une entreprise</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@entreprise.mc" className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] bg-white text-[12.5px] outline-none" />
            <button type="button" onClick={sendInvite} disabled={inviteStatus === "loading"} className="h-9 px-3 rounded-lg bg-foreground text-background text-[12px] font-medium">
              Inviter
            </button>
          </div>
          {inviteStatus === "done" && (
            <p className="text-[11px] text-emerald-600">Invitation envoyee{inviteLink ? ` — lien: ${inviteLink}` : ""}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.plan} · {c.jobQuota} offres max</p>
              </div>
              <select
                value={c.plan}
                onChange={(e) => updatePlan(c.id, e.target.value)}
                className="h-8 px-2 rounded-lg border border-[var(--border)] bg-white text-[11.5px]"
              >
                <option value="starter">Starter (3)</option>
                <option value="pro">Pro (6)</option>
                <option value="business">Business (10)</option>
                <option value="custom">Sur mesure</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
