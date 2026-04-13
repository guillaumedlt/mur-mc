"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Clock,
  Page,
  PlusCircle,
  Sparks,
  Trash,
  Xmark,
} from "iconoir-react";
import type { Story, StoryCategory } from "@/lib/stories";
import { formatStoryDate, storyCover } from "@/lib/stories";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES: StoryCategory[] = [
  "Marché",
  "Métier",
  "Profil",
  "Coulisses",
  "Données",
];

type Mode = "list" | "create" | "edit";

export function MagazineAdmin() {
  const [mode, setMode] = useState<Mode>("list");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  if (!fetchedOnce) {
    setFetchedOnce(true);
    loadStories();
  }

  function loadStories() {
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("stories")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setStories(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((row: any) => ({
              id: row.id,
              slug: row.slug,
              category: row.category ?? "Marché",
              title: row.title,
              excerpt: row.excerpt ?? "",
              lead: row.lead ?? "",
              body: Array.isArray(row.body) ? row.body : [],
              authorName: row.author_name ?? "Mur.mc",
              authorRole: row.author_role ?? "Rédaction",
              publishedAt: row.published_at ?? new Date().toISOString(),
              updatedAt: row.updated_at ?? undefined,
              readingMinutes: row.reading_minutes ?? 5,
              featured: row.featured ?? false,
              tags: row.tags ?? [],
            })),
          );
        }
        setLoading(false);
      });
  }

  async function deleteStory(id: string) {
    const supabase = createClient();
    await supabase.from("stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  if (mode === "create") {
    return (
      <StoryForm
        onCancel={() => setMode("list")}
        onSaved={() => {
          setMode("list");
          loadStories();
        }}
      />
    );
  }

  if (mode === "edit" && editingStory) {
    return (
      <StoryForm
        story={editingStory}
        onCancel={() => {
          setMode("list");
          setEditingStory(null);
        }}
        onSaved={() => {
          setMode("list");
          setEditingStory(null);
          loadStories();
        }}
      />
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="ed-label-sm">Magazine</p>
            <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Gestion des articles
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {stories.length} article{stories.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode("create")}
            className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
          >
            <PlusCircle width={14} height={14} strokeWidth={2} />
            Nouvel article
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin inline-block" />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center mb-4">
            <Page width={24} height={24} strokeWidth={1.8} />
          </span>
          <p className="font-display italic text-[18px] text-foreground">
            Aucun article pour l&apos;instant.
          </p>
          <p className="text-[13px] text-muted-foreground mt-2 mb-5">
            Publiez votre premier article pour alimenter le magazine.
          </p>
          <button
            type="button"
            onClick={() => setMode("create")}
            className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle width={14} height={14} strokeWidth={2} />
            Créer un article
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stories.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-[var(--border)] rounded-2xl px-5 py-4 flex items-start gap-4 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storyCover(s, 120, 80)}
                alt=""
                className="w-[80px] h-[55px] rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center h-5 px-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold uppercase tracking-[0.06em]">
                    {s.category}
                  </span>
                  {s.featured && (
                    <span className="wall-badge" data-tone="accent">
                      <Sparks /> Featured
                    </span>
                  )}
                </div>
                <h3 className="text-[14px] font-medium text-foreground line-clamp-1">
                  {s.title}
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {s.authorName} · {formatStoryDate(s.publishedAt)} ·{" "}
                  <Clock
                    width={10}
                    height={10}
                    strokeWidth={2}
                    className="inline -mt-px"
                  />{" "}
                  {s.readingMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/stories/${s.slug}`}
                  target="_blank"
                  className="size-8 rounded-full hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                  title="Voir sur le site"
                >
                  <ArrowUpRight width={14} height={14} strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStory(s);
                    setMode("edit");
                  }}
                  className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[11.5px] text-foreground/75 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer "${s.title}" ?`)) {
                      deleteStory(s.id);
                    }
                  }}
                  className="size-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-foreground/40 hover:text-destructive transition-colors"
                  title="Supprimer"
                >
                  <Trash width={13} height={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Story creation/edit form ─────────────────────────── */

function StoryForm({
  story,
  onCancel,
  onSaved,
}: {
  story?: Story;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!story;

  const [title, setTitle] = useState(story?.title ?? "");
  const [slug, setSlug] = useState(story?.slug ?? "");
  const [category, setCategory] = useState<StoryCategory>(
    story?.category ?? "Marché",
  );
  const [excerpt, setExcerpt] = useState(story?.excerpt ?? "");
  const [lead, setLead] = useState(story?.lead ?? "");
  const [authorName, setAuthorName] = useState(story?.authorName ?? "Mur.mc");
  const [authorRole, setAuthorRole] = useState(
    story?.authorRole ?? "Rédaction",
  );
  const [readingMinutes, setReadingMinutes] = useState(
    String(story?.readingMinutes ?? 5),
  );
  const [featured, setFeatured] = useState(story?.featured ?? false);
  const [tagsInput, setTagsInput] = useState(story?.tags.join(", ") ?? "");

  // Body blocks as text (simple WYSIWYG alternative)
  const [bodyBlocks, setBodyBlocks] = useState<Story["body"]>(
    story?.body ?? [{ type: "p", text: "" }],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80);

  const addBlock = (type: "p" | "h2" | "quote") => {
    const block =
      type === "quote"
        ? { type: "quote" as const, text: "", author: "" }
        : { type, text: "" };
    setBodyBlocks([...bodyBlocks, block]);
  };

  const updateBlock = (
    index: number,
    patch: Partial<Story["body"][number]>,
  ) => {
    setBodyBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    );
  };

  const removeBlock = (index: number) => {
    setBodyBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const finalSlug = slug || autoSlug(title);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const cleanBody = bodyBlocks.filter((b) => b.text.trim().length > 0);

    const payload = {
      slug: finalSlug,
      title,
      category,
      excerpt,
      lead,
      body: cleanBody,
      author_name: authorName,
      author_role: authorRole,
      reading_minutes: parseInt(readingMinutes, 10) || 5,
      featured,
      tags,
    };

    try {
      const supabase = createClient();

      if (isEdit && story) {
        const { error: err } = await supabase
          .from("stories")
          .update(payload)
          .eq("id", story.id);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase.from("stories").insert(payload);
        if (err) throw new Error(err.message);
      }

      onSaved();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">
          {isEdit ? "Modifier l'article" : "Nouvel article"}
        </p>
        <h1 className="font-display text-[22px] sm:text-[26px] tracking-[-0.015em] text-foreground mt-1">
          {title || "Sans titre"}
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Metadata card */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6">
          <h2 className="ed-label-sm mb-4">Informations</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">Titre</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEdit) setSlug(autoSlug(e.target.value));
                  }}
                  required
                  className="wall-input h-10 text-[13px]"
                  placeholder="Le titre de l'article"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">Slug</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="wall-input h-10 text-[13px] font-mono"
                  placeholder="slug-de-larticle"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">
                  Catégorie
                </span>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as StoryCategory)
                  }
                  className="wall-select h-10"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">
                  Temps de lecture (min)
                </span>
                <input
                  type="number"
                  min={1}
                  value={readingMinutes}
                  onChange={(e) => setReadingMinutes(e.target.value)}
                  className="wall-input h-10 text-[13px]"
                />
              </label>
              <label className="flex flex-col gap-1 justify-end">
                <label className="flex items-center gap-2 h-10 text-[12.5px] text-foreground/80 cursor-pointer select-none">
                  <span className="wall-check" data-checked={featured} />
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="sr-only"
                  />
                  Article mis en avant
                </label>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">
                  Auteur
                </span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="wall-input h-10 text-[13px]"
                  placeholder="Nom de l'auteur"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-foreground/60">
                  Rôle auteur
                </span>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="wall-input h-10 text-[13px]"
                  placeholder="Rédacteur, Journaliste…"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] text-foreground/60">Résumé</span>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y"
                placeholder="Résumé court visible dans les cards"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] text-foreground/60">Lead</span>
              <textarea
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                rows={3}
                className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y"
                placeholder="Accroche en italique sous le titre (1-2 phrases)"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] text-foreground/60">
                Tags (séparés par des virgules)
              </span>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="wall-input h-10 text-[13px]"
                placeholder="salaires, banque, monaco"
              />
            </label>
          </div>
        </div>

        {/* Body blocks */}
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6">
          <h2 className="ed-label-sm mb-4">Contenu</h2>
          <div className="flex flex-col gap-3">
            {bodyBlocks.map((block, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-foreground/40 uppercase">
                      {block.type === "p"
                        ? "Paragraphe"
                        : block.type === "h2"
                          ? "Titre H2"
                          : "Citation"}
                    </span>
                  </div>
                  <textarea
                    value={block.text}
                    onChange={(e) => updateBlock(i, { text: e.target.value })}
                    rows={block.type === "h2" ? 1 : 4}
                    className={`w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y ${
                      block.type === "h2"
                        ? "font-display text-[16px]"
                        : block.type === "quote"
                          ? "italic"
                          : ""
                    }`}
                    placeholder={
                      block.type === "h2"
                        ? "Titre de section"
                        : block.type === "quote"
                          ? "Texte de la citation"
                          : "Paragraphe…"
                    }
                  />
                  {block.type === "quote" && "author" in block && (
                    <input
                      type="text"
                      value={block.author ?? ""}
                      onChange={(e) => updateBlock(i, { author: e.target.value })}
                      className="wall-input h-8 text-[12px] mt-1"
                      placeholder="Auteur de la citation"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="size-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-foreground/40 hover:text-destructive transition-colors shrink-0 mt-6"
                >
                  <Xmark width={13} height={13} strokeWidth={2} />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => addBlock("p")}
                className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[11.5px] text-foreground/75 hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
              >
                <PlusCircle width={12} height={12} strokeWidth={2} />
                Paragraphe
              </button>
              <button
                type="button"
                onClick={() => addBlock("h2")}
                className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[11.5px] text-foreground/75 hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
              >
                <PlusCircle width={12} height={12} strokeWidth={2} />
                Titre H2
              </button>
              <button
                type="button"
                onClick={() => addBlock("quote")}
                className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[11.5px] text-foreground/75 hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
              >
                <PlusCircle width={12} height={12} strokeWidth={2} />
                Citation
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12.5px] text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/75 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
          >
            {saving ? (
              <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <Check width={14} height={14} strokeWidth={2} />
            )}
            {saving
              ? "Enregistrement…"
              : isEdit
                ? "Mettre à jour"
                : "Publier"}
          </button>
        </div>
      </form>
    </div>
  );
}
