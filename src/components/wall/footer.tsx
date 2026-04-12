import Link from "next/link";

/**
 * Petit pied de page minimal qui flotte dans le shell crème.
 * Pas de carte : juste une ligne d'ancres discrètes pour respecter
 * la philosophie "produit avant tout".
 */
export function Footer() {
  return (
    <footer className="mt-3 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-foreground/55">
      <span className="font-mono">
        © {new Date().getFullYear()} Mur.mc — Le mur d&apos;offres de la
        Principauté de Monaco
      </span>
      <nav className="flex items-center gap-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Offres
        </Link>
        <Link
          href="/entreprises"
          className="hover:text-foreground transition-colors"
        >
          Entreprises
        </Link>
        <Link
          href="/stories"
          className="hover:text-foreground transition-colors"
        >
          Magazine
        </Link>
        <a
          href="mailto:contact@mur.mc"
          className="hover:text-foreground transition-colors"
        >
          Contact
        </a>
        <a href="#" className="hover:text-foreground transition-colors">
          Mentions légales
        </a>
      </nav>
    </footer>
  );
}
