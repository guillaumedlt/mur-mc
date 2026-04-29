"use client";

import { useEffect, useState } from "react";
import { SendMail } from "iconoir-react";

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

export function AdminContacts() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((data: { requests?: ContactRequest[] }) => {
        if (cancelled) return;
        setRequests(data.requests ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };

  const convertToClient = async (req: ContactRequest) => {
    if (
      !window.confirm(
        `Convertir "${req.companyName}" en client ?\n\nCela va creer la fiche entreprise et envoyer un email d'invitation a ${req.email} pour qu'il puisse creer son compte admin.`,
      )
    ) {
      return;
    }
    setPendingId(req.id);
    setFlashMsg(null);
    try {
      const res = await fetch("/api/admin/companies/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: req.companyName,
          email: req.email,
          plan: req.plan,
          fromContactRequestId: req.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlashMsg(`Erreur : ${data?.error ?? "inconnue"}`);
        return;
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "converted" } : r)),
      );
      setFlashMsg(
        data.linked
          ? `${req.companyName} cree, compte existant rattache directement.`
          : `${req.companyName} cree. Invitation envoyee a ${req.email}${
              data.inviteLink ? " — " + data.inviteLink : ""
            }`,
      );
    } catch {
      setFlashMsg("Erreur reseau");
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6">
      <h2 className="font-display text-[20px] tracking-[-0.01em] mb-1">Demandes recruteurs ({requests.length})</h2>
      <p className="text-[12.5px] text-muted-foreground mb-4">
        Cliquer sur <strong>Convertir en client</strong> cree la fiche entreprise et
        envoie un email d&apos;invitation pour creer le compte admin.
      </p>
      {flashMsg && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-[var(--accent)]/[0.04] border border-[var(--accent)]/20 text-[12.5px] text-foreground/85 break-all">
          {flashMsg}
        </div>
      )}
      {requests.length === 0 ? (
        <p className="text-[13px] text-muted-foreground italic">Aucune demande.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-[0.06em] text-foreground/50 border-b border-[var(--border)]">
                <th className="pb-2 pr-3">Entreprise</th>
                <th className="pb-2 pr-3">Contact</th>
                <th className="pb-2 pr-3">Email</th>
                <th className="pb-2 pr-3">Forfait</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Statut</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{r.companyName}</td>
                  <td className="py-2.5 pr-3 text-foreground/75">{r.contactName}</td>
                  <td className="py-2.5 pr-3 text-foreground/75 font-mono text-[12px]">{r.email}</td>
                  <td className="py-2.5 pr-3">{r.plan}</td>
                  <td className="py-2.5 pr-3 font-mono text-[11px] text-foreground/50">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`h-5 px-2 rounded-full text-[10px] font-semibold uppercase inline-flex items-center ${
                      r.status === "new" ? "bg-amber-100 text-amber-800" :
                      r.status === "contacted" ? "bg-blue-100 text-blue-800" :
                      r.status === "converted" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r.status !== "converted" && (
                        <button
                          type="button"
                          onClick={() => convertToClient(r)}
                          disabled={pendingId === r.id}
                          className="h-7 px-2.5 rounded-full bg-foreground text-background text-[11px] font-medium hover:bg-foreground/85 disabled:opacity-60 inline-flex items-center gap-1"
                        >
                          <SendMail width={10} height={10} strokeWidth={2.2} />
                          {pendingId === r.id ? "Envoi..." : "Convertir en client"}
                        </button>
                      )}
                      {r.status === "new" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(r.id, "contacted")}
                          className="h-6 px-2 rounded-md bg-blue-50 text-blue-700 text-[10.5px] font-medium"
                        >
                          Contacte
                        </button>
                      )}
                      {r.status !== "converted" && r.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(r.id, "rejected")}
                          className="h-6 px-2 rounded-md bg-red-50 text-red-700 text-[10.5px] font-medium"
                        >
                          Rejeter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
