"use client";

import { Check, SendMail, WarningTriangle } from "iconoir-react";
import { useMessages } from "@/lib/supabase/use-messages";

type Props = {
  applicationId: string;
};

export function CandidateMessagesThread({ applicationId }: Props) {
  const { messages, loading } = useMessages(applicationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="size-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground italic">
        Aucun message envoye a ce candidat.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {messages.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-[var(--border)] bg-white p-3"
        >
          <div className="flex items-center gap-2 text-[11.5px] text-foreground/60">
            <SendMail width={11} height={11} strokeWidth={2} />
            <span className="font-medium text-foreground/80">
              {m.sentByName ?? "Recruteur"}
            </span>
            <DeliveryPill status={m.deliveryStatus} error={m.deliveryError} />
            <span className="ml-auto font-mono text-[10.5px] text-[var(--tertiary-foreground)]">
              {formatDate(m.createdAt)}
            </span>
          </div>
          {m.subject && (
            <p className="text-[12.5px] text-foreground/85 mt-1.5 font-medium">
              {m.subject}
            </p>
          )}
          <p className="text-[12.5px] text-foreground/75 mt-1.5 whitespace-pre-wrap leading-[1.55] line-clamp-6">
            {m.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

function DeliveryPill({
  status,
  error,
}: {
  status: "pending" | "sent" | "failed";
  error: string | null;
}) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
        <Check width={10} height={10} strokeWidth={2.2} />
        Envoye
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-destructive"
        title={error ?? "Echec d'envoi"}
      >
        <WarningTriangle width={10} height={10} strokeWidth={2.2} />
        Echec
      </span>
    );
  }
  return <span className="text-[10px] text-foreground/40">en attente</span>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
