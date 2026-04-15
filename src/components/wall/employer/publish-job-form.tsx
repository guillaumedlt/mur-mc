"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  Mail,
  PlusCircle,
  Rocket,
  Sparks,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import type { EmployerJob } from "@/lib/employer-store";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyCompany } from "@/lib/supabase/use-my-company";
import { createClient } from "@/lib/supabase/client";
import type {
  ExperienceLevel,
  JobType,
  Sector,
  WorkTime,
} from "@/lib/data";

const DEFAULT_QUOTA = 1;

const CONTRACTS: JobType[] = [
  "CDI",
  "CDD",
  "Freelance",
  "Stage",
  "Alternance",
  "Saison",
];
const SECTORS: string[] = [
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
  "Consulting",
  "Autre",
];
const LEVELS: ExperienceLevel[] = [
  "Junior",
  "Confirmé",
  "Senior",
  "Manager",
  "Direction",
];
const REMOTES = [
  "Sur site",
  "Hybride",
  "Télétravail partiel",
  "Télétravail",
];
const WORK_TIMES: WorkTime[] = ["Temps plein", "Temps partiel"];

type Props = { existing?: EmployerJob; onCancel?: () => void };

export function PublishJobForm({ existing, onCancel }: Props) {
  const user = useUser();
  const router = useRouter();
  const [submitted, setSubmitted] = useState<EmployerJob | null>(null);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [contract, setContract] = useState<JobType>(existing?.type ?? "CDI");
  const [level, setLevel] = useState<ExperienceLevel>(existing?.level ?? "Confirmé");
  const [sector, setSector] = useState(
    existing?.sector ?? "Hôtellerie & Restauration",
  );
  const [location, setLocation] = useState(existing?.location ?? "Monaco");
  const [remote, setRemote] = useState(
    existing?.remote ?? "Sur site",
  );
  const [workTime, setWorkTime] = useState<WorkTime>(
    existing?.workTime ?? "Temps plein",
  );
  const [lang, setLang] = useState<"fr" | "en">(existing?.lang ?? "fr");
  const [shortDesc, setShortDesc] = useState(existing?.shortDescription ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [salaryMin, setSalaryMin] = useState<string>(
    existing?.salaryMin ? String(existing.salaryMin) : "",
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    existing?.salaryMax ? String(existing.salaryMax) : "",
  );

  const [responsibilities, setResponsibilities] = useState<string[]>(
    existing?.responsibilities ?? [],
  );
  const [requirements, setRequirements] = useState<string[]>(
    existing?.requirements ?? [],
  );
  const [benefits, setBenefits] = useState<string[]>(
    existing?.benefits ?? [],
  );
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [freePrompt, setFreePrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const generateWithAi = async () => {
    if (!title.trim()) return;
    setAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          contract,
          level,
          sector,
          location,
          remote,
          workTime,
          salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
          companyName: user?.companyName ?? "",
          lang,
          freePrompt: freePrompt.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error || "Erreur de generation");
      }

      const data = await res.json();

      if (data.shortDescription) setShortDesc(data.shortDescription);
      if (data.description) setDescription(data.description);
      if (Array.isArray(data.responsibilities) && data.responsibilities.length > 0)
        setResponsibilities(data.responsibilities);
      if (Array.isArray(data.requirements) && data.requirements.length > 0)
        setRequirements(data.requirements);
      if (Array.isArray(data.benefits) && data.benefits.length > 0)
        setBenefits(data.benefits);
      if (Array.isArray(data.tags) && data.tags.length > 0)
        setTags(data.tags);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Erreur lors de la generation",
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const { jobs: existingJobs, loading: jobsLoading } = useMyJobs();
  const { company: myCompany } = useMyCompany();
  const jobQuota = myCompany?.job_quota ?? DEFAULT_QUOTA;

  if (!user || user.role !== "employer") {
    return (
      <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi côté recruteur pour publier une offre.
        </p>
        <Link
          href="/connexion"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  // Pas encore d'entreprise → rediriger vers l'onboarding
  if (!user.companyId) {
    return (
      <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center mb-4">
          <Sparks width={24} height={24} strokeWidth={1.8} />
        </span>
        <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground">
          Créez d&apos;abord votre entreprise
        </h2>
        <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
          Pour publier une offre, vous devez d&apos;abord créer votre fiche entreprise. Ça prend moins de 2 minutes.
        </p>
        <Link
          href="/recruteur/onboarding"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center gap-2"
        >
          <Sparks width={14} height={14} strokeWidth={2} />
          Créer mon entreprise
        </Link>
      </div>
    );
  }

  // Quota atteint → message upgrade
  if (!existing && !jobsLoading && existingJobs.length >= jobQuota) {
    return (
      <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <span className="size-14 rounded-2xl bg-foreground/5 text-foreground/60 inline-flex items-center justify-center mb-4">
          <Lock width={24} height={24} strokeWidth={1.8} />
        </span>
        <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground">
          Quota atteint
        </h2>
        <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
          Vous avez atteint la limite de {jobQuota} offre{jobQuota > 1 ? "s" : ""}.
          Pour publier de nouvelles offres, passez à un forfait payant.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <Link
            href="/tarifs"
            className="inline-flex h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium items-center gap-2"
          >
            Voir les forfaits
          </Link>
          <a
            href="mailto:contact@mur.mc?subject=Upgrade%20forfait%20recruteur"
            className="inline-flex h-10 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] items-center gap-2 transition-colors"
          >
            <Mail width={14} height={14} strokeWidth={2} />
            Nous contacter
          </a>
        </div>
        <p className="text-[11px] text-foreground/45 mt-4">
          Vous avez {existingJobs.length} offre{existingJobs.length > 1 ? "s" : ""} sur {jobQuota} autorisee{jobQuota > 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) + "-" + Date.now().toString(36).slice(-5);

    const { data: newJob } = await supabase.from("jobs").insert({
      company_id: user.companyId,
      slug,
      title,
      type: contract,
      level,
      sector,
      location,
      remote,
      work_time: workTime,
      lang,
      languages: lang === "fr" ? ["Français"] : ["Anglais"],
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      short_description: shortDesc,
      description,
      responsibilities,
      requirements,
      benefits,
      tags,
      status: "published",
      featured: false,
    }).select("id").single();

    setSubmitted({
      id: newJob?.id ?? "",
      title,
    } as EmployerJob);
  };

  if (submitted) {
    return (
      <div className="max-w-[760px] mx-auto">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center">
            <BadgeCheck width={26} height={26} strokeWidth={2} />
          </span>
          <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-4">
            Ton offre est en ligne.
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
            « {submitted.title} » est désormais visible dans ta liste d&apos;offres.
            Tu peux suivre les candidatures dans le pipeline.
          </p>
          {/* Booster */}
          <div className="mt-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-5 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Rocket width={16} height={16} strokeWidth={2} className="text-[var(--accent)]" />
              <span className="text-[13px] font-semibold text-foreground">
                Booster mon offre
              </span>
            </div>
            <a
              href="mailto:contact@mur.mc?subject=Booster%20mon%20offre"
              className="h-9 px-4 rounded-full bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 transition-colors inline-flex items-center gap-1.5"
            >
              <Rocket width={12} height={12} strokeWidth={2} />
              Nous contacter
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <Link
              href={`/recruteur/offres/${submitted.id}`}
              className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 flex items-center"
            >
              Ouvrir la fiche
            </Link>
            <Link
              href="/recruteur/offres"
              className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] flex items-center"
            >
              Toutes mes offres
            </Link>
            <button
              type="button"
              onClick={() => router.push("/recruteur/publier")}
              className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] flex items-center"
            >
              Publier une autre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto">
      {!existing && (
        <Link
          href="/recruteur"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Mon espace recruteur
        </Link>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 flex flex-col gap-6"
      >
        <header>
          <p className="ed-label-sm">{existing ? "Modifier l'offre" : "Nouvelle offre"}</p>
          <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
            {existing ? "Mettre à jour cette offre" : "Publier une offre sur le mur"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            Quelques infos suffisent. Tu pourras affiner après publication.
          </p>
        </header>

        <FormRow label="Titre du poste">
          <Input
            placeholder="Ex. Chef de Rang — Restaurant 1*"
            value={title}
            onChange={setTitle}
            required
          />
        </FormRow>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormRow label="Type de contrat">
            <Select
              value={contract}
              onChange={(v) => setContract(v as JobType)}
              options={CONTRACTS}
            />
          </FormRow>
          <FormRow label="Secteur">
            <Select
              value={sector}
              onChange={(v) => setSector(v as Sector)}
              options={SECTORS}
            />
          </FormRow>
          <FormRow label="Niveau">
            <Select
              value={level}
              onChange={(v) => setLevel(v as ExperienceLevel)}
              options={LEVELS}
            />
          </FormRow>
          <FormRow label="Mode">
            <Select
              value={remote}
              onChange={(v) => setRemote(v as EmployerJob["remote"])}
              options={REMOTES}
            />
          </FormRow>
          <FormRow label="Temps de travail">
            <Select
              value={workTime}
              onChange={(v) => setWorkTime(v as WorkTime)}
              options={WORK_TIMES}
            />
          </FormRow>
          <FormRow label="Langue de l'annonce">
            <Select
              value={lang}
              onChange={(v) => setLang(v as "fr" | "en")}
              options={["fr", "en"]}
            />
          </FormRow>
        </div>

        <FormRow label="Lieu">
          <Input
            placeholder="Monaco — Carré d'Or"
            value={location}
            onChange={setLocation}
          />
        </FormRow>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormRow label="Salaire min brut (€/an)" hint="optionnel">
            <Input
              type="number"
              placeholder="35000"
              value={salaryMin}
              onChange={setSalaryMin}
            />
          </FormRow>
          <FormRow label="Salaire max brut (€/an)" hint="optionnel">
            <Input
              type="number"
              placeholder="48000"
              value={salaryMax}
              onChange={setSalaryMax}
            />
          </FormRow>
        </div>

        {/* AI Generate */}
        <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="size-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                <Sparks width={16} height={16} strokeWidth={2} />
              </span>
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  Rediger avec l&apos;IA
                </div>
                <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">
                  Genere l&apos;accroche, la description, les responsabilites, competences recherchees, avantages et tags a partir des infos saisies.
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!title.trim() || aiGenerating}
              onClick={generateWithAi}
              className="h-9 px-4 rounded-full bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
            >
              {aiGenerating ? (
                <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <Sparks width={12} height={12} strokeWidth={2} />
              )}
              {aiGenerating ? "Generation..." : "Generer"}
            </button>
          </div>

          {/* Champ libre pour precisions IA */}
          <div>
            <label className="text-[11.5px] font-medium text-foreground/70 flex items-center gap-1.5 mb-1.5">
              Vos precisions pour l&apos;IA
              <span className="text-[10px] font-normal text-foreground/40">(optionnel)</span>
            </label>
            <textarea
              value={freePrompt}
              onChange={(e) => setFreePrompt(e.target.value)}
              rows={2}
              placeholder={"Ex : Mettre l'accent sur le service client haut de gamme, poste de creation, bilinguisme FR/EN requis, equipe de 12 personnes..."}
              className="w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y"
            />
          </div>

          {aiError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-[12px] text-destructive">
              {aiError}
            </div>
          )}
        </div>

        <FormRow label="Accroche editoriale" hint="2-3 lignes max — l'extrait visible sur le mur. Ex : « Rejoignez notre equipe pour construire des SaaS B2B innovants. Stack moderne, equipe senior. »">
          <Textarea
            placeholder="Reprise d'un portefeuille de 60 familles UHNW. Équipe senior, environnement entrepreneurial."
            value={shortDesc}
            onChange={setShortDesc}
            rows={3}
          />
        </FormRow>

        <FormRow label="Description complete" hint="Decrivez le poste, les missions, le profil recherche et les avantages.">
          <Textarea
            placeholder="Présentez le poste en détail…"
            value={description}
            onChange={setDescription}
            rows={8}
          />
        </FormRow>

        <EditableList
          label="Responsabilités"
          hint="Missions principales du poste"
          items={responsibilities}
          onChange={setResponsibilities}
          placeholder="Ex : Gérer un portefeuille de 40 clients UHNW"
        />

        <EditableList
          label="Profil recherché"
          hint="Compétences, expérience, qualités requises"
          items={requirements}
          onChange={setRequirements}
          placeholder="Ex : 5 ans d'expérience en banque privée"
        />

        <EditableList
          label="Avantages"
          hint="Ce que vous offrez au candidat"
          items={benefits}
          onChange={setBenefits}
          placeholder="Ex : Mutuelle premium, 13e mois"
        />

        <EditableList
          label="Tags"
          hint="Mots-clés pour la recherche (SEO)"
          items={tags}
          onChange={setTags}
          placeholder="Ex : wealth management, UHNW"
        />

        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[12px] text-foreground/60">
            <Sparks width={12} height={12} strokeWidth={2} className="text-[var(--accent)]" />
            Offre publiée pour {user.companyName}
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[13px] text-foreground/80 hover:bg-[var(--background-alt)] transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors"
            >
              {existing ? "Enregistrer" : "Publier l'offre"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── primitives ─── */

function FormRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="wall-select h-[38px] w-full"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function EditableList({
  label,
  hint,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };

  return (
    <FormRow label={label} hint={hint}>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 group">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                className="flex-1 bg-white border border-[var(--border)] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="size-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-foreground/30 hover:text-destructive transition-colors shrink-0 mt-0.5"
              >
                <Xmark width={12} height={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 wall-input h-9 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="h-9 px-3 rounded-full border border-[var(--border)] bg-white text-[12px] text-foreground/75 hover:bg-[var(--background-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <PlusCircle width={12} height={12} strokeWidth={2} />
          Ajouter
        </button>
      </div>
    </FormRow>
  );
}
