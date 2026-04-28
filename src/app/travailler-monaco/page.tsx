import type { Metadata } from "next";
import Link from "next/link";
import {
  Building,
  Globe,
  MapPin,
  Sparks,
} from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://montecarlowork.com";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travailler a Monaco : Guide complet 2026 — Monte Carlo Work",
  description:
    "Tout savoir pour travailler a Monaco : marche de l'emploi, permis de travail, salaires, frontaliers, secteurs qui recrutent. Guide mis a jour en 2026.",
  alternates: { canonical: "/travailler-monaco" },
  openGraph: {
    type: "article",
    title: "Travailler a Monaco : Guide complet 2026",
    description:
      "Marche de l'emploi, permis de travail, salaires, frontaliers — le guide le plus complet pour travailler en Principaute de Monaco.",
    url: `${SITE_URL}/travailler-monaco`,
    siteName: "Monte Carlo Work",
    locale: "fr_MC",
  },
  twitter: { card: "summary_large_image" },
};

const FAQ_ITEMS = [
  {
    q: "Faut-il un permis de travail pour travailler a Monaco ?",
    a: "Oui. Les ressortissants non-monegasques doivent obtenir une autorisation d'embauche delivree par le Service de l'Emploi de la Principaute. L'employeur en fait la demande. Les citoyens francais et italiens beneficient d'une procedure simplifiee en tant que frontaliers.",
  },
  {
    q: "Quels sont les secteurs qui recrutent le plus a Monaco ?",
    a: "Les cinq secteurs principaux sont la banque privee et la finance (32 banques sur 2 km2), l'hotellerie de luxe et la restauration (palaces 5 etoiles, restaurants etoiles), le yachting (Port Hercule, La Condamine), le luxe et le retail, et le secteur tech/digital en forte croissance.",
  },
  {
    q: "Quel est le salaire moyen a Monaco ?",
    a: "Le salaire moyen est environ 20 a 30% superieur aux equivalents francais pour des postes comparables. Le SMIC monegasque (SMC) est legerement superieur au SMIC francais. La Principaute ne preleve pas d'impot sur le revenu pour les residents, ce qui augmente significativement le net.",
  },
  {
    q: "Peut-on etre frontalier et travailler a Monaco ?",
    a: "Oui. La majorite des salaries de Monaco (environ 50 000 sur 60 000) sont frontaliers, principalement residant dans les Alpes-Maritimes (Nice, Menton, Beausoleil) et en Italie (Vintimille). Les frontaliers francais restent soumis a l'impot sur le revenu en France.",
  },
  {
    q: "Quels sont les avantages de travailler a Monaco ?",
    a: "Pas d'impot sur le revenu pour les residents monegasques, un cadre de vie exceptionnel, un marche de l'emploi dynamique avec un taux de chomage quasi-nul, une securite sociale genereuse (CCSS), la proximite de la Cote d'Azur, et un acces a un reseau professionnel international unique.",
  },
  {
    q: "Comment postuler a une offre d'emploi a Monaco sur Monte Carlo Work ?",
    a: "Creez un compte candidat gratuit sur Monte Carlo Work, completez votre profil (CV, competences, langues), puis postulez en un clic aux offres qui vous interessent. Vous recevrez les mises a jour de statut par email.",
  },
];

export default async function TravaillerMonacoPage() {
  const jobs = await fetchAllJobs();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Monte Carlo Work", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Travailler a Monaco", item: `${SITE_URL}/travailler-monaco` },
    ],
  };

  const sectors = [
    { name: "Banque & Finance", slug: "banque-finance", desc: "32 banques privees, wealth management, compliance" },
    { name: "Hotellerie & Restauration", slug: "hotellerie-restauration", desc: "Palaces 5 etoiles, restaurants etoiles Michelin" },
    { name: "Yachting", slug: "yachting", desc: "Construction, management, equipage, brokerage" },
    { name: "Luxe & Retail", slug: "luxe-retail", desc: "Maisons de couture, joaillerie, horlogerie" },
    { name: "Tech & Digital", slug: "tech-digital", desc: "Fintech, healthtech, e-commerce, SaaS" },
    { name: "Immobilier", slug: "immobilier", desc: "Promotion, gestion, transactions prestige" },
    { name: "Juridique", slug: "juridique", desc: "Droit des affaires, fiscalite internationale, trusts" },
  ];

  return (
    <Shell jobs={jobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, breadcrumbJsonLd]) }}
      />

      <div className="max-w-[900px] mx-auto">
        {/* Breadcrumb */}
        <nav className="text-[12px] text-foreground/50 mb-3 px-1 flex items-center gap-1.5">
          <Link href="/" className="hover:text-foreground transition-colors">Monte Carlo Work</Link>
          <span>/</span>
          <span className="text-foreground/70">Travailler a Monaco</span>
        </nav>

        {/* Hero */}
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-12 mb-3">
          <p className="ed-label-sm text-[var(--accent)]">Guide 2026</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] leading-[1.08] tracking-[-0.02em] text-foreground mt-2">
            Travailler a Monaco
          </h1>
          <p className="text-[15px] sm:text-[16px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
            Tout ce qu&apos;il faut savoir pour decrocher un emploi en Principaute :
            marche du travail, permis, salaires, secteurs porteurs, et conseils pratiques.
          </p>
          <div className="flex flex-wrap gap-3 mt-6 text-[13px] text-foreground/60">
            <span className="inline-flex items-center gap-1.5">
              <MapPin width={13} height={13} strokeWidth={2} />
              39 000 habitants
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building width={13} height={13} strokeWidth={2} />
              60 000+ emplois salaries
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe width={13} height={13} strokeWidth={2} />
              139 nationalites representees
            </span>
          </div>
        </header>

        {/* Marche de l'emploi */}
        <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-4">
            Le marche de l&apos;emploi monegasque
          </h2>
          <div className="text-[14.5px] leading-[1.85] text-foreground/82 flex flex-col gap-4">
            <p>
              Monaco est un micro-Etat de 2 km2 qui emploie plus de 60 000 salaries —
              soit presque deux fois sa population residente. Ce ratio unique en fait l&apos;un
              des marches de l&apos;emploi les plus dynamiques d&apos;Europe, avec un taux de
              chomage quasi-nul.
            </p>
            <p>
              La majorite des postes sont occupes par des frontaliers francais et
              italiens qui traversent la frontiere chaque jour. Les entreprises recrutent
              dans des secteurs a forte valeur ajoutee : banque privee, hotellerie de luxe,
              yachting, juridique international, et de plus en plus dans la tech et le digital.
            </p>
            <p>
              Le salaire moyen est 20 a 30% superieur aux equivalents francais, et les
              residents monegasques ne paient pas d&apos;impot sur le revenu. Pour les
              frontaliers francais, l&apos;impot reste du en France mais les salaires bruts
              sont generalement plus eleves.
            </p>
          </div>
        </article>

        {/* Secteurs */}
        <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
            Secteurs qui recrutent a Monaco
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectors.map((s) => (
              <Link
                key={s.slug}
                href={`/emploi-monaco/${s.slug}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--background-alt)]/40 p-4 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03] transition-colors"
              >
                <p className="text-[14px] font-medium text-foreground group-hover:text-[var(--accent)] transition-colors">
                  {s.name}
                </p>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  {s.desc}
                </p>
              </Link>
            ))}
          </div>
        </article>

        {/* Permis de travail */}
        <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-4">
            Permis de travail et formalites
          </h2>
          <div className="text-[14.5px] leading-[1.85] text-foreground/82 flex flex-col gap-4">
            <p>
              Pour travailler a Monaco, les ressortissants non-monegasques doivent
              obtenir une <strong>autorisation d&apos;embauche</strong> delivree par le
              Service de l&apos;Emploi. C&apos;est l&apos;employeur qui en fait la demande,
              generalement avant la prise de poste.
            </p>
            <p>
              Les citoyens francais et italiens beneficient d&apos;une <strong>procedure
              simplifiee</strong> en tant que frontaliers (pas de visa). Les
              ressortissants d&apos;autres pays doivent obtenir un visa de travail
              specifique aupres du Consulat de Monaco.
            </p>
            <p>
              La priorite d&apos;embauche est donnee dans cet ordre : monegasques,
              conjoints de monegasques, residents monegasques, frontaliers. En pratique,
              la penurie de talents dans certains secteurs (tech, finance, yachting)
              ouvre le marche a tous les profils qualifies.
            </p>
          </div>
        </article>

        {/* FAQ */}
        <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
            Questions frequentes
          </h2>
          <dl className="flex flex-col divide-y divide-[var(--border)]">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <dt className="text-[14.5px] font-medium text-foreground leading-snug">
                  {item.q}
                </dt>
                <dd className="text-[13.5px] text-foreground/75 mt-2 leading-[1.75]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        {/* CTA */}
        <div className="bg-[var(--accent)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 text-center text-background">
          <Sparks width={24} height={24} strokeWidth={1.8} className="mx-auto opacity-80" />
          <h2 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] mt-3">
            Pret a postuler ?
          </h2>
          <p className="text-[14px] opacity-80 mt-2 max-w-md mx-auto">
            Decouvrez toutes les offres d&apos;emploi de Monaco et postulez en direct.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <Link
              href="/emploi-monaco"
              className="h-11 px-6 rounded-full bg-background text-foreground text-[13.5px] font-medium inline-flex items-center hover:bg-background/90 transition-colors"
            >
              Voir toutes les offres
            </Link>
            <Link
              href="/inscription"
              className="h-11 px-6 rounded-full border border-background/30 text-background text-[13.5px] font-medium inline-flex items-center hover:bg-background/10 transition-colors"
            >
              Creer mon compte
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
