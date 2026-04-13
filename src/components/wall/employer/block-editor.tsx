"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Hashtag,
  List,
  MessageText,
  MultiplePages,
  Page,
  PlusCircle,
  Trash,
  Xmark,
} from "iconoir-react";
import {
  type BlockType,
  type CompanyBlock,
  addBlock,
  addImageToBlock,
  blockTypeLabel,
  moveBlock,
  removeBlock,
  removeImageFromBlock,
  updateBlock,
} from "@/lib/employer-store";
import { resizeImage } from "@/lib/resize-image";

type Props = {
  blocks: CompanyBlock[];
};

const BLOCK_TYPES: Array<{
  type: BlockType;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { type: "text", label: "Texte", icon: MultiplePages },
  { type: "image", label: "Image", icon: Camera },
  { type: "gallery", label: "Galerie", icon: Page },
  { type: "quote", label: "Citation", icon: MessageText },
  { type: "stats", label: "Chiffres cles", icon: Hashtag },
  { type: "perks", label: "Avantages", icon: List },
];

export function BlockEditor({ blocks }: Props) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/40 p-10 text-center">
          <MultiplePages
            width={22}
            height={22}
            strokeWidth={1.6}
            className="text-foreground/40 inline-block"
          />
          <p className="text-[13.5px] text-muted-foreground mt-3">
            Aucun bloc pour l&apos;instant. Ajoutez du contenu a votre fiche
            entreprise.
          </p>
        </div>
      )}

      {blocks.map((block, idx) => (
        <BlockItem
          key={block.id}
          block={block}
          isFirst={idx === 0}
          isLast={idx === blocks.length - 1}
        />
      ))}

      {/* Add block button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setAddMenuOpen((v) => !v)}
          className="w-full h-11 rounded-xl border border-dashed border-[var(--border)] bg-white hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2 text-[13px] text-foreground/70 hover:text-foreground"
        >
          <PlusCircle width={14} height={14} strokeWidth={2} />
          Ajouter un bloc
        </button>
        {addMenuOpen && (
          <div
            className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-[var(--border)] rounded-2xl shadow-[0_12px_32px_-8px_rgba(10,10,10,0.18)] p-2 z-10"
            onMouseLeave={() => setAddMenuOpen(false)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    addBlock(type);
                    setAddMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--background-alt)] transition-colors text-left"
                >
                  <span className="size-8 rounded-lg bg-[var(--background-alt)] flex items-center justify-center text-foreground/60 shrink-0">
                    <Icon width={14} height={14} strokeWidth={2} />
                  </span>
                  <span className="text-[12.5px] font-medium text-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Block item wrapper ─────────────────────────────────── */

function BlockItem({
  block,
  isFirst,
  isLast,
}: {
  block: CompanyBlock;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="group/block relative rounded-2xl border border-[var(--border)] bg-white hover:border-foreground/15 transition-colors">
      {/* Toolbar */}
      <div className="absolute -top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
        <ToolBtn
          icon={ArrowUp}
          label="Monter"
          disabled={isFirst}
          onClick={() => moveBlock(block.id, "up")}
        />
        <ToolBtn
          icon={ArrowDown}
          label="Descendre"
          disabled={isLast}
          onClick={() => moveBlock(block.id, "down")}
        />
        <ToolBtn
          icon={Trash}
          label="Supprimer"
          danger
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm("Supprimer ce bloc ?")
            ) {
              removeBlock(block.id);
            }
          }}
        />
      </div>

      {/* Type badge */}
      <div className="px-4 pt-3 flex items-center gap-2">
        <span className="wall-badge" data-tone="muted">
          {blockTypeLabel(block.type)}
        </span>
        <input
          type="text"
          value={block.title ?? ""}
          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
          placeholder="Titre de section"
          className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60 bg-transparent outline-none flex-1 placeholder:text-foreground/30"
        />
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {block.type === "text" && <TextBlockEditor block={block} />}
        {block.type === "image" && <ImageBlockEditor block={block} />}
        {block.type === "gallery" && <GalleryBlockEditor block={block} />}
        {block.type === "quote" && <QuoteBlockEditor block={block} />}
        {block.type === "stats" && <StatsBlockEditor block={block} />}
        {block.type === "perks" && <PerksBlockEditor block={block} />}
      </div>
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  disabled,
  danger,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`size-6 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-foreground/55 hover:text-destructive hover:border-destructive/30"
          : "text-foreground/55 hover:text-foreground hover:bg-[var(--background-alt)]"
      }`}
    >
      <Icon width={11} height={11} strokeWidth={2} />
    </button>
  );
}

/* ─── Text block ─────────────────────────────────────────── */

function TextBlockEditor({ block }: { block: CompanyBlock }) {
  return (
    <textarea
      value={block.content ?? ""}
      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
      placeholder="Ecrivez ici... Presentez votre entreprise, votre equipe, votre culture."
      rows={5}
      className="w-full bg-transparent border border-[var(--border)] rounded-xl px-3.5 py-3 text-[14px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.7] resize-y"
    />
  );
}

/* ─── Image block ────────────────────────────────────────── */

function ImageBlockEditor({ block }: { block: CompanyBlock }) {
  const ref = useRef<HTMLInputElement>(null);
  const image = block.images?.[0];

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
    });
    updateBlock(block.id, { images: [dataUrl] });
  };

  return (
    <div>
      {image ? (
        <div className="relative rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={block.title ?? ""}
            className="w-full h-auto max-h-[400px] object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="size-7 rounded-lg bg-white/90 border border-[var(--border)] flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Changer"
            >
              <Camera width={12} height={12} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => updateBlock(block.id, { images: [] })}
              className="size-7 rounded-lg bg-white/90 border border-[var(--border)] flex items-center justify-center text-foreground/55 hover:text-destructive transition-colors"
              aria-label="Retirer"
            >
              <Xmark width={12} height={12} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/40 hover:bg-[var(--background-alt)] transition-colors p-8 text-center"
        >
          <Camera
            width={20}
            height={20}
            strokeWidth={1.6}
            className="text-foreground/45 inline-block mb-2"
          />
          <div className="text-[13px] font-medium text-foreground">
            Ajouter une image
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-0.5">
            JPG, PNG — 1600px de large recommande
          </div>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}

/* ─── Gallery block ──────────────────────────────────────── */

function GalleryBlockEditor({ block }: { block: CompanyBlock }) {
  const ref = useRef<HTMLInputElement>(null);
  const images = block.images ?? [];

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const dataUrl = await resizeImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
      });
      addImageToBlock(block.id, dataUrl);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--background-alt)] group/img"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${block.title ?? "Galerie"} ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImageFromBlock(block.id, i)}
              className="absolute top-1.5 right-1.5 size-6 rounded-full bg-white/90 border border-[var(--border)] flex items-center justify-center text-foreground/55 hover:text-destructive opacity-0 group-hover/img:opacity-100 transition-all"
              aria-label="Retirer"
            >
              <Xmark width={10} height={10} strokeWidth={2.2} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="aspect-[4/3] rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/40 hover:bg-[var(--background-alt)] transition-colors flex flex-col items-center justify-center gap-1.5"
        >
          <PlusCircle
            width={16}
            height={16}
            strokeWidth={2}
            className="text-foreground/50"
          />
          <span className="text-[11px] text-foreground/60">Ajouter</span>
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFiles}
      />
    </div>
  );
}

/* ─── Quote block ────────────────────────────────────────── */

function QuoteBlockEditor({ block }: { block: CompanyBlock }) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={block.content ?? ""}
        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
        placeholder="« La citation de votre collaborateur... »"
        rows={3}
        className="w-full bg-transparent border border-[var(--border)] rounded-xl px-3.5 py-3 text-[15px] font-display italic outline-none placeholder:text-[var(--tertiary-foreground)] placeholder:not-italic focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
      />
      <input
        type="text"
        value={block.author ?? ""}
        onChange={(e) => updateBlock(block.id, { author: e.target.value })}
        placeholder="— Nom, poste"
        className="wall-input h-10 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
      />
    </div>
  );
}

/* ─── Stats block ────────────────────────────────────────── */

function StatsBlockEditor({ block }: { block: CompanyBlock }) {
  const stats = block.stats ?? [];

  const update = (idx: number, key: "label" | "value", val: string) => {
    const next = stats.map((s, i) =>
      i === idx ? { ...s, [key]: val } : s,
    );
    updateBlock(block.id, { stats: next });
  };

  const add = () => {
    updateBlock(block.id, {
      stats: [...stats, { label: "Label", value: "Valeur" }],
    });
  };

  const remove = (idx: number) => {
    updateBlock(block.id, { stats: stats.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-[var(--border)] bg-[var(--background-alt)]/40 p-3 group/stat"
          >
            <input
              type="text"
              value={s.value}
              onChange={(e) => update(i, "value", e.target.value)}
              className="block text-[20px] font-display font-medium text-foreground bg-transparent outline-none w-full"
            />
            <input
              type="text"
              value={s.label}
              onChange={(e) => update(i, "label", e.target.value)}
              className="block text-[11.5px] text-foreground/60 bg-transparent outline-none w-full mt-0.5"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 size-5 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-foreground/40 hover:text-destructive opacity-0 group-hover/stat:opacity-100 transition-all"
              aria-label="Supprimer"
            >
              <Xmark width={9} height={9} strokeWidth={2.4} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12px] text-foreground/75 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors"
      >
        <PlusCircle width={12} height={12} strokeWidth={2} />
        Ajouter un chiffre
      </button>
    </div>
  );
}

/* ─── Perks block ────────────────────────────────────────── */

function PerksBlockEditor({ block }: { block: CompanyBlock }) {
  const items = block.items ?? [];
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const s = raw.trim();
    if (!s || items.includes(s)) return;
    updateBlock(block.id, { items: [...items, s] });
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-[var(--background-alt)] border border-[var(--border)] text-[12px] text-foreground"
          >
            {p}
            <button
              type="button"
              onClick={() =>
                updateBlock(block.id, {
                  items: items.filter((_, j) => j !== i),
                })
              }
              className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
              aria-label={`Retirer ${p}`}
            >
              <Xmark width={10} height={10} strokeWidth={2.2} />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[12.5px] text-muted-foreground">
            Aucun avantage liste.
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder="Mutuelle, 13e mois, logement…"
          className="wall-input flex-1 h-9 text-[13px] placeholder:text-[var(--tertiary-foreground)]"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim()}
          className="h-9 px-3 rounded-full bg-foreground text-background text-[12px] font-medium hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <PlusCircle width={11} height={11} strokeWidth={2} />
          Ajouter
        </button>
      </div>
    </div>
  );
}
