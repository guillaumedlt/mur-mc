"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bag,
  Building,
  Group,
  PlusCircle,
  ViewGrid,
} from "iconoir-react";

const TABS = [
  { href: "/recruteur", label: "Dashboard", icon: ViewGrid, exact: true },
  { href: "/recruteur/offres", label: "Offres & Pipeline", icon: Bag, exact: false },
  { href: "/recruteur/candidats", label: "Candidats", icon: Group, exact: false },
  { href: "/recruteur/equipe", label: "Equipe", icon: Group, exact: true },
  { href: "/recruteur/entreprise", label: "Ma fiche entreprise", icon: Building, exact: true },
  { href: "/recruteur/publier", label: "Publier", icon: PlusCircle, exact: true },
] as const;

export function EmployerTabs() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="bg-white border border-[var(--border)] rounded-2xl px-2 py-1.5 mb-3 sticky top-[68px] z-20 overflow-x-auto wall-scroll [&::-webkit-scrollbar-track]:my-2"
      aria-label="Espace recruteur"
    >
      <ul className="flex items-center gap-1 min-w-max">
        {TABS.map((t) => {
          const active = isActive(t.href, t.exact);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`h-9 px-3 rounded-full text-[12.5px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon width={13} height={13} strokeWidth={2} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
