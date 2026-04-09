"use client";

import {
  type EmployerApplicationStatus,
  type EmployerJobStatus,
  jobStatusLabel,
  jobStatusTone,
  statusLabel,
  statusTone,
} from "@/lib/employer-store";

export function ApplicationStatusPill({
  status,
}: {
  status: EmployerApplicationStatus;
}) {
  return (
    <span className="wall-badge" data-tone={statusTone(status)}>
      <Dot status={status} />
      {statusLabel(status)}
    </span>
  );
}

export function JobStatusPill({ status }: { status: EmployerJobStatus }) {
  return (
    <span className="wall-badge" data-tone={jobStatusTone(status)}>
      {jobStatusLabel(status)}
    </span>
  );
}

function Dot({ status }: { status: EmployerApplicationStatus }) {
  const color = (() => {
    switch (status) {
      case "received":
        return "var(--tertiary-foreground)";
      case "reviewed":
        return "var(--accent)";
      case "interview":
      case "offer":
      case "hired":
        return "oklch(0.55 0.15 145)";
      case "rejected":
        return "var(--destructive)";
    }
  })();
  return (
    <span
      aria-hidden
      className="size-1.5 rounded-full"
      style={{ background: color }}
    />
  );
}
