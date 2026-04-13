import type { EmployerCompanyProfile } from "./types";
import { cached, setCached, ensureLoaded, persist, emit } from "./core";
import { resizeImage } from "../resize-image";

/* ─── Company profile ────────────────────────────────────────────── */

export function getCompanyOverride(
  companyId: string,
): EmployerCompanyProfile | null {
  ensureLoaded();
  if (
    cached.companyProfile &&
    cached.companyProfile.companyId === companyId
  ) {
    return cached.companyProfile;
  }
  return null;
}

export function updateCompanyProfile(
  patch: Partial<EmployerCompanyProfile> & { companyId?: string },
): void {
  ensureLoaded();
  const current = cached.companyProfile ?? { companyId: patch.companyId ?? "" };
  setCached({
    ...cached,
    companyProfile: {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    } as EmployerCompanyProfile,
  });
  persist();
  emit();
}

export async function setCoverFromFile(file: File): Promise<void> {
  if (typeof window === "undefined") return;
  if (!cached.companyProfile) {
    throw new Error("companyProfile non initialise — set une tagline d'abord");
  }
  const dataUrl = await resizeImage(file, {
    maxWidth: 800,
    maxHeight: 450,
    quality: 0.8,
  });
  ensureLoaded();
  setCached({
    ...cached,
    companyProfile: {
      ...(cached.companyProfile ?? { companyId: "" }),
      coverDataUrl: dataUrl,
      hasCover: true,
      updatedAt: new Date().toISOString(),
    },
  });
  try {
    persist();
  } catch (e) {
    throw e as Error;
  }
  emit();
}

export function removeCover(): void {
  ensureLoaded();
  if (!cached.companyProfile) return;
  setCached({
    ...cached,
    companyProfile: {
      ...cached.companyProfile,
      coverDataUrl: undefined,
      hasCover: false,
      updatedAt: new Date().toISOString(),
    },
  });
  persist();
  emit();
}
