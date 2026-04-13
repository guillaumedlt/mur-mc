import type { Metadata } from "next";

import { Shell } from "@/components/wall/shell";
import { ApplicationsList } from "@/components/wall/applications-list";

export const metadata: Metadata = {
  title: "Mes candidatures",
  description: "Suivi de tes candidatures sur Mur.mc.",
  alternates: { canonical: "/candidat/candidatures" },
  robots: { index: false, follow: false },
};

export default function CandidaturesPage() {
  return (
    <Shell jobs={[]}>
      <ApplicationsList />
    </Shell>
  );
}
