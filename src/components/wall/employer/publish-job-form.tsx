"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Rocket, Sparks } from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type EmployerJob,
  createJob,
} from "@/lib/employer-store";
import { createClient } from "@/lib/supabase/client";
import type {
  ExperienceLevel,
  JobType,
  Sector,
  WorkTime,
} from "@/lib/data";

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

  const [aiGenerating, setAiGenerating] = useState(false);

  const generateWithAi = () => {
    if (!title.trim()) return;
    setAiGenerating(true);
    // Fake AI generation (simule un delai de 800ms)
    window.setTimeout(() => {
      const t = title.trim();
      setShortDesc(
        `Nous recherchons un(e) ${t} pour rejoindre notre equipe a ${location || "Monaco"}. Poste en ${contract}, ${remote.toLowerCase()}.`,
      );
      setDescription(
        `Dans le cadre de notre developpement, nous recherchons un(e) ${t}.\n\nVous integrerez une equipe dynamique et participerez activement a la croissance de l'entreprise. Ce poste est une opportunite unique de contribuer a des projets ambitieux dans un environnement stimulant.\n\nVotre mission principale sera de [decrire les missions specifiques du poste]. Vous serez egalement amene(e) a [decrire les responsabilites secondaires].\n\nNous offrons un cadre de travail exceptionnel a Monaco, avec des avantages competitifs et des perspectives d'evolution.`,
      );
      setAiGenerating(false);
    }, 800);
  };

  if (!user || user.role !== "employer" || !user.companyId) {
    return (
      <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi côté recruteur pour publier une offre.
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Sauver dans le store local (pour le dashboard recruteur)
    const job = createJob({
      companyId: user.companyId ?? "",
      title,
      type: contract,
      level,
      sector,
      location,
      remote,
      workTime,
      lang,
      languages: lang === "fr" ? ["Français"] : ["Anglais"],
      salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
      shortDescription: shortDesc,
      description,
      responsibilities: [],
      requirements: [],
      benefits: [],
      tags: [],
    });

    // 2. Inserer aussi dans Supabase (pour que l'offre soit visible publiquement)
    const supabase = createClient();
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) + "-" + Date.now().toString(36).slice(-5);

    await supabase.from("jobs").insert({
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
      responsibilities: [],
      requirements: [],
      benefits: [],
      tags: [],
      status: "published",
      featured: false,
    });

    setSubmitted(job);
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
            <div className="flex items-center gap-2 mb-2">
              <Rocket width={16} height={16} strokeWidth={2} className="text-[var(--accent)]" />
              <span className="text-[13px] font-semibold text-foreground">
                Booster mon offre
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground leading-snug">
              Mettez votre offre en avant sur le mur pour 3x plus de visibilite.
              Les offres boostees apparaissent en tete et dans la section « Mises en avant ».
            </p>
            <button
              type="button"
              className="mt-3 h-9 px-4 rounded-full bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 transition-colors flex items-center gap-1.5"
            >
              <Rocket width={12} height={12} strokeWidth={2} />
              Booster — a partir de 49 EUR
            </button>
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
        <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparks width={14} height={14} strokeWidth={2} className="text-[var(--accent)]" />
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  Formuler l&apos;offre par l&apos;IA
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  Genere automatiquement l&apos;accroche et la description a partir du titre.
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
        </div>

        <FormRow label="Accroche editoriale" hint="2-3 lignes max — l'extrait visible sur le mur. Ex : « Rejoignez notre equipe pour construire des SaaS B2B innovants. Stack moderne, equipe senior. »">
          <Textarea
            placeholder="Reprise d'un portefeuille de 60 familles UHNW. Équipe senior, environnement entrepreneurial."
            value={shortDesc}
            onChange={setShortDesc}
            rows={3}
          />
        </FormRow>

        <FormRow label="Description complete" hint="Decrivez le poste, les missions, le profil recherche et les avantages. Ex : « Dans le cadre de notre developpement, nous recherchons... »">
          <Textarea
            placeholder="Présentez le poste en détail…"
            value={description}
            onChange={setDescription}
            rows={8}
          />
        </FormRow>

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
