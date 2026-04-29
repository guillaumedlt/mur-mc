"use client";

import { useEffect, useState } from "react";
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

  // Load invitation data via API serveur (RLS sur team_invitations bloque
  // les non-membres, ce qui est le cas du destinataire avant qu'il ne se
  // soit cree un profile dans la company).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invitation/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setInvitation(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setInvitation({
          id: data.id,
          email: data.email,
          teamRole: data.teamRole,
          companyId: data.companyId,
          companyName: data.companyName,
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInvitation(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

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
          Bienvenue chez {invitation.companyName}
        </h2>
        <p className="text-[13.5px] text-muted-foreground mt-2 max-w-sm mx-auto">
          Votre compte recruteur est cree. Vous etes{" "}
          <strong>{roleLabel(invitation.teamRole)}</strong> de votre entreprise sur
          Monte Carlo Work — vous pouvez publier des offres et gerer vos
          candidatures.
        </p>
        <Link
          href="/recruteur"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] font-medium items-center gap-2"
        >
          <Sparks width={14} height={14} strokeWidth={2} />
          Acceder a mon espace recruteur
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const fullName = name.trim() || invitation.email.split("@")[0];

    // Etape 1 : creer / connecter l'auth user
    let userId: string | null = null;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: { full_name: fullName, role: "employer" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: invitation.email,
            password,
          });
        if (signInError || !signInData.user) {
          setError(
            "Ce compte existe deja. Utilisez votre mot de passe habituel ou connectez-vous normalement.",
          );
          setSaving(false);
          return;
        }
        userId = signInData.user.id;
      } else {
        setError(signUpError.message);
        setSaving(false);
        return;
      }
    } else {
      userId = signUpData.user?.id ?? null;
    }

    if (!userId) {
      setError("Erreur inattendue lors de la creation du compte.");
      setSaving(false);
      return;
    }

    // Etape 2 : appel serveur pour le link profile + invitation accepted
    // (bypass des triggers et RLS qui bloquent le client).
    const acceptRes = await fetch(
      `/api/invitation/${encodeURIComponent(token)}/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      },
    );
    if (!acceptRes.ok) {
      const data = await acceptRes.json().catch(() => ({}));
      setError(data?.error ?? "Erreur lors de la liaison a l'entreprise.");
      setSaving(false);
      return;
    }

    const parts = fullName.split(" ").filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

    const authUser: AuthUser = {
      id: userId,
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
          Vous avez ete invite a rejoindre l&apos;equipe recruteur en tant que{" "}
          <strong>{roleLabel(invitation.teamRole)}</strong>. Creez votre compte
          pour publier des offres et gerer vos candidatures.
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
    case "admin": return "Responsable de l'equipe";
    case "recruiter": return "Recruteur";
    case "viewer": return "Lecteur";
    default: return r;
  }
}
