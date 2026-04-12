"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { LocaleToggle } from "./locale-toggle";
import { type Locale, lhref } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";

export function Navbar({ locale }: { locale: Locale }) {
  const t = getDict(locale).nav;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-background/90 backdrop-blur transition-[border-color] ${
        scrolled ? "border-b border-border" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <Logo href={lhref(locale, "/")} />

        <nav className="flex items-center gap-7">
          <Link
            href={lhref(locale, "/jobs")}
            className="text-[13px] font-medium text-foreground/70 transition hover:text-foreground"
          >
            {t.jobs}
          </Link>
          <Link
            href={lhref(locale, "/companies")}
            className="text-[13px] font-medium text-foreground/70 transition hover:text-foreground"
          >
            {t.companies}
          </Link>
          <Link
            href={lhref(locale, "/signin")}
            className="text-[13px] font-medium text-foreground/70 transition hover:text-foreground"
          >
            {t.signin}
          </Link>

          <span className="h-4 w-px bg-border" aria-hidden />

          <LocaleToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
