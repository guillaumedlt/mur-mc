"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building,
  Globe,
  Group,
  MapPin,
  PlusCircle,
  Sparks,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  completeOnboardingStep,
  scanCompanyDomain,
  skipOnboarding,
  updateCompanyProfile,
  useEmployer,
} from "@/lib/employer-store";
import { createClient } from "@/lib/supabase/client";
import { signIn as localSignIn } from "@/lib/auth";
import type { Sector } from "@/lib/data";

const SECTORS: Sector[] = [
  "Banque & Finance",
  "Yachting",
  "Hôtellerie & Restauration",
  "Luxe & Retail",
  "Tech & Digital",
  "Immobilier",
  "Juridique",
  "Sport & Bien-être",
  "Événementiel",
  "Famille / Office",
  "Assurance",
  "Audit & Conseil",
  "BTP & Construction",
  "Commerce & Distribution",
  "Communication & Marketing",
  "Comptabilité",
  "Éducation & Formation",
  "Industrie",
  "Logistique & Transport",
  "Médical & Santé",
  "Ressources Humaines",
  "Sécurité",
  "Services à la personne",
  "Autre",
];

type WizardStep = "company" | "scan" | "profile" | "done";

export function OnboardingWizard() {
  const user = useUser();
  const router = useRouter();
  const { onboarding } = useEmployer();

  // Si l'onboarding est deja complete ou skip, redirect vers le dashboard
  const isComplete =
    onboarding.completed.includes("company_created") ||
    onboarding.skippedAt;

  useEffect(() => {
    if (isComplete) {
      router.replace("/recruteur");
    }
  }, [isComplete, router]);

  const [step, setStep] = useState<WizardStep>("company");

  // Company creation fields
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState<Sector>("Hôtellerie & Restauration");
  const [location, setLocation] = useState("Monaco");
  const [size, setSize] = useState("10-50");
  const [website, setWebsite] = useState("");

  // AI scan
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<NonNullable<
    typeof onboarding.aiSuggestion
  > | null>(onboarding.aiSuggestion ?? null);

  // Profile fields (pre-filled from AI)
  const [description, setDescription] = useState("");
  const [positioning, setPositioning] = useState("");
  const [tagline, setTagline] = useState("");

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  if (!user || user.role !== "employer") return null;

  const onCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    // Insert dans Supabase
    const supabase = createClient();
    const slug = companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) + "-" + Date.now().toString(36).slice(-4);

    const { data: newCompany, error: insertError } = await supabase
      .from("companies")
      .insert({
        slug,
        name: companyName.trim(),
        sector,
        size,
        location: location || "Monaco",
        website: website || null,
        logo_color: "#1C3D5A",
        initials: companyName
          .trim()
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3),
      })
      .select("id, name")
      .single();

    if (insertError || !newCompany) {
      window.console.error("Company insert error:", insertError);
      return;
    }

    // Lier le recruteur a l'entreprise
    const { error: linkError } = await supabase
      .from("profiles")
      .update({ company_id: newCompany.id, team_role: "admin" })
      .eq("id", user.id);

    if (linkError) {
      window.console.error("Profile link error:", linkError);
    }

    // Mettre a jour le store local avec le company_id
    localSignIn({
      ...user,
      companyId: newCompany.id,
      companyName: newCompany.name,
    });

    updateCompanyProfile({
      companyId: newCompany.id,
      website: website || undefined,
    });
    completeOnboardingStep("company_created");

    if (website.trim()) {
      setStep("scan");
      setScanning(true);
      scanCompanyDomain(website.trim()).then((result) => {
        setScanResult(result);
        setDescription(result.description ?? "");
        setPositioning(result.positioning ?? "");
        setScanning(false);
      });
    } else {
      setStep("profile");
    }
  };

  const onScanContinue = () => {
    setStep("profile");
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Persister dans le store local
    updateCompanyProfile({
      companyId: user.companyId ?? "new",
      description: description || undefined,
      positioning: positioning || undefined,
      tagline: tagline || undefined,
      website: website || undefined,
    });

    // Persister dans Supabase
    if (user.companyId) {
      const supabase = createClient();
      await supabase
        .from("companies")
        .update({
          description: description || null,
          positioning: positioning || null,
          tagline: tagline || null,
          website: website || null,
        })
        .eq("id", user.companyId);
    }

    completeOnboardingStep("profile_completed");
    setStep("done");
  };

  const onSkip = () => {
    skipOnboarding();
    router.push("/recruteur");
  };

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="text-foreground/60">Configuration du compte</span>
          <span className="font-mono text-foreground tabular-nums">
            {step === "done" ? "Termine" : stepLabel(step)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${
                step === "company"
                  ? 10
                  : step === "scan"
                    ? 40
                    : step === "profile"
                      ? 70
                      : 100
              }%`,
            }}
          />
        </div>
      </div>

      {step === "company" && (
        <CompanyStep
          companyName={companyName}
          setCompanyName={setCompanyName}
          sector={sector}
          setSector={setSector}
          location={location}
          setLocation={setLocation}
          size={size}
          setSize={setSize}
          website={website}
          setWebsite={setWebsite}
          onSubmit={onCreateCompany}
          onSkip={onSkip}
        />
      )}

      {step === "scan" && (
        <ScanStep
          scanning={scanning}
          result={scanResult}
          domain={website}
          onContinue={onScanContinue}
        />
      )}

      {step === "profile" && (
        <ProfileStep
          description={description}
          setDescription={setDescription}
          positioning={positioning}
          setPositioning={setPositioning}
          tagline={tagline}
          setTagline={setTagline}
          aiSuggested={!!scanResult}
          onSubmit={onSaveProfile}
          onSkip={() => {
            completeOnboardingStep("profile_completed");
            setStep("done");
          }}
        />
      )}

      {step === "done" && <DoneStep />}
    </div>
  );
}

function stepLabel(s: WizardStep): string {
  switch (s) {
    case "company":
      return "Etape 1/3";
    case "scan":
      return "Analyse IA";
    case "profile":
      return "Etape 2/3";
    case "done":
      return "Termine";
  }
}

/* ─── Step 1 : Company creation ──────────────────────────── */

function CompanyStep({
  companyName,
  setCompanyName,
  sector,
  setSector,
  location,
  setLocation,
  size,
  setSize,
  website,
  setWebsite,
  onSubmit,
  onSkip,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  sector: Sector;
  setSector: (v: Sector) => void;
  location: string;
  setLocation: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <span className="size-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
          <Building width={22} height={22} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
            Creez votre entreprise
          </h2>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            Ces informations serviront a creer votre fiche publique sur le mur.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <FormRow label="Nom de l'entreprise" required>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Monte-Carlo Societe des Bains de Mer"
            required
            className="wall-input h-11 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
          />
        </FormRow>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow label="Secteur">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as Sector)}
              className="wall-select h-11"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Taille">
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="wall-select h-11"
            >
              <option value="1-10">1 - 10</option>
              <option value="10-50">10 - 50</option>
              <option value="50-200">50 - 200</option>
              <option value="200-500">200 - 500</option>
              <option value="500+">500+</option>
            </select>
          </FormRow>
        </div>

        <FormRow label="Localisation">
          <div className="wall-input h-11">
            <MapPin
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Monaco, Monte-Carlo…"
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
            />
          </div>
        </FormRow>

        <FormRow
          label="Site web"
          hint="Si vous entrez votre site, notre IA analysera votre entreprise pour pre-remplir votre fiche."
        >
          <div className="wall-input h-11">
            <Globe
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="montecarlosbm.com"
              className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
            />
          </div>
          {website.trim() && (
            <div className="flex items-center gap-1.5 mt-1 text-[11.5px] text-[var(--accent)]">
              <Sparks width={11} height={11} strokeWidth={2.2} />
              L&apos;IA analysera {website} pour vous suggerer une description
            </div>
          )}
        </FormRow>
      </div>

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onSkip}
          className="text-[12.5px] text-foreground/55 hover:text-foreground transition-colors"
        >
          Passer pour l&apos;instant
        </button>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          {website.trim() ? (
            <>
              <Sparks width={14} height={14} strokeWidth={2} />
              Creer et analyser
            </>
          ) : (
            <>
              Continuer
              <ArrowRight width={14} height={14} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ─── Step scan : AI analysis ────────────────────────────── */

function ScanStep({
  scanning,
  result,
  domain,
  onContinue,
}: {
  scanning: boolean;
  result: NonNullable<ReturnType<typeof useEmployer>["onboarding"]["aiSuggestion"]> | null;
  domain: string;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 text-center">
      {scanning ? (
        <>
          <div className="size-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center animate-pulse">
            <Sparks width={28} height={28} strokeWidth={1.6} />
          </div>
          <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-5">
            Analyse en cours…
          </h2>
          <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
            Notre IA scanne <span className="font-mono text-foreground">{domain}</span> pour
            generer une description de votre entreprise. Quelques secondes…
          </p>
          <div className="mt-6 h-1.5 rounded-full bg-[var(--background-alt)] max-w-xs mx-auto overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full animate-pulse w-2/3" />
          </div>
        </>
      ) : result ? (
        <>
          <div className="size-16 rounded-2xl bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)] inline-flex items-center justify-center">
            <BadgeCheck width={28} height={28} strokeWidth={1.6} />
          </div>
          <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-5">
            Analyse terminee
          </h2>
          <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
            Voici ce que notre IA a trouve. Vous pourrez tout modifier a l&apos;etape suivante.
          </p>

          <div className="mt-6 text-left max-w-lg mx-auto flex flex-col gap-3">
            {result.description && (
              <SuggestionBlock
                label="Description suggeree"
                value={result.description}
              />
            )}
            {result.positioning && (
              <SuggestionBlock
                label="Positionnement suggere"
                value={result.positioning}
              />
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {result.sector && (
                <span className="wall-badge" data-tone="muted">
                  {result.sector}
                </span>
              )}
              {result.size && (
                <span className="wall-badge" data-tone="muted">
                  <Group /> {result.size}
                </span>
              )}
              {result.founded && (
                <span className="wall-badge" data-tone="muted">
                  Fondee en {result.founded}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="h-11 px-5 mt-8 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors inline-flex items-center gap-2"
          >
            Continuer avec ces suggestions
            <ArrowRight width={14} height={14} strokeWidth={2} />
          </button>
        </>
      ) : null}
    </div>
  );
}

function SuggestionBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparks
          width={11}
          height={11}
          strokeWidth={2.2}
          className="text-[var(--accent)]"
        />
        <span className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-[var(--accent)]">
          {label}
        </span>
      </div>
      <p className="text-[13px] text-foreground/85 leading-[1.6]">{value}</p>
    </div>
  );
}

/* ─── Step 2 : Profile completion ────────────────────────── */

function ProfileStep({
  description,
  setDescription,
  positioning,
  setPositioning,
  tagline,
  setTagline,
  aiSuggested,
  onSubmit,
  onSkip,
}: {
  description: string;
  setDescription: (v: string) => void;
  positioning: string;
  setPositioning: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  aiSuggested: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <span className="size-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
          <PlusCircle width={22} height={22} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
            Completez votre fiche
          </h2>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            {aiSuggested
              ? "Les champs sont pre-remplis par l'IA. Modifiez librement."
              : "Ces textes seront visibles sur votre page publique."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <FormRow label="Tagline" hint="Phrase d'accroche courte">
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Le groupe historique qui fait vivre Monte-Carlo"
            className="wall-input h-11 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
          />
        </FormRow>

        <FormRow label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Presentez votre entreprise en quelques lignes…"
            rows={5}
            className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
          />
          {aiSuggested && description && (
            <div className="flex items-center gap-1 mt-1 text-[10.5px] text-[var(--accent)]">
              <Sparks width={10} height={10} strokeWidth={2.2} />
              Pre-rempli par l&apos;IA — modifiez librement
            </div>
          )}
        </FormRow>

        <FormRow label="Positionnement marche">
          <textarea
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            placeholder="Ce qui vous distingue, votre marche, vos clients…"
            rows={3}
            className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
          />
        </FormRow>
      </div>

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onSkip}
          className="text-[12.5px] text-foreground/55 hover:text-foreground transition-colors"
        >
          Completer plus tard
        </button>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          Enregistrer
          <ArrowRight width={14} height={14} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}

/* ─── Done ───────────────────────────────────────────────── */

function DoneStep() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-12 text-center">
      <span className="size-16 rounded-2xl bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)] inline-flex items-center justify-center">
        <BadgeCheck width={28} height={28} strokeWidth={1.6} />
      </span>
      <h2 className="font-display text-[28px] tracking-[-0.015em] text-foreground mt-5">
        Votre espace est pret.
      </h2>
      <p className="text-[14px] text-muted-foreground mt-2 max-w-md mx-auto">
        Vous pouvez maintenant publier vos premieres offres, inviter votre
        equipe et personnaliser votre fiche entreprise.
      </p>
      <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
        <Link
          href="/recruteur/publier"
          className="h-11 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          <PlusCircle width={14} height={14} strokeWidth={2} />
          Publier ma premiere offre
        </Link>
        <Link
          href="/recruteur"
          className="h-11 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center"
        >
          Acceder au dashboard
        </Link>
      </div>
    </div>
  );
}

/* ─── FormRow ────────────────────────────────────────────── */

function FormRow({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
