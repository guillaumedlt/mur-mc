import Link from "next/link";
import { Logo } from "./logo";
import { LocaleToggle } from "./locale-toggle";
import { type Locale, lhref } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale).footer;

  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t.candidatesCol,
      links: [
        { href: lhref(locale, "/jobs"), label: t.candidatesLinks.allJobs },
        { href: lhref(locale, "/jobs"), label: t.candidatesLinks.bySector },
        {
          href: lhref(locale, "/companies"),
          label: t.candidatesLinks.companies,
        },
        { href: lhref(locale, "/#alerts"), label: t.candidatesLinks.emailAlerts },
      ],
    },
    {
      title: t.recruitersCol,
      links: [
        { href: lhref(locale, "/post-job"), label: t.recruitersLinks.post },
        {
          href: lhref(locale, "/post-job#pricing"),
          label: t.recruitersLinks.pricing,
        },
        {
          href: lhref(locale, "/about#contact"),
          label: t.recruitersLinks.contact,
        },
      ],
    },
    {
      title: t.brandCol,
      links: [
        { href: lhref(locale, "/about"), label: t.brandLinks.about },
        { href: lhref(locale, "/about#legal"), label: t.brandLinks.legal },
        { href: lhref(locale, "/about#cgu"), label: t.brandLinks.cgu },
        { href: lhref(locale, "/about#privacy"), label: t.brandLinks.privacy },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-5 pt-16 pb-10 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[12.5px] font-semibold text-foreground">
                {c.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={`${c.title}-${l.label}`}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-muted-foreground transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-4 border-t border-border pt-8 sm:grid-cols-3">
          <div className="sm:justify-self-start">
            <Logo href={lhref(locale, "/")} />
          </div>
          <p className="text-[12px] text-muted-foreground sm:justify-self-center sm:text-center">
            {t.copyright}
          </p>
          <div className="sm:justify-self-end">
            <LocaleToggle locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
