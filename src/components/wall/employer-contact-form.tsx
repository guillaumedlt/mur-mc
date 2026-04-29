"use client";

import { useState } from "react";
import { BadgeCheck, Building, Mail, Phone, SendMail } from "iconoir-react";

const PLANS = [
  { value: "starter", label: "Starter", desc: "3 annonces", price: "Gratuit" },
  { value: "pro", label: "Pro", desc: "6 annonces", price: "Sur devis" },
  { value: "business", label: "Business", desc: "10 annonces", price: "Sur devis" },
  { value: "custom", label: "Sur mesure", desc: "Illimite", price: "Sur devis" },
];

export function EmployerContactForm({ defaultPlan }: { defaultPlan?: string }) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState(defaultPlan || "starter");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (status === "done") {
    return (
      <div className="text-center py-12">
        <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center">
          <BadgeCheck width={26} height={26} strokeWidth={2} />
        </span>
        <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-4">
          Demande envoyee
        </h2>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-md mx-auto">
          Nous avons bien recu votre demande. Un membre de l&apos;equipe Monte Carlo Work
          vous contactera sous 24h pour activer votre espace recruteur.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, phone, message, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "Erreur");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Erreur reseau");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Nom de l&apos;entreprise *
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--accent)]">
            <Building width={14} height={14} strokeWidth={2} className="text-foreground/40 shrink-0" />
            <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex. SBM Monaco" className="flex-1 bg-transparent outline-none text-[13.5px]" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Votre nom *
          </label>
          <input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Prenom Nom" className="h-11 px-3.5 rounded-xl border border-[var(--border)] bg-white text-[13.5px] outline-none focus:border-[var(--accent)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Email professionnel *
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--accent)]">
            <Mail width={14} height={14} strokeWidth={2} className="text-foreground/40 shrink-0" />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.mc" className="flex-1 bg-transparent outline-none text-[13.5px]" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
            Telephone
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--accent)]">
            <Phone width={14} height={14} strokeWidth={2} className="text-foreground/40 shrink-0" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+377 ..." className="flex-1 bg-transparent outline-none text-[13.5px]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
          Forfait souhaite
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLANS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlan(p.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                plan === p.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/[0.04] ring-2 ring-[var(--accent)]/20"
                  : "border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              <p className="text-[13px] font-medium text-foreground">{p.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
              <p className="text-[11px] font-mono text-foreground/50 mt-1">{p.price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
          Message <span className="text-[var(--tertiary-foreground)] normal-case tracking-normal font-normal">· facultatif</span>
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Vos besoins, nombre de postes a pourvoir, questions..." className="px-3.5 py-3 rounded-xl border border-[var(--border)] bg-white text-[13px] outline-none focus:border-[var(--accent)] resize-y" />
      </div>

      {status === "error" && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
        ) : (
          <SendMail width={15} height={15} strokeWidth={2} />
        )}
        {status === "loading" ? "Envoi..." : "Envoyer ma demande"}
      </button>

      <p className="text-[11px] text-foreground/40 text-center">
        Un membre de l&apos;equipe Monte Carlo Work vous contactera sous 24h. Les candidats peuvent s&apos;inscrire directement.
      </p>
    </form>
  );
}
