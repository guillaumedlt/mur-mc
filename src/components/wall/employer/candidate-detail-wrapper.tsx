"use client";

import { useUser } from "@/lib/auth";
import { CandidateDetail } from "./candidate-detail";
import { ManualCandidateDetail } from "./manual-candidate-detail";

type Props = { id: string };

export function CandidateDetailWrapper({ id }: Props) {
  const user = useUser();

  // Manual candidates have IDs prefixed with "mc-"
  if (id.startsWith("mc-")) {
    return <ManualCandidateDetail id={id.slice(3)} />;
  }

  return (
    <CandidateDetail
      id={id}
      recruiterName={user?.name ?? "Recruteur"}
    />
  );
}
