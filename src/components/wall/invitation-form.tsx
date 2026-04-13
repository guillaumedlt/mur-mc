"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building,
  Lock,
  Mail,
  Sparks,
  User as UserIcon,
} from "iconoir-react";
import { type AuthUser, signIn as localSignIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

type InvitationData = {
  id: string;
  email: string;
  teamRole: string;
  companyId: string;
  companyName: string;
} | null;

export function InvitationForm({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<InvitationData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Load invitation data from Supabase
  const [fetched, setFetched] = useState(false);
  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("team_invitations")
      .select("id, email, team_role, company_id, companies(name)")
      .eq("token", token)
      .eq("status", "pending")
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) {
          const companyName =
            data.companies && typeof data.companies === "object" && "name" in data.companies
              ? data.companies.name
              : "Entreprise";
          setInvitation({
            id: data.id,
            email: data.email,
            teamRole: data.team_role,
            companyId: data.company_id,
            companyName,
          });
        } else {
          setInvitation(null);
        }
        setLoading(false);
      });
  }

  if (loading) {
    return (
      <div className="max-w-[500px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="max-w-[500px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-8 sm:p-10 text-center">
        <p className="font-display text-[22px] tracking-[-0.01em] text-foreground">
          Invitation invalide ou expiree
        </p>
        <p className="text-[13px] text-muted-foreground mt-2">
          Ce lien d&apos;invitation n&apos;est plus valide. Demandez a votre administrateur de vous renvoyer une invitation.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-[500px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-8 sm:p-10 text-center">
        <BadgeCheck width={28} height={28} strokeWidth={2} className="text-[var(--accent)] inline-block" />
        <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-4">
          Bienvenue dans l&apos;equipe
        </h2>
        <p className="text-[13.5px] text-muted-foreground mt-2 max-w-sm mx-auto">
          Votre compte a ete cree et vous avez rejoint <strong>{invitation.companyName}</strong> en tant que{" "}
          <strong>{roleLabel(invitation.teamRole)}</strong>.
        </p>
        <Link
          href="/recruteur"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] font-medium items-center gap-2"
        >
          <Sparks width={14} height={14} strokeWidth={2} />
          Acceder au dashboard
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const supabase = createClient();

    // Create the account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          full_name: name.trim() || invitation.email.split("@")[0],
          role: "employer",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        // Account exists — try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password,
        });

        if (signInError) {
          setError("Ce compte existe deja. Utilisez votre mot de passe habituel ou connectez-vous normalement.");
          setSaving(false);
          return;
        }

        if (signInData.user) {
          // Link to company
          await supabase.from("profiles").update({
            company_id: invitation.companyId,
            team_role: invitation.teamRole,
          }).eq("id", signInData.user.id);

          // Accept invitation
          await supabase.from("team_invitations").update({ status: "accepted" }).eq("id", invitation.id);

          const fullName = name.trim() || signInData.user.user_metadata?.full_name || invitation.email.split("@")[0];
          const parts = fullName.split(" ").filter(Boolean);
          const initials = parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

          localSignIn({
            id: signInData.user.id,
            name: fullName,
            email: invitation.email,
            role: "employer",
            initials,
            avatarColor: "#7c1d2c",
            companyId: invitation.companyId,
            companyName: invitation.companyName,
          });

          setSaving(false);
          setDone(true);
          return;
        }
      }
      setError(signUpError.message);
      setSaving(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("Erreur inattendue.");
      setSaving(false);
      return;
    }

    // Link profile to company
    await supabase.from("profiles").update({
      company_id: invitation.companyId,
      team_role: invitation.teamRole,
      full_name: name.trim() || invitation.email.split("@")[0],
    }).eq("id", user.id);

    // Accept invitation
    await supabase.from("team_invitations").update({ status: "accepted" }).eq("id", invitation.id);

    const fullName = name.trim() || invitation.email.split("@")[0];
    const parts = fullName.split(" ").filter(Boolean);
    const initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    const authUser: AuthUser = {
      id: user.id,
      name: fullName,
      email: invitation.email,
      role: "employer",
      initials,
      avatarColor: "#7c1d2c",
      companyId: invitation.companyId,
      companyName: invitation.companyName,
    };

    localSignIn(authUser);
    setSaving(false);
    setDone(true);
  };

  return (
    <div className="max-w-[500px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-8 sm:p-10">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center mb-4">
          <Building width={24} height={24} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
          Rejoindre {invitation.companyName}
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2">
          Vous avez ete invite en tant que <strong>{roleLabel(invitation.teamRole)}</strong>.
          Creez votre compte pour acceder a l&apos;espace recruteur.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Email (readonly) */}
        <label className="wall-input h-11 cursor-not-allowed opacity-70">
          <Mail width={14} height={14} strokeWidth={2} className="text-[var(--tertiary-foreground)] shrink-0" />
          <input
            type="email"
            value={invitation.email}
            readOnly
            className="flex-1 bg-transparent outline-none text-[13.5px] text-foreground/70 cursor-not-allowed"
          />
        </label>

        {/* Name */}
        <label className="wall-input h-11 cursor-text">
          <UserIcon width={14} height={14} strokeWidth={2} className="text-[var(--tertiary-foreground)] shrink-0" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom complet"
            required
            className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
          />
        </label>

        {/* Password */}
        <label className="wall-input h-11 cursor-text">
          <Lock width={14} height={14} strokeWidth={2} className="text-[var(--tertiary-foreground)] shrink-0" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choisir un mot de passe"
            required
            minLength={6}
            autoComplete="new-password"
            className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
          />
        </label>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 disabled:opacity-60 disabled:cursor-wait transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            <BadgeCheck width={14} height={14} strokeWidth={2} />
          )}
          {saving ? "Creation du compte..." : "Creer mon compte et rejoindre"}
        </button>
      </form>

      <p className="text-[11px] text-center text-foreground/45 mt-5">
        Vous rejoindrez automatiquement l&apos;equipe de {invitation.companyName}.
        Pas besoin de creer d&apos;entreprise.
      </p>

      <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
        <p className="text-[12.5px] text-foreground/60">
          Deja un compte ?{" "}
          <Link href="/connexion" className="text-[var(--accent)] font-medium hover:underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

function roleLabel(r: string): string {
  switch (r) {
    case "admin": return "Administrateur";
    case "recruiter": return "Recruteur";
    case "viewer": return "Lecteur";
    default: return r;
  }
}
