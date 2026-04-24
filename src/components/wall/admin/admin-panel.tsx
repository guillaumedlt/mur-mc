"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { AdminCompanies } from "./admin-companies";
import { AdminCVTech } from "./admin-cvtech";
import { AdminContacts } from "./admin-contacts";

const ADMIN_EMAILS = ["delachetg@gmail.com"];

type Tab = "companies" | "cvtech" | "contacts";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "companies", label: "Entreprises" },
  { key: "cvtech", label: "CVTech" },
  { key: "contacts", label: "Demandes" },
];

export function AdminPanel() {
  const user = useUser();
  const [tab, setTab] = useState<Tab>("companies");

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
      <div className="max-w-[1200px] mx-auto">
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 mb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="ed-label-sm text-destructive">Admin Mur.mc</p>
              <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
                Panel d&apos;administration
              </h1>
            </div>
            <div className="flex rounded-full border border-[var(--border)] bg-[var(--background-alt)]/60 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`h-9 px-4 rounded-full text-[12.5px] font-medium transition-colors ${
                    tab === t.key
                      ? "bg-foreground text-background"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {tab === "companies" && <AdminCompanies />}
        {tab === "cvtech" && <AdminCVTech />}
        {tab === "contacts" && <AdminContacts />}
      </div>
    </div>
  );
}
