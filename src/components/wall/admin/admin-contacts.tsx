"use client";

import { useEffect, useState } from "react";

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

  if (loading) {
    return <div className="flex justify-center py-12"><span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6">
      <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">Demandes recruteurs ({requests.length})</h2>
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
                    <div className="flex items-center gap-1">
                      {r.status === "new" && <button type="button" onClick={() => updateStatus(r.id, "contacted")} className="h-6 px-2 rounded-md bg-blue-50 text-blue-700 text-[10.5px] font-medium">Contacte</button>}
                      {r.status !== "converted" && <button type="button" onClick={() => updateStatus(r.id, "converted")} className="h-6 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-medium">Converti</button>}
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
