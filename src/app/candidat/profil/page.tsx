import type { Metadata } from "next";

import { Shell } from "@/components/wall/shell";
import { ProfileEditor } from "@/components/wall/profile-editor";

export const metadata: Metadata = {
  title: "Mon profil candidat",
  description: "Gère ton profil candidat sur Monte Carlo Work.",
  alternates: { canonical: "/candidat/profil" },
  robots: { index: false, follow: false },
};

export default function ProfilPage() {
  return (
    <Shell jobs={[]}>
      <ProfileEditor />
    </Shell>
  );
}
