import Link from "next/link";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocale, lhref } from "@/lib/i18n/config";
import { ArrowRight, Briefcase, Building2 } from "lucide-react";

export default async function SignUpPage(
  props: PageProps<"/[locale]/signup">,
) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const t =
    locale === "fr"
      ? {
          title: "Rejoindre HelloWork",
          subtitle: "Créez un compte en 30 secondes. Aucune carte bancaire requise.",
          talent: {
            title: "Je cherche un job",
            desc: "Profil candidat, alertes mail, sourcing pour les offres monégasques.",
          },
          recruiter: {
            title: "Je recrute",
            desc: "Compte recruteur, première offre offerte, shortlist en 48 h.",
          },
          formTitle: "Créer mon profil candidat",
          firstName: "Prénom",
          lastName: "Nom",
          email: "Email",
          password: "Mot de passe",
          submit: "Créer mon compte",
          cgu: "En créant un compte, vous acceptez les CGU de HelloWork Monaco.",
          haveAccount: "Déjà un compte ?",
          signin: "Se connecter",
        }
      : {
          title: "Join HelloWork",
          subtitle: "Create an account in 30 seconds. No credit card required.",
          talent: {
            title: "I'm looking for a job",
            desc: "Candidate profile, email alerts, AI matching with Monaco roles.",
          },
          recruiter: {
            title: "I'm hiring",
            desc: "Recruiter account, first post free, shortlist within 48h.",
          },
          formTitle: "Create your candidate profile",
          firstName: "First name",
          lastName: "Last name",
          email: "Email",
          password: "Password",
          submit: "Create account",
          cgu: "By creating an account, you accept HelloWork Monaco's terms.",
          haveAccount: "Already have an account?",
          signin: "Sign in",
        };

  return (
    <div className="bg-background py-20">
      <div className="mx-auto max-w-2xl px-5">
        <div className="text-center">
          <h1 className="font-display text-[40px] font-semibold leading-tight tracking-tight text-foreground sm:text-[52px]">
            {t.title}
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="#talent-form"
            className="hw-shadow-card flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 transition"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground">
              <Briefcase className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="font-display text-[18px] font-semibold text-foreground">
              {t.talent.title}
            </p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {t.talent.desc}
            </p>
          </Link>
          <Link
            href={lhref(locale, "/post-job")}
            className="hw-shadow-card flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 transition"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="font-display text-[18px] font-semibold text-foreground">
              {t.recruiter.title}
            </p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {t.recruiter.desc}
            </p>
          </Link>
        </div>

        <form
          id="talent-form"
          className="hw-shadow-card mt-10 rounded-2xl border border-border bg-card p-7 sm:p-9"
        >
          <h2 className="font-display text-[22px] font-semibold text-foreground">
            {t.formTitle}
          </h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-[12.5px] font-medium">{t.firstName}</Label>
              <Input className="mt-2 rounded-xl" />
            </div>
            <div>
              <Label className="text-[12.5px] font-medium">{t.lastName}</Label>
              <Input className="mt-2 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[12.5px] font-medium">{t.email}</Label>
              <Input type="email" className="mt-2 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[12.5px] font-medium">{t.password}</Label>
              <Input type="password" className="mt-2 rounded-xl" />
            </div>
          </div>
          <button
            type="button"
            className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[14px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)]"
          >
            {t.submit}
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </button>
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            {t.cgu}
          </p>
        </form>

        <p className="mt-6 text-center text-[14px] text-muted-foreground">
          {t.haveAccount}{" "}
          <Link
            href={lhref(locale, "/signin")}
            className="font-semibold text-foreground hover:underline"
          >
            {t.signin}
          </Link>
        </p>
      </div>
    </div>
  );
}
