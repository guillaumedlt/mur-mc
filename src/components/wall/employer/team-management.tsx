"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  Group,
  Mail,
  PlusCircle,
  Trash,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  useMyTeam,
  updateMemberRole,
  removeMemberFromCompany,
  inviteTeamMember,
  revokeInvitation,
} from "@/lib/supabase/use-my-team";

type TeamRole = "admin" | "recruiter" | "viewer";

function teamRoleLabel(r: TeamRole): string {
  switch (r) {
    case "admin": return "Admin";
    case "recruiter": return "Recruteur";
    case "viewer": return "Lecteur";
  }
}

export function TeamManagement() {
  const user = useUser();
  const { members, invitations, loading, refetch } = useMyTeam();
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user || user.role !== "employer") return null;

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="ed-label-sm">Mon equipe</p>
            <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Gestion de l&apos;equipe
            </h1>
            <p className="text-[13.5px] text-muted-foreground mt-2">
              {members.length} membre{members.length > 1 ? "s" : ""}
              {invitations.length > 0 && ` · ${invitations.length} invitation${invitations.length > 1 ? "s" : ""} en attente`}
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

      {/* Roles */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 mb-3">
        <p className="ed-label-sm mb-3">Roles disponibles</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RoleCard
            role="admin"
            description="Acces complet. Peut gerer l'equipe, les offres, les candidats et la fiche entreprise."
          />
          <RoleCard
            role="recruiter"
            description="Peut gerer les offres et les candidats. Ne peut pas modifier l'equipe."
          />
          <RoleCard
            role="viewer"
            description="Acces en lecture seule. Peut consulter les offres et les candidats."
          />
        </div>
      </div>

      {/* Team list */}
      <div className="bg-white border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
        {members.length === 0 && invitations.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-muted-foreground">
              Aucun membre dans l&apos;equipe.
            </p>
          </div>
        ) : (
          <>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isCurrentUser={m.id === user.id}
                onRoleChange={async (role) => {
                  setActionError(null);
                  const res = await updateMemberRole(m.id, role);
                  if (!res.ok) {
                    setActionError(res.error ?? "Erreur lors du changement de role");
                    return;
                  }
                  refetch();
                }}
                onRemove={async () => {
                  setActionError(null);
                  const res = await removeMemberFromCompany(m.id);
                  if (!res.ok) {
                    setActionError(res.error ?? "Erreur lors du retrait du membre");
                    return;
                  }
                  refetch();
                }}
              />
            ))}
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                onRevoke={async () => {
                  setActionError(null);
                  const res = await revokeInvitation(inv.id);
                  if (!res.ok) {
                    setActionError(res.error ?? "Erreur lors de la revocation");
                    return;
                  }
                  refetch();
                }}
              />
            ))}
          </>
        )}
      </div>

      {actionError && (
        <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-[12.5px] text-destructive">
          {actionError}
        </div>
      )}

      {/* Add member modal */}
      {adding && (
        <InviteModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function RoleCard({ role, description }: { role: TeamRole; description: string }) {
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
  onRoleChange,
  onRemove,
}: {
  member: { id: string; fullName: string; email: string; teamRole: TeamRole; avatarColor: string; initials: string; createdAt: string };
  isCurrentUser: boolean;
  onRoleChange: (role: TeamRole) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-4 hover:bg-[var(--background-alt)]/40 transition-colors">
      <span
        className="size-10 rounded-xl flex items-center justify-center text-white font-display text-[13px] font-medium ring-1 ring-black/5 shrink-0"
        style={{ background: `linear-gradient(155deg, ${member.avatarColor}, #122a3f)` }}
        aria-hidden
      >
        {member.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-foreground">{member.fullName}</span>
          {isCurrentUser && (
            <span className="text-[10.5px] text-[var(--tertiary-foreground)]">(vous)</span>
          )}
        </div>
        <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
          <Mail width={10} height={10} strokeWidth={2} />
          {member.email}
        </div>
      </div>
      <select
        value={member.teamRole}
        onChange={(e) => onRoleChange(e.target.value as TeamRole)}
        disabled={isCurrentUser}
        className="wall-select-pill disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Role"
      >
        <option value="admin">Admin</option>
        <option value="recruiter">Recruteur</option>
        <option value="viewer">Lecteur</option>
      </select>
      <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] hidden md:block w-24 text-right">
        Depuis {formatDate(member.createdAt)}
      </span>
      {!isCurrentUser && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Retirer ${member.fullName} de l'equipe ?`)) onRemove();
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

function InvitationRow({
  invitation,
  onRevoke,
}: {
  invitation: { id: string; email: string; teamRole: TeamRole; createdAt: string };
  onRevoke: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-4 bg-[var(--background-alt)]/20">
      <span className="size-10 rounded-xl bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center text-foreground/40 shrink-0">
        <Clock width={16} height={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-foreground/70">{invitation.email}</span>
          <span className="h-5 px-2 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-[0.06em] inline-flex items-center">
            En attente
          </span>
        </div>
        <div className="text-[12px] text-muted-foreground">
          Invite en tant que {teamRoleLabel(invitation.teamRole)} · {formatDate(invitation.createdAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Revoquer cette invitation ?")) onRevoke();
        }}
        className="size-8 rounded-full border border-[var(--border)] bg-white text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center shrink-0"
        aria-label="Revoquer"
      >
        <Trash width={12} height={12} strokeWidth={2} />
      </button>
    </div>
  );
}

function InviteModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("recruiter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wasLinked, setWasLinked] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError(null);

    const result = await inviteTeamMember(email.trim(), role);

    if (!result.ok) {
      setError(result.error ?? "Erreur");
      setSaving(false);
      return;
    }

    setWasLinked(!!result.linked);
    setSaving(false);
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
            <BadgeCheck width={24} height={24} strokeWidth={2} className="text-[var(--accent)] inline-block" />
            <p className="text-[15px] font-medium text-foreground mt-3">
              {wasLinked ? "Membre ajoute" : "Invitation envoyee"}
            </p>
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm mx-auto">
              {wasLinked
                ? `${email} a ete ajoute a votre equipe en tant que ${teamRoleLabel(role)}.`
                : `Un email d'invitation a ete envoye a ${email}. Quand cette personne creera son compte Mur.mc, elle sera automatiquement ajoutee a votre equipe en tant que ${teamRoleLabel(role)}.`}
            </p>
            <button
              type="button"
              onClick={onDone}
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
                <span className="text-[14px] font-medium text-foreground">Inviter un membre</span>
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
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Email du membre
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="collegue@entreprise.com"
                  className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="wall-select h-[38px]"
                >
                  <option value="admin">Admin</option>
                  <option value="recruiter">Recruteur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </div>
              <div className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-3.5 text-[12px] text-foreground/70 leading-snug">
                Si cette personne a deja un compte Mur.mc, elle sera ajoutee directement.
                Sinon, une invitation en attente sera creee — elle sera automatiquement linkee
                a votre equipe quand elle creera son compte avec cet email.
              </div>
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
                  {error}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-full text-[12.5px] text-foreground/70 hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-4 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {saving ? (
                  <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <PlusCircle width={12} height={12} strokeWidth={2} />
                )}
                {saving ? "Envoi..." : "Inviter"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}
