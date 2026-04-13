"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building,
  Calendar,
  Camera,
  Download,
  Globe,
  Group,
  Hashtag,
  Language as LanguageIcon,
  Lock,
  Mail,
  MapPin,
  Page,
  PageStar,
  PlusCircle,
  Suitcase,
  Trash,
  User as UserIcon,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type Experience,
  profileCompletion,
  removeAvatar,
  removeCv,
  setAvatarFromFile,
  setCv,
  updateProfile,
  useCandidate,
} from "@/lib/candidate-store";
import type { Sector } from "@/lib/data";
import { UserAvatar } from "./user-avatar";
import { Card, Field, SkillChip, Textarea, formatBytes, formatRelative } from "./profile-primitives";
import { ExperienceForm } from "./experience-form";

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

const LANGUAGES = [
  "Français",
  "Anglais",
  "Italien",
  "Espagnol",
  "Allemand",
  "Russe",
  "Mandarin",
  "Arabe",
];

export function ProfileEditor() {
  const user = useUser();
  const router = useRouter();
  const { profile } = useCandidate();

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi côté candidat pour accéder à ton profil.
        </p>
      </div>
    );
  }

  return <ProfileForm key={profile.email || "empty"} user={user} />;
}

function ProfileForm({ user }: { user: NonNullable<ReturnType<typeof useUser>> }) {
  const { profile } = useCandidate();
  const cvFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [experienceYears, setExperienceYears] = useState<string>(
    profile.experienceYears !== undefined
      ? String(profile.experienceYears)
      : "",
  );
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [sectors, setSectors] = useState<Sector[]>(profile.sectors);
  const [experiences, setExperiences] = useState<Experience[]>(
    profile.experiences,
  );
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [skillInput, setSkillInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl ?? "");

  const completion = profileCompletion(profile);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile({
      fullName,
      email,
      phone: phone || undefined,
      location: location || undefined,
      headline: headline || undefined,
      bio: bio || undefined,
      experienceYears: experienceYears
        ? Math.max(0, parseInt(experienceYears, 10))
        : undefined,
      languages,
      sectors,
      experiences,
      skills,
      linkedinUrl: linkedinUrl || undefined,
      websiteUrl: websiteUrl || undefined,
    });

    if (user) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          full_name: fullName || undefined,
          phone: phone || null,
          location: location || null,
          headline: headline || null,
          bio: bio || null,
          experience_years: experienceYears
            ? Math.max(0, parseInt(experienceYears, 10))
            : null,
          skills,
          languages,
          sectors,
          linkedin_url: linkedinUrl || null,
          website_url: websiteUrl || null,
        })
        .eq("id", user.id);
    }

    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 1024 * 1024) {
      setPhotoError("Image trop lourde (max 1 Mo). Compresse-la avant.");
      return;
    }
    try {
      await setAvatarFromFile(file);
    } catch {
      setPhotoError("Impossible d'enregistrer l'image (quota dépassé).");
    }
  };

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "",
      company: "",
      location: "",
      startYear: new Date().getFullYear(),
      current: true,
      description: "",
    };
    setExperiences([newExp, ...experiences]);
  };

  const updateExperience = (id: string, patch: Partial<Experience>) => {
    setExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const removeExperience = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const onCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCv(file);
  };

  const toggleLang = (l: string) => {
    setLanguages((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );
  };

  const toggleSector = (s: Sector) => {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href="/candidat"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Mon espace candidat
      </Link>

      {/* Hero + completion */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="relative shrink-0 group/avatar">
            <button
              type="button"
              onClick={() => photoFileRef.current?.click()}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-2xl"
              aria-label="Téléverser une photo"
            >
              <UserAvatar user={user} size={72} radius={18} />
            </button>
            <button
              type="button"
              onClick={() => photoFileRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-7 rounded-full border-2 border-white bg-foreground text-background flex items-center justify-center hover:bg-foreground/85 transition-colors"
              aria-label="Modifier la photo"
            >
              <Camera width={12} height={12} strokeWidth={2.2} />
            </button>
            {profile.avatarDataUrl && (
              <button
                type="button"
                onClick={() => removeAvatar()}
                className="absolute -top-1 -right-1 size-5 rounded-full border-2 border-white bg-white text-foreground/55 hover:text-destructive flex items-center justify-center shadow-[0_1px_4px_rgba(10,10,10,0.18)]"
                aria-label="Retirer la photo"
              >
                <Xmark width={10} height={10} strokeWidth={2.4} />
              </button>
            )}
            <input
              ref={photoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="ed-label-sm">Mon profil</p>
            <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              {fullName || "Profil candidat"}
            </h1>
            {headline && (
              <p className="text-[13.5px] text-muted-foreground mt-1">
                {headline}
              </p>
            )}
            {photoError && (
              <p className="text-[11.5px] text-destructive mt-1.5">
                {photoError}
              </p>
            )}
          </div>
        </div>

        {/* Completion gauge */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-foreground/60">Complétude du profil</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {completion}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </header>

      <form
        onSubmit={onSave}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start"
      >
        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Identité */}
          <Card title="Identité">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                icon={UserIcon}
                placeholder="Nom complet"
                value={fullName}
                onChange={setFullName}
              />
              <Field
                icon={Mail}
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={setEmail}
              />
              <Field
                icon={Lock}
                type="tel"
                placeholder="Téléphone"
                value={phone}
                onChange={setPhone}
              />
              <Field
                icon={MapPin}
                placeholder="Lieu (Monaco, Beausoleil…)"
                value={location}
                onChange={setLocation}
              />
            </div>
          </Card>

          {/* Profil pro */}
          <Card title="Profil professionnel">
            <Field
              icon={Building}
              placeholder="Intitulé actuel (Wealth Manager, Chef de Rang…)"
              value={headline}
              onChange={setHeadline}
            />
            <Textarea
              placeholder="Présente-toi en quelques lignes : ton expérience, ton positionnement, ce que tu cherches."
              value={bio}
              onChange={setBio}
              rows={5}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                icon={Calendar}
                type="number"
                placeholder="Années d'expérience"
                value={experienceYears}
                onChange={setExperienceYears}
              />
              <div /> {/* spacer */}
            </div>
          </Card>

          {/* Expériences */}
          <Card title="Expériences professionnelles" icon={Suitcase}>
            {experiences.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/40 p-6 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Ajoute tes expériences pour aider les recruteurs à mieux te
                  comprendre.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {experiences.map((exp) => (
                <ExperienceForm
                  key={exp.id}
                  exp={exp}
                  onChange={(patch) => updateExperience(exp.id, patch)}
                  onRemove={() => removeExperience(exp.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="self-start mt-1 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground transition-colors"
            >
              <PlusCircle width={13} height={13} strokeWidth={2} />
              Ajouter une expérience
            </button>
          </Card>

          {/* Compétences */}
          <Card title="Compétences" icon={Hashtag}>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <SkillChip key={s} skill={s} onRemove={() => removeSkill(s)} />
              ))}
              {skills.length === 0 && (
                <p className="text-[12.5px] text-muted-foreground">
                  Aucune compétence ajoutée pour l&apos;instant.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Ajouter une compétence (Excel, FINMA, Pitch deck…)"
                className="wall-input flex-1 h-10 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                disabled={!skillInput.trim()}
                className="h-10 px-3.5 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <PlusCircle width={12} height={12} strokeWidth={2} />
                Ajouter
              </button>
            </div>
            <p className="text-[10.5px] text-[var(--tertiary-foreground)] mt-1">
              Astuce : tape entrée ou virgule pour valider rapidement.
            </p>
          </Card>

          {/* Langues */}
          <Card title="Langues parlées" icon={LanguageIcon}>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => {
                const active = languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={`h-8 px-3 rounded-full text-[12px] border transition-colors ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Secteurs */}
          <Card title="Secteurs visés" icon={Group}>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => {
                const active = sectors.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSector(s)}
                    className={`h-8 px-3 rounded-full text-[12px] border transition-colors ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Liens */}
          <Card title="Liens">
            <Field
              icon={Globe}
              placeholder="LinkedIn (linkedin.com/in/…)"
              value={linkedinUrl}
              onChange={setLinkedinUrl}
            />
            <Field
              icon={Globe}
              placeholder="Site personnel ou portfolio"
              value={websiteUrl}
              onChange={setWebsiteUrl}
            />
          </Card>
        </div>

        {/* Sidebar : CV + actions */}
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          {/* CV upload */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Mon CV</p>
            {profile.cv ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)] p-3.5 flex items-start gap-3">
                <span className="size-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-foreground/60 shrink-0">
                  <PageStar width={16} height={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground truncate">
                    {profile.cv.fileName}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatBytes(profile.cv.sizeBytes)} ·{" "}
                    {formatRelative(profile.cv.uploadedAt)}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => cvFileRef.current?.click()}
                      className="text-[11.5px] text-[var(--accent)] hover:underline underline-offset-2"
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCv()}
                      className="text-[11.5px] text-foreground/55 hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      <Trash width={10} height={10} strokeWidth={2} />
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cvFileRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/50 hover:bg-[var(--background-alt)] transition-colors p-6 text-center"
              >
                <span className="size-10 rounded-xl bg-white border border-[var(--border)] inline-flex items-center justify-center text-foreground/55 mb-3">
                  <Page width={16} height={16} strokeWidth={2} />
                </span>
                <div className="text-[13px] font-medium text-foreground">
                  Téléverser mon CV
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1">
                  PDF, DOC ou DOCX · 5 Mo max
                </div>
              </button>
            )}
            <input
              ref={cvFileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={onCvChange}
            />
            <p className="text-[10.5px] text-[var(--tertiary-foreground)] mt-3 leading-snug">
              Démo : seul le nom et la taille du fichier sont stockés
              localement, le binaire n&apos;est pas envoyé.
            </p>
          </div>

          {/* Save + Download CV */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
            >
              {savedFlash ? (
                <>
                  <BadgeCheck width={14} height={14} strokeWidth={2} />
                  Profil enregistré
                </>
              ) : (
                "Enregistrer mes modifications"
              )}
            </button>
            <Link
              href="/candidat/cv"
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
            >
              <Download width={13} height={13} strokeWidth={2} />
              Télécharger mon CV (PDF)
            </Link>
            <p className="text-[11px] text-center text-foreground/55 mt-1">
              Les recruteurs verront ces infos quand tu postules.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
