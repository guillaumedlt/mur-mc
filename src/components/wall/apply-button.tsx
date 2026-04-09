"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bag, Building, Lock } from "iconoir-react";
import type { Job } from "@/lib/data";
import { useUser } from "@/lib/auth";
import { useCandidate } from "@/lib/candidate-store";
import { ApplyModal } from "./apply-modal";

type Props = { job: Job };

/**
 * Bouton "Postuler" qui s'adapte au rôle. Côté candidat, ouvre une modale
 * de confirmation avec lettre de motivation optionnelle.
 */
export function ApplyButton({ job }: Props) {
  const user = useUser();
  const { applications } = useCandidate();
  const [open, setOpen] = useState(false);

  const existing = applications.find((a) => a.jobId === job.id);

  if (!user) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/connexion"
          className="w-full h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
        >
          <Lock width={13} height={13} strokeWidth={2} />
          Se connecter pour postuler
        </Link>
        <p className="text-[11.5px] text-center text-foreground/55">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="text-[var(--accent)] hover:underline underline-offset-2"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    );
  }

  if (user.role === "employer") {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)] p-3 text-center">
        <Building
          width={16}
          height={16}
          strokeWidth={2}
          className="text-foreground/60 inline-block"
        />
        <p className="text-[12px] text-foreground/70 mt-1.5 leading-snug">
          Tu es connecté côté recruteur. Postuler n&apos;est pas disponible
          depuis ce compte.
        </p>
        <Link
          href="/recruteur"
          className="inline-block mt-2 text-[12px] text-[var(--accent)] hover:underline underline-offset-2"
        >
          Mon dashboard →
        </Link>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.05] p-4 text-center">
        <BadgeCheck
          width={20}
          height={20}
          strokeWidth={2}
          className="text-[var(--accent)] inline-block"
        />
        <p className="text-[13px] text-foreground mt-2 font-medium">
          Tu as déjà postulé
        </p>
        <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
          Statut actuel :{" "}
          <span className="text-foreground font-medium">
            {statusLabelFr(existing.status)}
          </span>
        </p>
        <Link
          href={`/candidat/candidatures/${existing.id}`}
          className="inline-block mt-2 text-[12px] text-[var(--accent)] hover:underline underline-offset-2"
        >
          Voir le suivi →
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
      >
        <Bag width={13} height={13} strokeWidth={2} />
        Postuler en un clic
      </button>
      <ApplyModal
        job={job}
        user={user}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function statusLabelFr(s: string): string {
  if (s === "sent") return "Envoyée";
  if (s === "viewed") return "CV consulté";
  if (s === "interview") return "En entretien";
  if (s === "accepted") return "Acceptée";
  if (s === "rejected") return "Refusée";
  return s;
}
