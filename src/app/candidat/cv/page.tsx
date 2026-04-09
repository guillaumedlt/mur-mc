import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { CvView } from "@/components/wall/cv-view";

export const metadata: Metadata = {
  title: "Mon CV",
  description: "Aperçu de mon CV avant export PDF.",
  alternates: { canonical: "/candidat/cv" },
  robots: { index: false, follow: false },
};

export default function CvPage() {
  return (
    <Shell jobs={allJobs}>
      <CvView />
    </Shell>
  );
}
