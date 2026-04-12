import Link from "next/link";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocale, lhref } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";

export default async function SignInPage(
  props: PageProps<"/[locale]/signin">,
) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const t =
    locale === "fr"
      ? {
          title: "Bon retour",
          subtitle: "Connectez-vous à votre compte HelloWork.",
          email: "Email",
          password: "Mot de passe",
          submit: "Se connecter",
          noAccount: "Pas encore de compte ?",
          create: "Créer un compte",
        }
      : {
          title: "Welcome back",
          subtitle: "Sign in to your HelloWork account.",
          email: "Email",
          password: "Password",
          submit: "Sign in",
          noAccount: "No account yet?",
          create: "Create one",
        };

  return (
    <div className="bg-background py-20">
      <div className="mx-auto flex max-w-md flex-col items-center px-5">
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-foreground">
          {t.title}
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">{t.subtitle}</p>

        <form className="hw-shadow-card mt-8 w-full rounded-2xl border border-border bg-card p-7">
          <div>
            <Label className="text-[12.5px] font-medium">{t.email}</Label>
            <Input type="email" className="mt-2 rounded-xl" />
          </div>
          <div className="mt-5">
            <Label className="text-[12.5px] font-medium">{t.password}</Label>
            <Input type="password" className="mt-2 rounded-xl" />
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
        </form>

        <p className="mt-6 text-[14px] text-muted-foreground">
          {t.noAccount}{" "}
          <Link
            href={lhref(locale, "/signup")}
            className="font-semibold text-foreground hover:underline"
          >
            {t.create}
          </Link>
        </p>
      </div>
    </div>
  );
}
