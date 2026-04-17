"use client";

import { useState } from "react";
import { createClient } from "./client";

export type MessageRow = {
  id: string;
  applicationId: string;
  direction: "outbound" | "inbound";
  kind: string;
  subject: string | null;
  body: string;
  sentByName: string | null;
  deliveryStatus: "pending" | "sent" | "failed";
  deliveryError: string | null;
  createdAt: string;
};

/** Hook : charge l'historique des messages pour une application. */
export function useMessages(applicationId: string | null) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  if (applicationId !== fetchedFor) {
    setFetchedFor(applicationId);
    if (!applicationId) {
      setMessages([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("messages")
        .select(
          "id, application_id, direction, kind, subject, body, sent_by_name, delivery_status, delivery_error, created_at",
        )
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          setMessages(
            (data ?? []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (r: any): MessageRow => ({
                id: r.id,
                applicationId: r.application_id,
                direction: r.direction,
                kind: r.kind,
                subject: r.subject ?? null,
                body: r.body,
                sentByName: r.sent_by_name ?? null,
                deliveryStatus: r.delivery_status,
                deliveryError: r.delivery_error ?? null,
                createdAt: r.created_at,
              }),
            ),
          );
          setLoading(false);
        });
    }
  }

  const refetch = () => setFetchedFor(null);
  return { messages, loading, refetch };
}
