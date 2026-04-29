"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Globe,
  Page,
  PlaySolid,
  PlusCircle,
  Sparks,
  Trash,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useMyCompany, updateCompanySupabase } from "@/lib/supabase/use-my-company";
import { resizeImage } from "@/lib/resize-image";

const SECTORS = [
  "Banque & Finance",
  "Yachting",
  "Hotellerie & Restauration",
  "Luxe & Retail",
  "Tech & Digital",
  "Immobilier",
  "Juridique",
  "Sport & Bien-etre",
  "Evenementiel",
  "Famille / Office",
  "Assurance",
  "Audit & Conseil",
  "BTP & Construction",
  "Commerce & Distribution",
  "Communication & Marketing",
  "Comptabilite",
  "Education & Formation",
  "Industrie",
  "Logistique & Transport",
  "Medical & Sante",
  "Ressources Humaines",
  "Securite",
  "Services a la personne",
  "Consulting",
  "Autre",
];

const SIZES = [
  "1-10",
  "10-50",
  "50-200",
  "200-500",
  "500+",
];

export function CompanyEditor() {
  const user = useUser();
  const { company, loading: companyLoading, refetch } = useMyCompany();
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Form state — identity
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [founded, setFounded] = useState("");

  // Form state — content
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [positioning, setPositioning] = useState("");
  const [culture, setCulture] = useState("");
  const [website, setWebsite] = useState("");
  const [perksInput, setPerksInput] = useState("");
  const [perks, setPerks] = useState<string[]>([]);

  // Gallery photos (data URLs)
  const [photos, setPhotos] = useState<string[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  // Video URLs (YouTube/Vimeo embeds)
  const [videos, setVideos] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");

  // AI generation
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");

  // Logo & cover as data URLs (local preview before save)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Sync from Supabase when loaded
  const companyId = company?.id ?? null;
  const [prevCompanyId, setPrevCompanyId] = useState<string | null>(null);
  if (companyId !== null && companyId !== prevCompanyId) {
    setPrevCompanyId(companyId);
    setCompanyName(company?.name ?? "");
    setSector(company?.sector ?? "");
    setSize(company?.size ?? "");
    setLocation(company?.location ?? "");
    setFounded(company?.founded ? String(company.founded) : "");
    setTagline(company?.tagline ?? "");
    setDescription(company?.description ?? "");
    setPositioning(company?.positioning ?? "");
    setCulture(company?.culture ?? "");
    setWebsite(company?.website ?? "");
    setPerks(company?.perks ?? []);
    setLogoPreview(company?.logo_url ?? null);
    setCoverPreview(company?.cover_url ?? null);
    // Load photos/videos from blocks
    const blocks = (company?.blocks ?? []) as Array<{ type: string; images?: string[]; content?: string }>;
    const galleryBlock = blocks.find((b) => b.type === "gallery");
    setPhotos(galleryBlock?.images ?? []);
    const videoUrls = blocks
      .filter((b) => b.type === "video" && b.content)
      .map((b) => b.content as string);
    setVideos(videoUrls);
  }

  if (companyLoading) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !company) return null;

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    try {
      const dataUrl = await resizeImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.9 });
      setLogoPreview(dataUrl);
    } catch {
      setLogoError("Impossible de charger l'image.");
    }
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(null);
    try {
      const dataUrl = await resizeImage(file, { maxWidth: 1200, maxHeight: 600, quality: 0.85 });
      setCoverPreview(dataUrl);
    } catch {
      setCoverError("Impossible de charger l'image.");
    }
  };

  const addPerk = () => {
    const v = perksInput.trim();
    if (!v) return;
    setPerks([...perks, v]);
    setPerksInput("");
  };

  const onPhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const dataUrl = await resizeImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.85 });
      setPhotos((prev) => [...prev, dataUrl]);
    }
    if (photoRef.current) photoRef.current.value = "";
  };

  const addVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    setVideos((prev) => [...prev, url]);
    setVideoInput("");
  };

  const generateWithAi = async () => {
    if (!companyName.trim()) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/scan-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          domain: website.trim() || undefined,
          sector: sector || undefined,
          size: size || undefined,
          location: location || "Monaco",
          freePrompt: aiPrompt.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error || "Erreur de generation");
      }
      const data = await res.json();
      if (data.tagline) setTagline(data.tagline);
      if (data.description) setDescription(data.description);
      if (data.positioning) setPositioning(data.positioning);
      if (data.culture) setCulture(data.culture);
      if (data.sector) setSector(data.sector);
      if (data.size) setSize(data.size);
      if (Array.isArray(data.perks) && data.perks.length > 0) setPerks(data.perks);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur lors de la generation");
    } finally {
      setAiGenerating(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build blocks from photos + videos
    const blocks: Array<Record<string, unknown>> = [];
    if (photos.length > 0) {
      blocks.push({ id: "gallery-1", type: "gallery", title: "L'entreprise en images", images: photos });
    }
    for (let i = 0; i < videos.length; i++) {
      blocks.push({ id: `video-${i}`, type: "video", title: "Video", content: videos[i] });
    }

    setSaveError(null);
    const result = await updateCompanySupabase(company.id, {
      name: companyName || company.name,
      sector: sector || null,
      size: size || null,
      location: location || "Monaco",
      founded: founded ? parseInt(founded, 10) : null,
      initials: (companyName || company.name)
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3),
      tagline: tagline || null,
      description: description || null,
      positioning: positioning || null,
      culture: culture || null,
      perks,
      website: website || null,
      domain: website ? website.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null,
      logo_url: logoPreview || null,
      cover_url: coverPreview || null,
      has_cover: !!coverPreview,
      blocks,
    });

    if (!result.ok) {
      setSaveError(result.error ?? "Impossible d'enregistrer la fiche entreprise");
      return;
    }

    setSavedFlash(true);
    window.setTimeout(() => {
      setSavedFlash(false);
      refetch();
    }, 1500);
  };

  const logoDisplay = logoPreview || null;
  const coverDisplay = coverPreview || null;

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            {/* Logo preview */}
            <div className="relative shrink-0">
              {logoDisplay ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDisplay}
                  alt={company.name}
                  className="size-14 rounded-2xl object-cover ring-1 ring-black/5"
                />
              ) : (
                <span
                  className="size-14 rounded-2xl flex items-center justify-center text-white font-display text-[18px] font-medium ring-1 ring-black/5"
                  style={{ background: company.logo_color }}
                >
                  {company.initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="ed-label-sm">Ma fiche entreprise</p>
              <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
                {companyName || company.name}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Les modifications sont visibles sur la fiche publique apres enregistrement.
              </p>
            </div>
          </div>
        </div>
      </header>

      <form
        onSubmit={onSave}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start"
      >
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Identite */}
          <Card title="Identite de l'entreprise">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow label="Nom de l'entreprise">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex. Monte-Carlo SBM"
                  className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </FormRow>
              <FormRow label="Secteur">
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="wall-select h-[38px] w-full"
                >
                  <option value="">Choisir un secteur</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Taille de l'entreprise">
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="wall-select h-[38px] w-full"
                >
                  <option value="">Non renseignee</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Localisation">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Monaco"
                  className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </FormRow>
              <FormRow label="Annee de fondation" hint="optionnel">
                <input
                  type="number"
                  value={founded}
                  onChange={(e) => setFounded(e.target.value)}
                  placeholder="Ex. 1863"
                  className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </FormRow>
              <FormRow label="Site web">
                <div className="wall-input flex-1">
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
              </FormRow>
            </div>
          </Card>

          {/* AI Generate */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="size-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparks width={16} height={16} strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    Rediger la fiche avec l&apos;IA
                  </div>
                  <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">
                    Genere automatiquement la tagline, description, positionnement, culture et avantages a partir du nom et du site web.
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={!companyName.trim() || aiGenerating}
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
            <div>
              <label className="text-[11.5px] font-medium text-foreground/70 flex items-center gap-1.5 mb-1.5">
                Vos precisions pour l&apos;IA
                <span className="text-[10px] font-normal text-foreground/40">(optionnel)</span>
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={2}
                placeholder={"Ex : Specialises en gestion de fortune UHNW, ambiance startup dans le luxe, equipe jeune et internationale..."}
                className="w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y"
              />
            </div>
            {aiError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-[12px] text-destructive">
                {aiError}
              </div>
            )}
          </div>

          {/* Logo */}
          <Card title="Logo de l'entreprise">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {logoDisplay ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoDisplay}
                    alt="Logo"
                    className="size-20 rounded-2xl object-cover ring-1 ring-black/5"
                  />
                ) : (
                  <span
                    className="size-20 rounded-2xl flex items-center justify-center text-white font-display text-[24px] font-medium ring-1 ring-black/5"
                    style={{ background: company.logo_color }}
                  >
                    {company.initials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="absolute -bottom-1 -right-1 size-7 rounded-full border-2 border-white bg-foreground text-background flex items-center justify-center hover:bg-foreground/85 transition-colors"
                  aria-label="Changer le logo"
                >
                  <Camera width={12} height={12} strokeWidth={2.2} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground">
                  {logoDisplay ? "Logo personnalise" : "Pas de logo — les initiales sont affichees"}
                </p>
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  JPG ou PNG, carre recommande (256 x 256 px)
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="text-[12px] text-[var(--accent)] hover:underline underline-offset-2"
                  >
                    {logoDisplay ? "Changer" : "Telecharger un logo"}
                  </button>
                  {logoDisplay && (
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="text-[12px] text-foreground/55 hover:text-destructive transition-colors inline-flex items-center gap-1"
                    >
                      <Trash width={10} height={10} strokeWidth={2} />
                      Retirer
                    </button>
                  )}
                </div>
                {logoError && (
                  <p className="text-[11.5px] text-destructive mt-1">{logoError}</p>
                )}
              </div>
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onLogoChange}
            />
          </Card>

          {/* Cover */}
          <Card title="Photo de couverture">
            {coverDisplay ? (
              <div className="relative rounded-xl overflow-hidden h-[180px] sm:h-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverDisplay}
                  alt="Couverture"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    className="size-8 rounded-full bg-white/90 border border-[var(--border)] flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                    aria-label="Changer la couverture"
                  >
                    <Camera width={13} height={13} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverPreview(null)}
                    className="size-8 rounded-full bg-white/90 border border-[var(--border)] flex items-center justify-center text-foreground/55 hover:text-destructive transition-colors"
                    aria-label="Retirer la couverture"
                  >
                    <Trash width={13} height={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/50 hover:bg-[var(--background-alt)] transition-colors p-8 text-center"
              >
                <span className="size-10 rounded-xl bg-white border border-[var(--border)] inline-flex items-center justify-center text-foreground/55 mb-3">
                  <Page width={16} height={16} strokeWidth={2} />
                </span>
                <div className="text-[13px] font-medium text-foreground">
                  Ajouter une photo de couverture
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1">
                  JPG/PNG, 1600 x 520 recommande
                </div>
              </button>
            )}
            {coverError && (
              <p className="text-[11.5px] text-destructive mt-2">{coverError}</p>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCoverChange}
            />
          </Card>

          {/* Infos principales */}
          <Card title="Accroche">
            <FormRow label="Tagline" hint="Phrase d'accroche courte, affichee en overlay sur la couverture">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex. Le groupe historique qui fait vivre Monte-Carlo"
                className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
              />
            </FormRow>
          </Card>

          {/* Description */}
          <Card title="Presentation">
            <FormRow label="Description" hint="Presentez votre entreprise en quelques paragraphes">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="L'histoire, la mission, le coeur de metier de votre entreprise..."
                className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.65] resize-y"
              />
            </FormRow>
            <FormRow label="Positionnement" hint="Ce qui vous differencie de vos concurrents">
              <textarea
                value={positioning}
                onChange={(e) => setPositioning(e.target.value)}
                rows={3}
                placeholder="Ex. Leader dans l'hotellerie de luxe a Monaco depuis 1863..."
                className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.65] resize-y"
              />
            </FormRow>
            <FormRow label="Culture d'entreprise" hint="L'ambiance, les valeurs, le quotidien de vos equipes">
              <textarea
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                rows={3}
                placeholder="Ex. Esprit famille, exigence du detail, mobilite interne encouragee..."
                className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.65] resize-y"
              />
            </FormRow>
          </Card>

          {/* Avantages */}
          <Card title="Avantages">
            {perks.length > 0 && (
              <ul className="flex flex-col gap-1.5 mb-3">
                {perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 group">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const next = [...perks];
                        next[i] = e.target.value;
                        setPerks(next);
                      }}
                      className="flex-1 bg-white border border-[var(--border)] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setPerks(perks.filter((_, j) => j !== i))}
                      className="size-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-foreground/30 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash width={11} height={11} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={perksInput}
                onChange={(e) => setPerksInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addPerk(); }
                }}
                placeholder="Ex. Mutuelle premium, 13e mois, parking..."
                className="flex-1 wall-input h-9 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
              />
              <button
                type="button"
                onClick={addPerk}
                disabled={!perksInput.trim()}
                className="h-9 px-3 rounded-full border border-[var(--border)] bg-white text-[12px] text-foreground/75 hover:bg-[var(--background-alt)] disabled:opacity-40 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </Card>
          {/* Photos */}
          <Card title="L'entreprise en images">
            <p className="text-[12px] text-muted-foreground -mt-2 mb-2">
              Montrez vos locaux, vos equipes, vos evenements — comme sur Welcome to the Jungle.
            </p>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--background-alt)] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Supprimer"
                    >
                      <Xmark width={14} height={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/50 hover:bg-[var(--background-alt)] transition-colors p-6 text-center"
            >
              <span className="size-10 rounded-xl bg-white border border-[var(--border)] inline-flex items-center justify-center text-foreground/55 mb-2">
                <Camera width={16} height={16} strokeWidth={2} />
              </span>
              <div className="text-[13px] font-medium text-foreground">
                Ajouter des photos
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                JPG/PNG — max 800px, selection multiple possible
              </div>
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPhotoAdd}
            />
          </Card>

          {/* Videos */}
          <Card title="Videos">
            <p className="text-[12px] text-muted-foreground -mt-2 mb-2">
              Collez des liens YouTube ou Vimeo pour presenter votre entreprise en video.
            </p>
            {videos.length > 0 && (
              <ul className="flex flex-col gap-2 mb-2">
                {videos.map((url, i) => (
                  <li key={i} className="flex items-center gap-2 group">
                    <span className="size-8 rounded-lg bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center text-foreground/50 shrink-0">
                      <PlaySolid width={10} height={10} />
                    </span>
                    <span className="flex-1 text-[12.5px] text-foreground truncate">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideos(videos.filter((_, j) => j !== i))}
                      className="size-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-foreground/30 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash width={11} height={11} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addVideo(); }
                }}
                placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                className="flex-1 wall-input h-9 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
              />
              <button
                type="button"
                onClick={addVideo}
                disabled={!videoInput.trim()}
                className="h-9 px-3 rounded-full border border-[var(--border)] bg-white text-[12px] text-foreground/75 hover:bg-[var(--background-alt)] disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <PlusCircle width={12} height={12} strokeWidth={2} />
                Ajouter
              </button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
            >
              {savedFlash ? (
                <>
                  <BadgeCheck width={14} height={14} strokeWidth={2} />
                  Enregistre
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
            {saveError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-[11.5px] text-destructive">
                {saveError}
              </div>
            )}
            <Link
              href={`/entreprises/${company.slug}`}
              target="_blank"
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
            >
              Voir la fiche publique
              <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
            </Link>
          </div>

          {/* Info box */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-2">Apercu</p>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-foreground/55">Nom</dt>
                <dd className="text-foreground">{companyName || company.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Secteur</dt>
                <dd className="text-foreground">{sector || "Non renseigne"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Taille</dt>
                <dd className="text-foreground">{size || "Non renseignee"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Lieu</dt>
                <dd className="text-foreground">{location || "Monaco"}</dd>
              </div>
              {founded && (
                <div className="flex justify-between">
                  <dt className="text-foreground/55">Fondee</dt>
                  <dd className="text-foreground">{founded}</dd>
                </div>
              )}
              {photos.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-foreground/55">Photos</dt>
                  <dd className="text-foreground">{photos.length}</dd>
                </div>
              )}
              {videos.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-foreground/55">Videos</dt>
                  <dd className="text-foreground">{videos.length}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </form>
    </div>
  );
}

/* ─── Primitives ─── */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
      <p className="ed-label-sm mb-4">{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </article>
  );
}

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
      {hint && (
        <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
