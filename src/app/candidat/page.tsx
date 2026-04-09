import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { CandidateDashboard } from "@/components/wall/candidate-dashboard";

export const metadata: Metadata = {
  title: "Mon espace candidat",
  description: "Tableau de bord candidat sur Mur.mc.",
  alternates: { canonical: "/candidat" },
  robots: { index: false, follow: false },
};

export default function CandidatPage() {
  return (
    <Shell jobs={allJobs}>
      <CandidateDashboard jobs={allJobs} />
    </Shell>
  );
}
