export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Build a locale-prefixed href.
 *   lhref("fr", "/jobs")           → "/fr/jobs"
 *   lhref("en", "/jobs/yacht")     → "/en/jobs/yacht"
 *   lhref("fr", "/")               → "/fr"
 */
export function lhref(locale: Locale, path: string): string {
  if (path === "/" || path === "") return `/${locale}`;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}
