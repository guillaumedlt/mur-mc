"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Globe,
  Page,
  Trash,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useMyCompany, updateCompanySupabase } from "@/lib/supabase/use-my-company";
import { resizeImage } from "@/lib/resize-image";

export function CompanyEditor() {
  const user = useUser();
  const { company, loading: companyLoading, refetch } = useMyCompany();
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Form state
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [positioning, setPositioning] = useState("");
  const [culture, setCulture] = useState("");
  const [website, setWebsite] = useState("");
  const [perksInput, setPerksInput] = useState("");
  const [perks, setPerks] = useState<string[]>([]);

  // Logo & cover as data URLs (local preview before save)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Sync from Supabase when loaded
  const companyId = company?.id ?? null;
  const [prevCompanyId, setPrevCompanyId] = useState<string | null>(null);
  if (companyId !== null && companyId !== prevCompanyId) {
    setPrevCompanyId(companyId);
    setTagline(company?.tagline ?? "");
    setDescription(company?.description ?? "");
    setPositioning(company?.positioning ?? "");
    setCulture(company?.culture ?? "");
    setWebsite(company?.website ?? "");
    setPerks(company?.perks ?? []);
    setLogoPreview(company?.logo_url ?? null);
    setCoverPreview(company?.cover_url ?? null);
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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateCompanySupabase(company.id, {
      tagline: tagline || null,
      description: description || null,
      positioning: positioning || null,
      culture: culture || null,
      perks,
      website: website || null,
      logo_url: logoPreview || null,
      cover_url: coverPreview || null,
      has_cover: !!coverPreview,
    });

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
                {company.name}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Les modifications sont visibles sur la fiche publique apres enregistrement.
              </p>
            </div>
          </div>
          <Link
            href={`/entreprises/${company.slug}`}
            target="_blank"
            className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-2 shrink-0"
          >
            Voir la fiche publique
            <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
          </Link>
        </div>
      </header>

      <form
        onSubmit={onSave}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start"
      >
        <div className="lg:col-span-2 flex flex-col gap-3">

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
          <Card title="Informations">
            <FormRow label="Tagline" hint="Phrase d'accroche courte, visible en haut de la fiche">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex. Le groupe historique qui fait vivre Monte-Carlo"
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
            <p className="ed-label-sm mb-2">A propos</p>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-foreground/55">Nom</dt>
                <dd className="text-foreground">{company.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Secteur</dt>
                <dd className="text-foreground">{company.sector}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Taille</dt>
                <dd className="text-foreground">{company.size || "Non renseignee"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/55">Localisation</dt>
                <dd className="text-foreground">{company.location}</dd>
              </div>
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
