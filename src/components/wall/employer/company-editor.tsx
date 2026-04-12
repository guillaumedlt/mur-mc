"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Globe,
  Page,
  Trash,
} from "iconoir-react";
import {
  removeCover,
  setCoverFromFile,
  updateCompanyProfile,
  useEmployer,
} from "@/lib/employer-store";
import { BlockEditor } from "./block-editor";
import { useUser } from "@/lib/auth";
import { companies } from "@/lib/data";
import { CompanyLogo } from "../company-logo";

export function CompanyEditor() {
  const user = useUser();
  const { companyProfile } = useEmployer();
  const coverRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const company = useMemo(
    () => companies.find((c) => c.id === user?.companyId),
    [user?.companyId],
  );

  // Local form state, initialized from override → fallback to data.ts
  const merged = useMemo(() => {
    if (!company) return null;
    return {
      tagline: companyProfile?.tagline ?? company.tagline ?? "",
      description: companyProfile?.description ?? company.description ?? "",
      positioning: companyProfile?.positioning ?? company.positioning ?? "",
      culture: companyProfile?.culture ?? company.culture ?? "",
      perks: companyProfile?.perks ?? company.perks ?? [],
      website: companyProfile?.website ?? company.website ?? "",
      hasCover: companyProfile?.hasCover ?? company.hasCover ?? false,
    };
  }, [company, companyProfile]);

  const [tagline, setTagline] = useState(merged?.tagline ?? "");
  const [description, setDescription] = useState(merged?.description ?? "");
  const [positioning, setPositioning] = useState(merged?.positioning ?? "");
  const [culture, setCulture] = useState(merged?.culture ?? "");
  const [perks, setPerks] = useState<string[]>(merged?.perks ?? []);
  const [website, setWebsite] = useState(merged?.website ?? "");

  // Resync if merged changes (login d'un autre user, etc.)
  const [prevCompanyId, setPrevCompanyId] = useState(company?.id);
  if (company?.id !== prevCompanyId) {
    setPrevCompanyId(company?.id);
    setTagline(merged?.tagline ?? "");
    setDescription(merged?.description ?? "");
    setPositioning(merged?.positioning ?? "");
    setCulture(merged?.culture ?? "");
    setPerks(merged?.perks ?? []);
    setWebsite(merged?.website ?? "");
  }

  if (!user || !company) return null;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Store local
    updateCompanyProfile({
      companyId: company.id,
      tagline: tagline || undefined,
      description: description || undefined,
      positioning: positioning || undefined,
      culture: culture || undefined,
      perks,
      website: website || undefined,
      hasCover: !!companyProfile?.coverDataUrl || company.hasCover,
    });

    // 2. Supabase
    if (user?.companyId) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("companies")
        .update({
          tagline: tagline || null,
          description: description || null,
          positioning: positioning || null,
          culture: culture || null,
          perks,
          website: website || null,
          blocks: companyProfile?.blocks ?? [],
        })
        .eq("id", user.companyId);
    }

    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(null);
    // Initialize company profile first if needed
    if (!companyProfile) {
      updateCompanyProfile({ companyId: company.id });
    }
    try {
      await setCoverFromFile(file);
    } catch {
      setCoverError("Image trop lourde (max ~800 Ko).");
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <CompanyLogo
              name={company.name}
              domain={company.domain}
              color={company.logoColor}
              initials={company.initials}
              size={56}
              radius={16}
            />
            <div className="min-w-0">
              <p className="ed-label-sm">Ma fiche entreprise</p>
              <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
                {company.name}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Tes modifications seront visibles sur la fiche publique.
              </p>
            </div>
          </div>
          <Link
            href={`/entreprises/${company.slug}`}
            target="_blank"
            className="h-10 px-3 sm:px-4 rounded-full border border-[var(--border)] bg-white text-[12.5px] sm:text-[13px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-2 shrink-0"
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
          {/* Cover photo */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <p className="ed-label-sm mb-3">Photo de couverture</p>
            {companyProfile?.coverDataUrl ? (
              <div className="relative rounded-xl overflow-hidden h-[180px] sm:h-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyProfile.coverDataUrl}
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
                    onClick={() => removeCover()}
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
                  JPG/PNG, 1600 x 520 recommandé
                </div>
              </button>
            )}
            {coverError && (
              <p className="text-[11.5px] text-destructive mt-2">
                {coverError}
              </p>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCoverChange}
            />
          </article>

          {/* Infos essentielles */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 flex flex-col gap-4">
            <FormRow label="Tagline" hint="Phrase d'accroche courte, affichee en overlay sur le cover">
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
          </article>

          {/* Blocs de contenu */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="ed-label-sm">Contenu de la fiche</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Ajoutez et ordonnez vos blocs : texte, images, citations, chiffres, avantages.
                </p>
              </div>
            </div>
            <BlockEditor blocks={companyProfile?.blocks ?? []} />
          </article>
        </div>

        {/* Sidebar save */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-foreground text-background text-[13.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
            >
              {savedFlash ? (
                <>
                  <BadgeCheck width={14} height={14} strokeWidth={2} />
                  Modifications enregistrées
                </>
              ) : (
                "Enregistrer les modifications"
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
            <p className="text-[11px] text-center text-foreground/55 mt-1">
              Les changements sont visibles immédiatement sur la fiche publique.
            </p>
          </div>
        </aside>
      </form>
    </div>
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
