"use client";

import { useState, useCallback } from "react";

/**
 * Hook minimal pour gerer une selection multi-cards sur le kanban.
 * Les ids sont des application ids (prefixes "mc-" pour les manual_candidates).
 */
export function useKanbanSelection() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds(new Set());
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  return {
    ids,
    count: ids.size,
    toggle,
    clear,
    has,
  };
}
