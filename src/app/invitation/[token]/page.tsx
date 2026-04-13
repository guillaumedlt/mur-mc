import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { InvitationForm } from "@/components/wall/invitation-form";

export const metadata: Metadata = {
  title: "Rejoindre une equipe — Mur.mc",
  description: "Creez votre compte pour rejoindre une equipe sur Mur.mc.",
  robots: { index: false, follow: false },
};

export default async function InvitationPage(
  props: PageProps<"/invitation/[token]">,
) {
  const { token } = await props.params;
  return (
    <Shell jobs={[]}>
      <InvitationForm token={token} />
    </Shell>
  );
}
