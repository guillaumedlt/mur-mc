import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { isLocale } from "@/lib/i18n/config";
import { ArrowRight, Check } from "lucide-react";

export default async function PostJobPage(
  props: PageProps<"/[locale]/post-job">,
) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const labels =
    locale === "fr"
      ? {
          eyebrow: "Pour les recruteurs",
          title1: "Publiez votre offre.",
          title2: "Recevez une shortlist en 48 h.",
          subtitle:
            "Diffusez votre offre auprès de talents qualifiés à Monaco et laissez notre équipe pré-sélectionner les meilleurs profils.",
          formTitle: "Décrivez votre poste",
          formHint: "Quelques minutes suffisent. Vous pourrez compléter plus tard.",
          fields: {
            title: "Intitulé du poste",
            company: "Entreprise",
            location: "Localisation",
            type: "Type de contrat",
            level: "Niveau d'expérience",
            desc: "Description",
            email: "Email recruteur",
            placeholder: "Sélectionner",
          },
          submit: "Publier l'offre",
          validation: "Validation par notre équipe sous 2 heures ouvrées.",
          pricingEyebrow: "Tarifs",
          pricingTitle: "Simple, transparent.",
          pricingSubtitle: "Sans engagement. Premier post offert.",
          tiers: [
            {
              name: "Starter",
              price: "0 €",
              desc: "1 offre offerte pour découvrir HelloWork.",
              features: [
                "1 publication 30 jours",
                "Accès au CV-thèque",
                "Stats de visites",
              ],
              cta: "Commencer",
              highlight: false,
            },
            {
              name: "Growth",
              price: "290 €",
              suffix: "/ offre",
              desc: "Sourcing assisté et mise en avant.",
              features: [
                "Publication boostée 60 jours",
                "Shortlist (top 5)",
                "Mise en avant landing",
                "Support prioritaire",
              ],
              cta: "Choisir Growth",
              highlight: true,
            },
            {
              name: "Talent Partner",
              price: "Sur devis",
              desc: "Pack annuel illimité, accompagnement humain.",
              features: [
                "Offres illimitées",
                "Talent acquisition manager dédié",
                "API + ATS sync",
                "Branding employeur premium",
              ],
              cta: "Parler à un expert",
              highlight: false,
            },
          ],
        }
      : {
          eyebrow: "For recruiters",
          title1: "Post your role.",
          title2: "Get a shortlist in 48 h.",
          subtitle:
            "Reach qualified talents in Monaco and let our team pre-select the best profiles for you.",
          formTitle: "Describe the role",
          formHint: "A few minutes is enough. You can complete it later.",
          fields: {
            title: "Job title",
            company: "Company",
            location: "Location",
            type: "Contract type",
            level: "Experience level",
            desc: "Description",
            email: "Recruiter email",
            placeholder: "Select",
          },
          submit: "Publish the role",
          validation: "Reviewed by our team within 2 business hours.",
          pricingEyebrow: "Pricing",
          pricingTitle: "Simple, transparent.",
          pricingSubtitle: "No commitment. First post is on us.",
          tiers: [
            {
              name: "Starter",
              price: "€0",
              desc: "1 free post to try HelloWork.",
              features: [
                "1 post for 30 days",
                "CV database access",
                "View stats",
              ],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Growth",
              price: "€290",
              suffix: "/ post",
              desc: "Assisted sourcing and front-page boost.",
              features: [
                "Boosted post for 60 days",
                "Shortlist (top 5)",
                "Landing feature",
                "Priority support",
              ],
              cta: "Choose Growth",
              highlight: true,
            },
            {
              name: "Talent Partner",
              price: "Custom",
              desc: "Yearly unlimited pack, human support.",
              features: [
                "Unlimited posts",
                "Dedicated talent manager",
                "API + ATS sync",
                "Premium employer branding",
              ],
              cta: "Talk to us",
              highlight: false,
            },
          ],
        };

  return (
    <div>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {labels.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px]">
              {labels.title1}
              <br />
              {labels.title2}
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
              {labels.subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 lg:grid-cols-[1.5fr_1fr] lg:px-8">
          <form className="hw-shadow-card rounded-2xl border border-border bg-card p-6 sm:p-10">
            <h2 className="font-display text-[24px] font-semibold leading-tight text-foreground">
              {labels.formTitle}
            </h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {labels.formHint}
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.title}
                </Label>
                <Input className="mt-2 rounded-xl" placeholder="Wealth Manager" />
              </div>
              <div>
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.company}
                </Label>
                <Input className="mt-2 rounded-xl" />
              </div>
              <div>
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.location}
                </Label>
                <Input className="mt-2 rounded-xl" placeholder="Monaco" />
              </div>
              <div>
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.type}
                </Label>
                <Select>
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue placeholder={labels.fields.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cdi">CDI</SelectItem>
                    <SelectItem value="cdd">CDD</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="alternance">Alternance</SelectItem>
                    <SelectItem value="saison">Saison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.level}
                </Label>
                <Select>
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue placeholder={labels.fields.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="confirme">Confirmé</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="direction">Direction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.desc}
                </Label>
                <Textarea className="mt-2 rounded-xl" rows={6} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[12.5px] font-medium text-foreground">
                  {labels.fields.email}
                </Label>
                <Input type="email" className="mt-2 rounded-xl" />
              </div>
            </div>

            <button
              type="button"
              className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-[14px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)]"
            >
              {labels.submit}
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            </button>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              {labels.validation}
            </p>
          </form>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-border bg-background py-24"
      >
        <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {labels.pricingEyebrow}
            </p>
            <h2 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[48px]">
              {labels.pricingTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">
              {labels.pricingSubtitle}
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {labels.tiers.map((t) => (
              <div
                key={t.name}
                className={`hw-shadow-card relative flex flex-col rounded-2xl border p-8 ${
                  t.highlight
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    t.highlight ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {t.name}
                </p>
                <p className="mt-4 font-display text-[40px] font-semibold leading-none tracking-tight">
                  {t.price}
                  {t.suffix && (
                    <span
                      className={`text-[14px] font-normal ${
                        t.highlight
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {" "}
                      {t.suffix}
                    </span>
                  )}
                </p>
                <p
                  className={`mt-3 text-[14px] ${
                    t.highlight ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {t.desc}
                </p>
                <ul className="mt-7 space-y-3 text-[14px]">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          t.highlight ? "text-background" : "text-foreground"
                        }`}
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full py-3.5 text-[13px] font-semibold transition ${
                    t.highlight
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "bg-foreground text-background hover:bg-foreground/85"
                  }`}
                >
                  {t.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
