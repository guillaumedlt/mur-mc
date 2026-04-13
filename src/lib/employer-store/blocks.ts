import type { BlockType, CompanyBlock } from "./types";
import { cached, ensureLoaded, setCached, persist, emit, uid } from "./core";

/* ─── Blocks CRUD ────────────────────────────────────────────────── */

export function getBlocks(): CompanyBlock[] {
  ensureLoaded();
  return cached.companyProfile?.blocks ?? [];
}

export function setBlocks(blocks: CompanyBlock[]): void {
  ensureLoaded();
  if (!cached.companyProfile) return;
  setCached({
    ...cached,
    companyProfile: {
      ...cached.companyProfile,
      blocks,
      updatedAt: new Date().toISOString(),
    },
  });
  persist();
  emit();
}

function defaultBlockTitle(type: BlockType): string {
  switch (type) {
    case "text":
      return "A propos";
    case "image":
      return "Photo";
    case "gallery":
      return "Galerie";
    case "quote":
      return "Temoignage";
    case "stats":
      return "Chiffres cles";
    case "perks":
      return "Avantages";
    case "video":
      return "Video";
  }
}

export function addBlock(
  type: BlockType,
  atIndex?: number,
): CompanyBlock {
  ensureLoaded();
  const block: CompanyBlock = {
    id: uid("block"),
    type,
    title: defaultBlockTitle(type),
    content: type === "text" ? "" : undefined,
    images: type === "image" ? [] : type === "gallery" ? [] : undefined,
    stats:
      type === "stats"
        ? [
            { label: "Collaborateurs", value: "200+" },
            { label: "Annee de creation", value: "1863" },
          ]
        : undefined,
    items: type === "perks" ? [] : undefined,
  };
  const blocks = [...(cached.companyProfile?.blocks ?? [])];
  if (atIndex !== undefined) {
    blocks.splice(atIndex, 0, block);
  } else {
    blocks.push(block);
  }
  setBlocks(blocks);
  return block;
}

export function updateBlock(
  id: string,
  patch: Partial<CompanyBlock>,
): void {
  const blocks = getBlocks().map((b) =>
    b.id === id ? { ...b, ...patch } : b,
  );
  setBlocks(blocks);
}

export function removeBlock(id: string): void {
  setBlocks(getBlocks().filter((b) => b.id !== id));
}

export function moveBlock(id: string, direction: "up" | "down"): void {
  const blocks = [...getBlocks()];
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= blocks.length) return;
  [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
  setBlocks(blocks);
}

export function addImageToBlock(blockId: string, dataUrl: string): void {
  const block = getBlocks().find((b) => b.id === blockId);
  if (!block) return;
  updateBlock(blockId, {
    images: [...(block.images ?? []), dataUrl],
  });
}

export function removeImageFromBlock(
  blockId: string,
  imageIndex: number,
): void {
  const block = getBlocks().find((b) => b.id === blockId);
  if (!block) return;
  updateBlock(blockId, {
    images: (block.images ?? []).filter((_, i) => i !== imageIndex),
  });
}
