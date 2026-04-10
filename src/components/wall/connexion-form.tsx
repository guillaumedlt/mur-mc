"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Bag,
  Building,
  Lock,
  Mail,
  Sparks,
  User as UserIcon,
} from "iconoir-react";
import { type AuthUser, type Role, signIn as localSignIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { signUpAction, signInAction } from "@/lib/auth-actions";

type Mode = "signin" | "signup";
type Props = { mode: Mode };

export function ConnexionForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirmation_failed"
      ? "La confirmation a echoue. Reessayez."
      : null,
  );
  const [confirmationSent, setConfirmationSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("role", role);
      if (name) formData.set("fullName", name);

      if (mode === "signup") {
        const result = await signUpAction(formData);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        // Email de confirmation envoye
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      const result = await signInAction(formData);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Pre-sync : remplir le store local AVANT le redirect
      // pour que la page de destination n'ait pas a attendre le sync
      const nameParts = (name || email.split("@")[0]).split(" ").filter(Boolean);
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (name || email).slice(0, 2).toUpperCase();

      const authUser: AuthUser = {
        id: "pending",
        name: name || email.split("@")[0],
        email,
        role: result.role as Role ?? role,
        initials,
        avatarColor: result.role === "employer" ? "#7c1d2c" : "#1C3D5A",
      };

      // Charger le vrai user id + company en parallele
      const supabase = createClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        authUser.id = sbUser.id;
        authUser.name = sbUser.user_metadata?.full_name ?? authUser.name;

        if (result.role === "employer") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", sbUser.id)
            .single();
          if (profile?.company_id) {
            authUser.companyId = profile.company_id;
            const { data: company } = await supabase
              .from("companies")
              .select("name")
              .eq("id", profile.company_id)
              .single();
            if (company) authUser.companyName = company.name;
          }
        }
      }

      localSignIn(authUser);

      // Redirect
      if (result.role === "employer") {
        router.push("/recruteur");
      } else {
        router.push("/candidat");
      }
    } catch (err) {
      setError("Une erreur est survenue. Reessayez.");
      setLoading(false);
      if (typeof window !== "undefined") {
        window.console.error("Auth error:", err);
      }
    }
  };

  const submitLabel =
    mode === "signin"
      ? role === "candidate"
        ? "Accéder à mon espace"
        : "Accéder à mon dashboard"
      : role === "candidate"
        ? "Créer mon compte candidat"
        : "Créer mon compte recruteur";

  // Ecran de confirmation email
  if (confirmationSent) {
    return (
      <div className="max-w-[500px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-8 sm:p-10 text-center">
        <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center">
          <Mail width={26} height={26} strokeWidth={1.8} />
        </span>
        <h2 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-5">
          Verifiez votre email
        </h2>
        <p className="text-[14px] text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
          Un email de confirmation a ete envoye a{" "}
          <span className="font-medium text-foreground">{email}</span>.
          Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-[var(--background-alt)] border border-[var(--border)] text-[12.5px] text-foreground/70 leading-snug">
          Pensez a verifier vos spams. L&apos;email vient de{" "}
          <span className="font-mono text-foreground/85">noreply@mur.mc</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-7">
          <Link
            href="/connexion"
            className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center"
          >
            Se connecter
          </Link>
          <button
            type="button"
            onClick={() => {
              setConfirmationSent(false);
              setEmail("");
              setPassword("");
              setName("");
            }}
            className="h-10 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center"
          >
            Modifier l&apos;email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">
      {/* ─── Colonne gauche : pitch éditorial ──────────── */}
      <aside className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 lg:p-9 flex flex-col">
        <p className="ed-label-sm">
          {mode === "signin" ? "Bon retour" : "Bienvenue"}
        </p>
        <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-1.5">
          {mode === "signin"
            ? "Reprends là où tu t'étais arrêté."
            : "Crée ton compte. Pose ton premier filtre."}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-3 leading-[1.65]">
          Mur.mc, c&apos;est le mur d&apos;offres de la Principauté. Que tu
          cherches ta prochaine maison ou ton prochain talent, tout passe ici.
        </p>

        <ul className="flex flex-col gap-3 mt-8">
          <Bullet>Toutes les offres de Monaco, en direct</Bullet>
          <Bullet>Annuaire éditorial des maisons qui recrutent</Bullet>
          <Bullet>Magazine, salaires, stories sur le marché</Bullet>
        </ul>

        <div className="flex-1 min-h-6" />

        <p className="text-[11px] font-mono text-[var(--tertiary-foreground)] tracking-wider">
          MUR.MC · {new Date().getFullYear()}
        </p>
      </aside>

      {/* ─── Colonne droite : formulaire ───────────────── */}
      <main className="lg:col-span-3 bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 lg:p-9 flex flex-col">
        {/* Toggle role */}
        <RoleToggle role={role} onChange={setRole} />

        {/* Titre + sous-titre */}
        <div className="text-center mt-6">
          <h2 className="font-display text-[24px] tracking-[-0.01em] text-foreground">
            {mode === "signin" ? "Se connecter" : "Créer un compte"}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {role === "candidate"
              ? "Postule en un clic, sauvegarde tes offres, reçois des alertes."
              : "Publie tes offres, gère tes candidatures, recrute mieux."}
          </p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 mt-6 w-full max-w-[400px] mx-auto"
        >
          {mode === "signup" && (
            <Field
              icon={UserIcon}
              type="text"
              placeholder={
                role === "candidate" ? "Nom complet" : "Nom et prénom"
              }
              value={name}
              onChange={setName}
              autoComplete="name"
            />
          )}
          <Field
            icon={Mail}
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            icon={Lock}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={setPassword}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />

          {mode === "signin" && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                className="text-[11.5px] text-foreground/55 hover:text-foreground transition-colors"
              >
                Mot de passe oublie&nbsp;?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 disabled:opacity-60 disabled:cursor-wait transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : role === "candidate" ? (
              <UserIcon width={14} height={14} strokeWidth={2} />
            ) : (
              <Bag width={14} height={14} strokeWidth={2} />
            )}
            {loading ? "Chargement..." : submitLabel}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-[12.5px] text-center text-foreground/60 mt-7">
          {mode === "signin" ? (
            <>
              Pas encore de compte&nbsp;?{" "}
              <Link
                href="/inscription"
                className="text-[var(--accent)] font-medium hover:underline underline-offset-2"
              >
                S&apos;inscrire
              </Link>
            </>
          ) : (
            <>
              Déjà un compte&nbsp;?{" "}
              <Link
                href="/connexion"
                className="text-[var(--accent)] font-medium hover:underline underline-offset-2"
              >
                Se connecter
              </Link>
            </>
          )}
        </p>
      </main>
    </div>
  );
}

/* ─────────────── Toggle de rôle ─────────────── */

function RoleToggle({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div
      className="relative grid grid-cols-2 p-1 rounded-full bg-[var(--background-alt)] border border-[var(--border)] w-full max-w-[360px] mx-auto"
      role="tablist"
      aria-label="Type de compte"
    >
      {/* Indicateur sliding */}
      <span
        className="absolute top-1 bottom-1 rounded-full bg-foreground transition-[left] duration-300 ease-out"
        style={{
          width: "calc(50% - 4px)",
          left: role === "candidate" ? "4px" : "calc(50% + 0px)",
        }}
        aria-hidden
      />
      <button
        type="button"
        role="tab"
        aria-selected={role === "candidate"}
        onClick={() => onChange("candidate")}
        className={`relative z-10 h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
          role === "candidate" ? "text-background" : "text-foreground/70"
        }`}
      >
        <UserIcon width={13} height={13} strokeWidth={2} />
        Je cherche un job
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={role === "employer"}
        onClick={() => onChange("employer")}
        className={`relative z-10 h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
          role === "employer" ? "text-background" : "text-foreground/70"
        }`}
      >
        <Building width={13} height={13} strokeWidth={2} />
        Je recrute
      </button>
    </div>
  );
}

/* ─────────────── Champs de formulaire ─────────────── */

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="wall-input h-11 cursor-text">
      <Icon
        width={14}
        height={14}
        strokeWidth={2}
        className="text-[var(--tertiary-foreground)] shrink-0"
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
      />
    </label>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-foreground/85">
      <span className="mt-[3px] size-[18px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
        <Sparks width={11} height={11} strokeWidth={2.4} />
      </span>
      <span className="leading-[1.5]">{children}</span>
    </li>
  );
}
