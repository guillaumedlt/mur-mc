import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { SavedList } from "@/components/wall/saved-list";
import { fetchAllJobs } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Mes offres sauvegardees",
  description: "Tes offres mises de cote sur Monte Carlo Work.",
  alternates: { canonical: "/candidat/sauvegardes" },
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function SauvegardesPage() {
  const jobs = await fetchAllJobs();

  return (
    <Shell jobs={jobs}>
      <SavedList jobs={jobs} />
    </Shell>
  );
}
