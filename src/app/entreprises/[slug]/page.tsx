import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "iconoir-react";
import type { Company } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { CompanyPublicView } from "@/components/wall/company-public-view";
import {
  fetchAllJobs,
  fetchCompanyBySlug,
  fetchJobsForCompany,
} from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const revalidate = 300;

export async function generateMetadata(
  props: PageProps<"/entreprises/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const company = await fetchCompanyBySlug(slug);
  if (!company) return { title: "Entreprise introuvable", robots: { index: false } };
  const desc = (company.tagline || company.description || "").slice(0, 160);
  return {
    title: `${company.name} — Offres d'emploi a Monaco`,
    description: desc || `Decouvrez ${company.name} sur Mur.mc — ${company.sector}, ${company.location}.`,
    alternates: { canonical: `/entreprises/${company.slug}` },
    openGraph: {
      type: "profile",
      title: company.name,
      description: desc,
      url: `${SITE_URL}/entreprises/${company.slug}`,
      siteName: "Mur.mc",
      locale: "fr_MC",
      images: company.coverUrl
        ? [{ url: company.coverUrl, width: 1200, height: 630, alt: company.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: company.name,
      description: desc,
    },
  };
}


export default async function CompanyPage(
  props: PageProps<"/entreprises/[slug]">,
) {
  const { slug } = await props.params;
  const company = await fetchCompanyBySlug(slug);
  if (!company) notFound();

  const [openings, allJobs] = await Promise.all([
    fetchJobsForCompany(company.id),
    fetchAllJobs(),
  ]);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description || company.tagline,
    url: company.website ? `https://${company.website}` : `${SITE_URL}/entreprises/${company.slug}`,
    logo: company.logoUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: company.location || "Monaco",
      addressCountry: "MC",
    },
    numberOfEmployees: company.size ? { "@type": "QuantitativeValue", value: company.size } : undefined,
    foundingDate: company.founded ? String(company.founded) : undefined,
    sameAs: company.website ? [`https://${company.website}`] : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Entreprises", item: `${SITE_URL}/entreprises` },
      { "@type": "ListItem", position: 3, name: company.name, item: `${SITE_URL}/entreprises/${company.slug}` },
    ],
  };

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, breadcrumbJsonLd]) }}
      />
      <div className="max-w-[1100px] mx-auto">
        <Link
          href="/entreprises"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Toutes les entreprises
        </Link>

        <CompanyPublicView company={company} openings={openings} />
      </div>
    </Shell>
  );
}
