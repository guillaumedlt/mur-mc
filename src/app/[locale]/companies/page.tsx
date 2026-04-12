import Link from "next/link";
import { notFound } from "next/navigation";
import { companies, jobs } from "@/lib/data";
import { CompanyLogo } from "@/components/site/company-logo";
import { isLocale, lhref } from "@/lib/i18n/config";
import { ArrowUpRight, MapPin, Users } from "lucide-react";

export default async function CompaniesPage(
  props: PageProps<"/[locale]/companies">,
) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 pt-16 pb-12 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {locale === "fr" ? "Annuaire" : "Directory"}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[56px]">
            {locale === "fr"
              ? "Les entreprises qui font Monaco"
              : "The companies that make Monaco"}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {locale === "fr"
              ? `${companies.length} entreprises monégasques recrutent activement avec HelloWork. Banque privée, yachting, palaces, joaillerie, family offices.`
              : `${companies.length} Monégasque companies actively hire on HelloWork. Private banking, yachting, palaces, jewellery, family offices.`}
          </p>
        </div>
      </section>

      <section className="bg-background py-14">
        <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => {
              const count = jobs.filter((j) => j.company.id === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={lhref(locale, `/companies/${c.slug}`)}
                  className="group hw-shadow-card relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CompanyLogo company={c} size={48} />
                    <ArrowUpRight
                      className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                      strokeWidth={2.25}
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-[18px] font-semibold leading-tight text-foreground">
                      {c.name}
                    </h2>
                    <p className="mt-1 text-[12.5px] font-medium text-muted-foreground">
                      {c.sector}
                    </p>
                  </div>
                  <p className="line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                      {c.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" strokeWidth={2} />
                      {c.size}
                    </span>
                    <span className="ml-auto rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground">
                      {count}{" "}
                      {locale === "fr"
                        ? `job${count > 1 ? "s" : ""}`
                        : `job${count > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
