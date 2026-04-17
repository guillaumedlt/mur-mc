import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bag, MapPin, Sparks } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { JobCard } from "@/components/wall/job-card";
import { fetchAllJobs } from "@/lib/supabase/queries";
import { CONTRACT_MAP } from "./contracts";
import { JobAlertForm } from "@/components/wall/job-alert-form";

const SITE_URL = "https://mur.mc";

const SECTOR_MAP: Record<string, { label: string; sector: string; description: string }> = {
  "banque-finance": {
    label: "Banque & Finance",
    sector: "Banque & Finance",
    description: "Wealth management, compliance, KYC/AML, private banking. Monaco concentre 32 banques privees sur 2 km2, la plus forte densite au monde.",
  },
  "hotellerie-restauration": {
    label: "Hotellerie & Restauration",
    sector: "Hôtellerie & Restauration",
    description: "Palaces, restaurants etoiles, bars d'hotel. Le Monte-Carlo SBM emploie a lui seul 4 000 personnes. Postes en CDI et saisonniers.",
  },
  "tech-digital": {
    label: "Tech & Digital",
    sector: "Tech & Digital",
    description: "Developpement, cybersecurite, product management, data. L'ecosysteme tech monegasque croit de 15% par an avec MonacoTech.",
  },
  "yachting": {
    label: "Yachting",
    sector: "Yachting",
    description: "Equipage, ingenierie navale, brokerage, gestion de flotte. Le Port Hercule accueille les plus grands superyachts du monde.",
  },
  "luxe-retail": {
    label: "Luxe & Retail",
    sector: "Luxe & Retail",
    description: "Vente haute joaillerie, horlogerie, mode. Le Carre d'Or concentre Chanel, Dior, Louis Vuitton, Hermes, Cartier.",
  },
  "immobilier": {
    label: "Immobilier",
    sector: "Immobilier",
    description: "Transaction, gestion, promotion. Monaco est le marche immobilier le plus cher au monde a plus de 50 000 EUR/m2.",
  },
  "juridique": {
    label: "Juridique",
    sector: "Juridique",
    description: "Droit monegasque, droit international prive, fiscalite, compliance. Cabinets d'avocats et etudes notariales.",
  },
  "communication-marketing": {
    label: "Communication & Marketing",
    sector: "Communication & Marketing",
    description: "Agences creatives, branding luxe, social media, evenementiel. Monaco accueille de nombreuses agences internationales.",
  },
  "btp-construction": {
    label: "BTP & Construction",
    sector: "BTP & Construction",
    description: "Grands projets : extension en mer du Portier, renovations de palaces, immobilier de luxe. Salaires 20-30% superieurs a la France.",
  },
  "ressources-humaines": {
    label: "Ressources Humaines",
    sector: "Ressources Humaines",
    description: "Recrutement, gestion des talents, droit social monegasque. Un marche specifique avec ses propres conventions.",
  },
};

export async function generateMetadata(
  props: PageProps<"/emploi-monaco/[sector]">,
): Promise<Metadata> {
  const { sector: slug } = await props.params;

  // Contrat type pages (/emploi-monaco/cdi, /stage, etc.)
  const contract = CONTRACT_MAP[slug];
  if (contract) {
    return {
      title: `Offre d'emploi ${contract.label} a Monaco — Emploi ${contract.label} | Mur.mc`,
      description: `${contract.description} Postulez en direct sur Mur.mc.`,
      keywords: [
        `emploi ${contract.label} Monaco`,
        `offre ${contract.label} Monaco`,
        `${contract.label} Monaco`,
        `job ${contract.label} Monaco`,
      ],
      alternates: { canonical: `/emploi-monaco/${slug}` },
      openGraph: {
        type: "website",
        url: `${SITE_URL}/emploi-monaco/${slug}`,
        title: `Emploi ${contract.label} a Monaco | Mur.mc`,
        description: `Toutes les offres ${contract.label} en Principaute de Monaco.`,
        siteName: "Mur.mc",
      },
    };
  }

  // Sector pages
  const info = SECTOR_MAP[slug];
  if (!info) return { title: "Secteur introuvable", robots: { index: false } };

  return {
    title: `Emploi ${info.label} a Monaco — Offres ${info.label} | Mur.mc`,
    description: `Offres d'emploi ${info.label} a Monaco. ${info.description} Postulez en direct sur Mur.mc.`,
    keywords: [
      `emploi ${info.label.toLowerCase()} Monaco`,
      `offre ${info.label.toLowerCase()} Monaco`,
      `recrutement ${info.label.toLowerCase()} Monaco`,
      `job ${info.label.toLowerCase()} Monaco`,
    ],
    alternates: { canonical: `/emploi-monaco/${slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/emploi-monaco/${slug}`,
      title: `Emploi ${info.label} a Monaco | Mur.mc`,
      description: `Toutes les offres ${info.label} en Principaute de Monaco.`,
      siteName: "Mur.mc",
    },
  };
}

export const revalidate = 300;

export default async function SectorPage(
  props: PageProps<"/emploi-monaco/[sector]">,
) {
  const { sector: slug } = await props.params;
  const allJobs = await fetchAllJobs();

  // Contract type page (/emploi-monaco/cdi, /stage, etc.)
  const contract = CONTRACT_MAP[slug];
  if (contract) {
    const contractJobs = allJobs.filter((j) => j.type === contract.type);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Emploi ${contract.label} a Monaco`,
      description: contract.description,
      url: `${SITE_URL}/emploi-monaco/${slug}`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Emploi a Monaco", item: `${SITE_URL}/emploi-monaco` },
          { "@type": "ListItem", position: 3, name: contract.label, item: `${SITE_URL}/emploi-monaco/${slug}` },
        ],
      },
    };
    return (
      <Shell jobs={allJobs}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="max-w-[1100px] mx-auto">
          <Link href="/emploi-monaco" className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1">
            <ArrowLeft width={12} height={12} strokeWidth={2} /> Emploi a Monaco
          </Link>
          <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
            <p className="ed-label-sm text-[var(--accent)]">Emploi {contract.label}</p>
            <h1 className="font-display text-[28px] sm:text-[34px] tracking-[-0.02em] text-foreground mt-2 leading-[1.08]">
              Offres d&apos;emploi {contract.label} a Monaco
            </h1>
            <p className="text-[14.5px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
              {contract.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="wall-badge" data-tone="accent"><Bag width={11} height={11} strokeWidth={2} /> {contractJobs.length} offre{contractJobs.length > 1 ? "s" : ""}</span>
              <span className="wall-badge" data-tone="muted"><MapPin width={11} height={11} strokeWidth={2} /> Monaco</span>
            </div>
          </header>
          <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
            {contractJobs.length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground italic font-display">Aucune offre {contract.label} en ce moment. Revenez bientot.</p>
            ) : (
              <div className="wall-grid" data-density="standard">
                {contractJobs.map((j, i) => (<JobCard key={j.id} job={j} index={i} />))}
              </div>
            )}
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <JobAlertForm label={`${contract.label} a Monaco`} contractType={contract.type} />
          </div>
        </div>
      </Shell>
    );
  }

  // Sector page
  const info = SECTOR_MAP[slug];

  if (!info) {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <p className="font-display italic text-[18px] text-foreground">Secteur introuvable.</p>
          <Link
            href="/emploi-monaco"
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            Tous les secteurs
          </Link>
        </div>
      </Shell>
    );
  }

  const sectorJobs = allJobs.filter((j) => j.sector === info.sector);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Emploi ${info.label} a Monaco`,
    description: info.description,
    url: `${SITE_URL}/emploi-monaco/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Emploi a Monaco", item: `${SITE_URL}/emploi-monaco` },
        { "@type": "ListItem", position: 3, name: info.label, item: `${SITE_URL}/emploi-monaco/${slug}` },
      ],
    },
  };

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1100px] mx-auto">
        <Link
          href="/emploi-monaco"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Tous les secteurs
        </Link>

        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
          <p className="ed-label-sm text-[var(--accent)]">Emploi a Monaco</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] tracking-[-0.02em] text-foreground mt-2 leading-[1.08]">
            Emploi {info.label} a Monaco
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
            {info.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="wall-badge" data-tone="accent">
              <Bag /> {sectorJobs.length} offre{sectorJobs.length > 1 ? "s" : ""}
            </span>
            <span className="wall-badge" data-tone="muted">
              <MapPin /> Monaco
            </span>
            <span className="wall-badge" data-tone="muted">
              <Sparks /> {info.label}
            </span>
          </div>
        </header>

        {sectorJobs.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
            <p className="font-display italic text-[18px] text-foreground">
              Aucune offre {info.label} pour l&apos;instant.
            </p>
            <p className="text-[13px] text-muted-foreground mt-2">
              Revenez bientot ou consultez les autres secteurs.
            </p>
            <Link
              href="/emploi-monaco"
              className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
            >
              Tous les secteurs
            </Link>
          </div>
        ) : (
          <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
            <div className="wall-grid" data-density="standard">
              {sectorJobs.map((j, i) => (
                <JobCard key={j.id} job={j} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Alerte email */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
          <JobAlertForm label={`${info.label} a Monaco`} sector={info.sector} />
        </section>
      </div>
    </Shell>
  );
}
