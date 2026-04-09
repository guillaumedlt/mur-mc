import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "iconoir-react";
import {
  type Company,
  allJobs,
  companies,
  getCompany,
  jobsForCompany,
} from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { CompanyPublicView } from "@/components/wall/company-public-view";

const SITE_URL = "https://mur.mc";

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  props: PageProps<"/entreprises/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const company = getCompany(slug);
  if (!company) return { title: "Entreprise introuvable" };
  return {
    title: company.name,
    description: company.tagline || company.description,
    alternates: { canonical: `/entreprises/${company.slug}` },
    openGraph: {
      type: "profile",
      title: company.name,
      description: company.tagline || company.description,
      url: `${SITE_URL}/entreprises/${company.slug}`,
      siteName: "Mur.mc",
      images: company.hasCover
        ? [coverUrl(company)]
        : undefined,
    },
  };
}

function coverUrl(company: Company): string {
  return `https://picsum.photos/seed/${company.slug}-cover/1600/520`;
}

export default async function CompanyPage(
  props: PageProps<"/entreprises/[slug]">,
) {
  const { slug } = await props.params;
  const company = getCompany(slug);
  if (!company) notFound();

  const openings = jobsForCompany(company.id);

  return (
    <Shell jobs={allJobs}>
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
