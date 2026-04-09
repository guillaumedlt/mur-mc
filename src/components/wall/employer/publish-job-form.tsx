"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Sparks } from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type EmployerJob,
  createJob,
} from "@/lib/employer-store";
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
];
const LEVELS: ExperienceLevel[] = [
  "Junior",
  "Confirmé",
  "Senior",
  "Manager",
  "Direction",
];
const REMOTES: EmployerJob["remote"][] = ["Sur site", "Hybride", "Full remote"];
const WORK_TIMES: WorkTime[] = ["Temps plein", "Temps partiel"];

type Props = { existing?: EmployerJob; onCancel?: () => void };

export function PublishJobForm({ existing, onCancel }: Props) {
  const user = useUser();
  const router = useRouter();
  const [submitted, setSubmitted] = useState<EmployerJob | null>(null);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [contract, setContract] = useState<JobType>(existing?.type ?? "CDI");
  const [level, setLevel] = useState<ExperienceLevel>(existing?.level ?? "Confirmé");
  const [sector, setSector] = useState<Sector>(
    existing?.sector ?? "Hôtellerie & Restauration",
  );
  const [location, setLocation] = useState(existing?.location ?? "Monaco");
  const [remote, setRemote] = useState<EmployerJob["remote"]>(
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

  if (!user || user.role !== "employer" || !user.companyId) {
    return (
      <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi côté recruteur pour publier une offre.
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <FormRow label="Salaire min (€/an)" hint="optionnel">
            <Input
              type="number"
              placeholder="35000"
              value={salaryMin}
              onChange={setSalaryMin}
            />
          </FormRow>
          <FormRow label="Salaire max (€/an)" hint="optionnel">
            <Input
              type="number"
              placeholder="48000"
              value={salaryMax}
              onChange={setSalaryMax}
            />
          </FormRow>
        </div>

        <FormRow label="Accroche éditoriale" hint="2-3 lignes max — l'extrait visible sur le mur">
          <Textarea
            placeholder="Reprise d'un portefeuille de 60 familles UHNW. Équipe senior, environnement entrepreneurial."
            value={shortDesc}
            onChange={setShortDesc}
            rows={3}
          />
        </FormRow>

        <FormRow label="Description complète" hint="Missions, profil recherché, avantages…">
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
