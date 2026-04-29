"use client";

import { useEffect, useState } from "react";
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

const EMPTY_MESSAGES: MessageRow[] = [];

/** Hook : charge l'historique des messages pour une application. */
export function useMessages(applicationId: string | null) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("messages")
      .select(
        "id, application_id, direction, kind, subject, body, sent_by_name, delivery_status, delivery_error, created_at",
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (data ?? []) as any[];
        setMessages(
          list.map(
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
    return () => {
      cancelled = true;
    };
  }, [applicationId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!applicationId) {
    return { messages: EMPTY_MESSAGES, loading: false, refetch };
  }

  return { messages, loading, refetch };
}
