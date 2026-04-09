"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Group,
  Mail,
  PlusCircle,
  Trash,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type TeamMember,
  type TeamRole,
  addTeamMember,
  removeTeamMember,
  teamRoleLabel,
  updateTeamMember,
  useEmployer,
} from "@/lib/employer-store";

export function TeamManagement() {
  const user = useUser();
  const { team } = useEmployer();
  const [adding, setAdding] = useState(false);

  if (!user || user.role !== "employer") return null;

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="ed-label-sm">Mon équipe</p>
            <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Gestion de l&apos;équipe
            </h1>
            <p className="text-[13.5px] text-muted-foreground mt-2">
              {team.length} membre{team.length > 1 ? "s" : ""} ont accès à
              l&apos;espace recruteur de votre entreprise.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-10 px-3 sm:px-4 rounded-full bg-foreground text-background text-[12.5px] sm:text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2 shrink-0"
          >
            <PlusCircle width={14} height={14} strokeWidth={2} />
            Inviter
          </button>
        </div>
      </header>

      {/* Roles explained */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 mb-3">
        <p className="ed-label-sm mb-3">Rôles disponibles</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RoleCard
            role="admin"
            description="Accès complet. Peut gérer l'équipe, les offres, les candidats et la fiche entreprise."
          />
          <RoleCard
            role="recruiter"
            description="Peut gérer les offres et les candidats. Ne peut pas modifier l'équipe ni la fiche entreprise."
          />
          <RoleCard
            role="viewer"
            description="Accès en lecture seule. Peut consulter les offres, les candidats et les statistiques."
          />
        </div>
      </div>

      {/* Team list */}
      <div className="bg-white border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
        {team.map((m) => (
          <MemberRow key={m.id} member={m} isCurrentUser={m.id === "team-1"} />
        ))}
      </div>

      {/* Add member modal */}
      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function RoleCard({
  role,
  description,
}: {
  role: TeamRole;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)]/40 p-3.5">
      <div className="text-[12.5px] font-semibold text-foreground">
        {teamRoleLabel(role)}
      </div>
      <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
        {description}
      </p>
    </div>
  );
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: TeamMember;
  isCurrentUser: boolean;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-4 hover:bg-[var(--background-alt)]/40 transition-colors">
      <span
        className="size-10 rounded-xl flex items-center justify-center text-white font-display text-[13px] font-medium ring-1 ring-black/5 shrink-0"
        style={{
          background: `linear-gradient(155deg, ${member.avatarColor}, #122a3f)`,
        }}
        aria-hidden
      >
        {member.initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-foreground">
            {member.fullName}
          </span>
          {isCurrentUser && (
            <span className="text-[10.5px] text-[var(--tertiary-foreground)]">
              (vous)
            </span>
          )}
        </div>
        <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
          <Mail width={10} height={10} strokeWidth={2} />
          {member.email}
        </div>
      </div>

      <select
        value={member.role}
        onChange={(e) =>
          updateTeamMember(member.id, { role: e.target.value as TeamRole })
        }
        disabled={isCurrentUser}
        className="wall-select-pill disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Rôle"
      >
        <option value="admin">Admin</option>
        <option value="recruiter">Recruteur</option>
        <option value="viewer">Lecteur</option>
      </select>

      {member.lastActiveAt && (
        <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] hidden md:block w-16 text-right">
          {formatRelative(member.lastActiveAt)}
        </span>
      )}

      {!isCurrentUser && (
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm(`Retirer ${member.fullName} de l'équipe ?`)
            ) {
              removeTeamMember(member.id);
            }
          }}
          className="size-8 rounded-full border border-[var(--border)] bg-white text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center shrink-0"
          aria-label={`Retirer ${member.fullName}`}
        >
          <Trash width={12} height={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("recruiter");
  const [done, setDone] = useState(false);

  const palette = ["#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e", "#6B4423"];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const nameParts = name.trim().split(/\s+/);
    addTeamMember({
      fullName: name.trim(),
      email: email.trim(),
      role,
      avatarColor: palette[Math.floor(Math.random() * palette.length)],
      initials:
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : name.trim().slice(0, 2).toUpperCase(),
    });
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="px-7 py-10 text-center">
            <BadgeCheck
              width={24}
              height={24}
              strokeWidth={2}
              className="text-[var(--accent)] inline-block"
            />
            <p className="text-[15px] font-medium text-foreground mt-3">
              Invitation envoyée
            </p>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              {email} recevra un email pour rejoindre l&apos;équipe (démo).
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 mt-5 rounded-full bg-foreground text-background text-[12.5px] font-medium"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Group width={14} height={14} strokeWidth={2} />
                <span className="text-[14px] font-medium text-foreground">
                  Inviter un membre
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
                aria-label="Fermer"
              >
                <Xmark width={13} height={13} strokeWidth={2.2} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sophie Martin"
                  required
                  className="wall-input h-10 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.martin@montecarlosbm.com"
                  required
                  className="wall-input h-10 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Rôle
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="wall-select h-10"
                >
                  <option value="admin">Admin — accès complet</option>
                  <option value="recruiter">
                    Recruteur — offres & candidats
                  </option>
                  <option value="viewer">Lecteur — consultation uniquement</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--background-alt)]/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-[12.5px] text-foreground/65 hover:text-foreground transition-colors px-3"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors"
              >
                Envoyer l&apos;invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "auj.";
  if (diff === 1) return "hier";
  if (diff < 7) return `${diff}j`;
  return `${Math.round(diff / 7)}sem`;
}
