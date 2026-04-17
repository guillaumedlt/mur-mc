"use client";

import { useState } from "react";
import { Check, SendMail } from "iconoir-react";

type Props = {
  /** Texte affiché : "Recevez les offres de [label] par email" */
  label: string;
  keywords?: string[];
  sector?: string;
  contractType?: string;
  /** Email pre-rempli si user connecte */
  defaultEmail?: string;
};

export function JobAlertForm({
  label,
  keywords,
  sector,
  contractType,
  defaultEmail,
}: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (status === "done") {
    return (
      <div className="flex items-center gap-2.5 text-[13px] text-emerald-700">
        <span className="size-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check width={13} height={13} strokeWidth={2.4} />
        </span>
        Alerte creee — vous recevrez les nouvelles offres par email.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          keywords: keywords?.length ? keywords : undefined,
          sector: sector || undefined,
          contractType: contractType || undefined,
          frequency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error ?? "Erreur");
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
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px] text-foreground/60">
        <SendMail width={13} height={13} strokeWidth={2} />
        <span>Recevez les offres de <strong className="text-foreground/80">{label}</strong> par email</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-white text-[13px] outline-none focus:border-[var(--accent)] flex-1 min-w-[200px]"
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
          className="h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/70"
        >
          <option value="daily">Quotidien</option>
          <option value="weekly">Hebdomadaire</option>
        </select>
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
        >
          {status === "loading" && (
            <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          )}
          Creer l&apos;alerte
        </button>
      </div>
      {status === "error" && (
        <p className="text-[12px] text-destructive">{errorMsg}</p>
      )}
      <p className="text-[10.5px] text-foreground/40">
        Desabonnement en un clic dans chaque email. Pas de spam.
      </p>
    </form>
  );
}
