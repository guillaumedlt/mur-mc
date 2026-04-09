"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bag,
  Building,
  Lock,
  Mail,
  Sparks,
  User as UserIcon,
} from "iconoir-react";
import {
  type Role,
  DEMO_CANDIDATE,
  DEMO_EMPLOYER,
  signIn,
} from "@/lib/auth";
import { seedDemoCandidate } from "@/lib/candidate-store";
import { seedDemoEmployer } from "@/lib/employer-store";

type Mode = "signin" | "signup";
type Props = { mode: Mode };

export function ConnexionForm({ mode }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = role === "candidate" ? DEMO_CANDIDATE : DEMO_EMPLOYER;
    const finalUser = {
      ...base,
      name: mode === "signup" && name ? name : base.name,
      email: email || base.email,
      initials:
        mode === "signup" && name
          ? name
              .split(" ")
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()
          : base.initials,
    };
    signIn(finalUser);
    if (role === "candidate") {
      seedDemoCandidate({ fullName: finalUser.name, email: finalUser.email });
      router.push("/candidat");
    } else if (finalUser.companyId) {
      seedDemoEmployer({
        companyId: finalUser.companyId,
        recruiterName: finalUser.name,
      });
      router.push("/recruteur");
    } else {
      // Nouveau recruteur sans entreprise : onboarding
      router.push("/recruteur/onboarding");
    }
  };

  const onDemo = (r: Role) => {
    const u = r === "candidate" ? DEMO_CANDIDATE : DEMO_EMPLOYER;
    signIn(u);
    if (r === "candidate") {
      seedDemoCandidate({ fullName: u.name, email: u.email });
    } else if (u.companyId) {
      seedDemoEmployer({ companyId: u.companyId, recruiterName: u.name });
    }
    router.push(r === "candidate" ? "/candidat" : "/recruteur");
  };

  const submitLabel =
    mode === "signin"
      ? role === "candidate"
        ? "Accéder à mon espace"
        : "Accéder à mon dashboard"
      : role === "candidate"
        ? "Créer mon compte candidat"
        : "Créer mon compte recruteur";

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
                Mot de passe oublié&nbsp;?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
          >
            {role === "candidate" ? (
              <UserIcon width={14} height={14} strokeWidth={2} />
            ) : (
              <Bag width={14} height={14} strokeWidth={2} />
            )}
            {submitLabel}
          </button>
        </form>

        {/* Séparateur "ou" */}
        <div className="flex items-center gap-3 mt-7 w-full max-w-[400px] mx-auto">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-foreground/45 font-medium">
            ou en démo
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Démo accounts */}
        <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-[400px] mx-auto">
          <button
            type="button"
            onClick={() => onDemo("candidate")}
            className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparks width={12} height={12} strokeWidth={2} />
            Candidat
          </button>
          <button
            type="button"
            onClick={() => onDemo("employer")}
            className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparks width={12} height={12} strokeWidth={2} />
            Recruteur
          </button>
        </div>

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
