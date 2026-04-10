import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { SupabaseAuthSync } from "@/components/wall/supabase-auth-sync";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const jetBrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mur.mc — Toutes les offres d'emploi de Monaco, en direct",
    template: "%s · Mur.mc",
  },
  description:
    "Le mur d'offres de la Principauté de Monaco. Toutes les annonces des banques privées, du yachting, des palaces, du luxe et de la tech monégasque, mises à jour en continu et filtrables en un clic.",
  keywords: [
    "emploi Monaco",
    "offres d'emploi Monaco",
    "jobs Monaco",
    "recrutement Monaco",
    "banque privée Monaco",
    "yachting jobs",
    "palaces Monaco",
    "tech Monaco",
    "Principauté de Monaco emploi",
  ],
  authors: [{ name: "Mur.mc" }],
  creator: "Mur.mc",
  publisher: "Mur.mc",
  category: "Recrutement",
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_MC",
    url: SITE_URL,
    siteName: "Mur.mc",
    title: "Mur.mc — Toutes les offres d'emploi de Monaco",
    description:
      "Le mur d'offres de Monaco. Toutes les annonces, en direct, dans une grille dense et élégante. Filtrez en un clic.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mur.mc — Toutes les offres d'emploi de Monaco",
    description:
      "Le mur d'offres de la Principauté de Monaco. En direct, sans détour.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport = {
  themeColor: "#FAFAF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${jetBrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <SupabaseAuthSync />
        {children}
      </body>
    </html>
  );
}
