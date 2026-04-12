import { notFound } from "next/navigation";
import { Brain, Target, ShieldCheck, Mail, MapPin, Phone } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";

export default async function AboutPage(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const t =
    locale === "fr"
      ? {
          eyebrow: "À propos",
          title: "La plateforme de recrutement de la Principauté.",
          intro:
            "Monaco a son écosystème, ses codes, ses langues, ses exigences. Les plateformes généralistes ne le comprennent pas. HelloWork Monaco est pensée par et pour les acteurs locaux : banque privée, yachting, palaces, joaillerie, tech et family offices.",
          methodEyebrow: "Méthode",
          methodTitle: "Trois étapes, sans compromis",
          steps: [
            {
              num: "01",
              title: "Compréhension",
              desc: "Notre équipe analyse votre offre, détecte les compétences clés (techniques + soft skills), les langues, la culture entreprise.",
              icon: Brain,
            },
            {
              num: "02",
              title: "Sélection",
              desc: "Parmi les talents enregistrés, nos modèles identifient les profils en adéquation et leur calculent un score transparent.",
              icon: Target,
            },
            {
              num: "03",
              title: "Présentation",
              desc: "Notre équipe revoit chaque shortlist, valide les disponibilités et vous envoie le top 5 sous 48 h.",
              icon: ShieldCheck,
            },
          ],
          contactEyebrow: "Contact",
          contactTitle: "Une question, un partenariat ?",
          contactSubtitle: "Notre équipe vous répond sous 24h ouvrées.",
          email: "Email",
          phone: "Téléphone",
          address: "Adresse",
        }
      : {
          eyebrow: "About",
          title: "The recruitment platform of the Principality.",
          intro:
            "Monaco has its own ecosystem, codes, languages, and standards. Generalist platforms don't understand them. HelloWork Monaco is built by and for local players: private banking, yachting, palaces, jewellery, tech and family offices.",
          methodEyebrow: "Method",
          methodTitle: "Three steps, no compromise",
          steps: [
            {
              num: "01",
              title: "Understand",
              desc: "Our team analyses your role, identifies key skills (technical + soft), languages, and company culture.",
              icon: Brain,
            },
            {
              num: "02",
              title: "Select",
              desc: "From registered talents, our models identify the best fits and assign a transparent match score.",
              icon: Target,
            },
            {
              num: "03",
              title: "Present",
              desc: "Our team reviews every shortlist, confirms availability and sends you the top 5 within 48h.",
              icon: ShieldCheck,
            },
          ],
          contactEyebrow: "Contact",
          contactTitle: "A question, a partnership?",
          contactSubtitle: "Our team replies within 24 business hours.",
          email: "Email",
          phone: "Phone",
          address: "Address",
        };

  return (
    <div>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 pt-20 pb-16 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px]">
            {t.title}
          </h1>
          <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            {t.intro}
          </p>
        </div>
      </section>

      <section id="ai" className="border-b border-border bg-background py-24">
        <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.methodEyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[44px]">
            {t.methodTitle}
          </h2>

          <ol className="mt-12 grid gap-6 lg:grid-cols-3">
            {t.steps.map((s) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.num}
                  className="hw-shadow-card rounded-2xl border border-border bg-card p-7"
                >
                  <p className="font-display text-[28px] font-semibold leading-none text-muted-foreground">
                    {s.num}
                  </p>
                  <span className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="mt-4 font-display text-[18px] font-semibold text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="contact" className="bg-background py-24">
        <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t.contactEyebrow}
              </p>
              <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">
                {t.contactTitle}
              </h2>
              <p className="mt-4 text-[15px] text-muted-foreground">
                {t.contactSubtitle}
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Mail,
                    label: t.email,
                    value: "hello@hellowork.mc",
                  },
                  {
                    icon: Phone,
                    label: t.phone,
                    value: "+377 9999 1234",
                  },
                  {
                    icon: MapPin,
                    label: t.address,
                    value: "7 boulevard des Moulins, 98000 Monaco",
                  },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.label}
                      className="hw-shadow-card rounded-2xl border border-border bg-card p-6"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {c.label}
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-foreground">
                        {c.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
