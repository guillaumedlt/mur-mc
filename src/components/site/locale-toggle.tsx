"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale, locales, lhref } from "@/lib/i18n/config";

const COOKIE_NAME = "hw_locale";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const swapLocale = (target: Locale) => {
    if (!pathname) return lhref(target, "/");
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return lhref(target, "/");
    segments[0] = target;
    return "/" + segments.join("/");
  };

  const persistLocale = (target: Locale) => {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${target}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-[13px]">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-border" aria-hidden>
              /
            </span>
          )}
          <Link
            href={swapLocale(l)}
            onClick={() => persistLocale(l)}
            className={
              locale === l
                ? "font-medium text-foreground"
                : "text-muted-foreground transition hover:text-foreground"
            }
            aria-current={locale === l ? "page" : undefined}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
