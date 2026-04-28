import Link from "next/link";
import { Search } from "iconoir-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-[440px] text-center">
        <span className="inline-flex size-16 rounded-2xl bg-[var(--background-alt)] border border-[var(--border)] items-center justify-center text-foreground/45 mb-6">
          <Search width={28} height={28} strokeWidth={1.6} />
        </span>
        <h1 className="font-display text-[36px] tracking-[-0.015em] text-foreground">
          404
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
          Cette page n&apos;existe pas ou a ete deplacee.
        </p>
        <div className="flex items-center justify-center gap-2 mt-7">
          <Link
            href="/"
            className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center"
          >
            Voir les offres
          </Link>
          <Link
            href="/entreprises"
            className="h-10 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center"
          >
            Entreprises
          </Link>
        </div>
        <p className="text-[11.5px] text-[var(--tertiary-foreground)] mt-8 font-mono">
          MONTE CARLO WORK
        </p>
      </div>
    </div>
  );
}
