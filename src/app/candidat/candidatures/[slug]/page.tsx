
import { Shell } from "@/components/wall/shell";
import { ApplicationDetail } from "@/components/wall/application-detail";

export const metadata = {
  title: "Suivi de candidature",
  alternates: { canonical: "/candidat/candidatures" },
  robots: { index: false, follow: false },
};

export default async function ApplicationDetailPage(
  props: PageProps<"/candidat/candidatures/[slug]">,
) {
  const { slug } = await props.params;
  return (
    <Shell jobs={[]}>
      <ApplicationDetail id={slug} />
    </Shell>
  );
}
