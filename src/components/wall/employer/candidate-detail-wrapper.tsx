"use client";

import { useUser } from "@/lib/auth";
import { CandidateDetail } from "./candidate-detail";

type Props = { id: string };

export function CandidateDetailWrapper({ id }: Props) {
  const user = useUser();
  return (
    <CandidateDetail
      id={id}
      recruiterName={user?.name ?? "Recruteur"}
    />
  );
}
