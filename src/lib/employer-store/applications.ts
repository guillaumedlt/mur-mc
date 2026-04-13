import type {
  EmployerApplication,
  EmployerApplicationEvent,
  EmployerApplicationStatus,
} from "./types";
import { cached, setCached, ensureLoaded, persist, emit, uid } from "./core";
import {
  moveApplicationSupabase,
  addApplicationEventSupabase,
  rateApplicationSupabase,
} from "../supabase/use-my-applications";

/* ─── Applications + kanban ──────────────────────────────────────── */

export function getEmployerApplication(
  id: string,
): EmployerApplication | undefined {
  ensureLoaded();
  return cached.applications.find((a) => a.id === id);
}

export function applicationsForJob(jobId: string): EmployerApplication[] {
  ensureLoaded();
  return cached.applications
    .filter((a) => a.jobId === jobId)
    .sort((a, b) => a.order - b.order);
}

export function applicationsByStatus(
  jobId: string,
): Record<EmployerApplicationStatus, EmployerApplication[]> {
  const empty: Record<EmployerApplicationStatus, EmployerApplication[]> = {
    received: [],
    shortlisted: [],
    reviewed: [],
    interview: [],
    offer: [],
    hired: [],
    rejected: [],
  };
  for (const app of applicationsForJob(jobId)) {
    empty[app.status].push(app);
  }
  for (const k of Object.keys(empty) as EmployerApplicationStatus[]) {
    empty[k].sort((a, b) => a.order - b.order);
  }
  return empty;
}

export function moveApplication(
  id: string,
  toStatus: EmployerApplicationStatus,
  toIndex?: number,
): void {
  ensureLoaded();
  const app = cached.applications.find((a) => a.id === id);
  if (!app) return;
  const fromStatus = app.status;

  const sameJob = cached.applications.filter((a) => a.jobId === app.jobId);
  const fromCol = sameJob
    .filter((a) => a.status === fromStatus && a.id !== id)
    .sort((a, b) => a.order - b.order);
  fromCol.forEach((a, i) => {
    a.order = i;
  });

  const toCol = sameJob
    .filter((a) => a.status === toStatus && a.id !== id)
    .sort((a, b) => a.order - b.order);
  const insertAt =
    toIndex === undefined
      ? toCol.length
      : Math.max(0, Math.min(toIndex, toCol.length));
  toCol.splice(insertAt, 0, app);
  toCol.forEach((a, i) => {
    a.order = i;
  });

  const now = new Date().toISOString();
  app.status = toStatus;
  app.updatedAt = now;
  if (fromStatus !== toStatus) {
    app.events = [
      ...app.events,
      {
        id: uid("evt"),
        type: "status_changed",
        at: now,
        from: fromStatus,
        to: toStatus,
      },
    ];
  }

  setCached({ ...cached, applications: [...cached.applications] });
  persist();
  emit();

  // Dual-write to Supabase for real (non-seed) applications
  if (isSupabaseId(id)) {
    moveApplicationSupabase(id, toStatus, app.order, fromStatus, "").catch(
      () => {},
    );
  }
}

export function reorderApplication(id: string, toIndex: number): void {
  const app = cached.applications.find((a) => a.id === id);
  if (!app) return;
  moveApplication(id, app.status, toIndex);
}

export function addApplicationEvent(
  id: string,
  event: Omit<EmployerApplicationEvent, "id" | "at">,
): void {
  ensureLoaded();
  const now = new Date().toISOString();
  setCached({
    ...cached,
    applications: cached.applications.map((a) =>
      a.id === id
        ? {
            ...a,
            updatedAt: now,
            events: [
              ...a.events,
              { ...event, id: uid("evt"), at: now },
            ],
          }
        : a,
    ),
  });
  persist();
  emit();

  if (isSupabaseId(id)) {
    addApplicationEventSupabase(id, {
      type: event.type,
      text: event.text,
      by: event.by,
      from: event.from,
      to: event.to,
    }).catch(() => {});
  }
}

export function rateApplication(id: string, rating: number): void {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  ensureLoaded();
  setCached({
    ...cached,
    applications: cached.applications.map((a) =>
      a.id === id ? { ...a, rating: clamped } : a,
    ),
  });
  persist();
  emit();

  if (isSupabaseId(id)) {
    rateApplicationSupabase(id, clamped).catch(() => {});
  }
}

/** UUID pattern — seed IDs start with "emp-", Supabase IDs are UUIDs. */
function isSupabaseId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);
}
