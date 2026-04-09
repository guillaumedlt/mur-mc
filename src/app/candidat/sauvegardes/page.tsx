import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { SavedList } from "@/components/wall/saved-list";

export const metadata: Metadata = {
  title: "Mes offres sauvegardées",
  description: "Tes offres mises de côté sur Mur.mc.",
  alternates: { canonical: "/candidat/sauvegardes" },
  robots: { index: false, follow: false },
};

export default function SauvegardesPage() {
  return (
    <Shell jobs={allJobs}>
      <SavedList jobs={allJobs} />
    </Shell>
  );
}
