import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/wall/shell";
import { InscriptionForm } from "@/components/wall/inscription-form";

export const metadata: Metadata = {
  title: "Creer un compte — Monte Carlo Work",
  description:
    "Candidats : creez votre compte pour postuler. Recruteurs : demandez votre espace employeur sur Monte Carlo Work.",
  alternates: { canonical: "/inscription" },
  robots: { index: false, follow: true },
};

export default function InscriptionPage() {
  return (
    <Shell jobs={[]}>
      <div className="max-w-[500px] mx-auto">
        <Suspense>
          <InscriptionForm />
        </Suspense>
      </div>
    </Shell>
  );
}
