import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { CandidateDashboard } from "@/components/wall/candidate-dashboard";
import { fetchAllJobs } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Mon espace candidat",
  description: "Tableau de bord candidat sur Mur.mc.",
  alternates: { canonical: "/candidat" },
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function CandidatPage() {
  const jobs = await fetchAllJobs();

  return (
    <Shell jobs={jobs}>
      <CandidateDashboard jobs={jobs} />
    </Shell>
  );
}
