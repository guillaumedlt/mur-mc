import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { isLocale, locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <Navbar locale={locale} />
      <main className="flex-1">{props.children}</main>
      <Footer locale={locale} />
    </>
  );
}
