import type { EmployerJob, EmployerJobStatus } from "./types";
import { cached, setCached, ensureLoaded, persist, emit, uid, slugify } from "./core";

/* ─── Jobs CRUD ──────────────────────────────────────────────────── */

export function createJob(
  input: Omit<
    EmployerJob,
    "id" | "createdAt" | "updatedAt" | "slug" | "views" | "status"
  > & { status?: EmployerJobStatus },
): EmployerJob {
  ensureLoaded();
  const now = new Date().toISOString();
  const id = uid("emp-job");
  const job: EmployerJob = {
    ...input,
    id,
    slug: `${slugify(input.title)}-${id.slice(-5)}`,
    status: input.status ?? "published",
    views: 0,
    createdAt: now,
    updatedAt: now,
  };
  setCached({ ...cached, jobs: [job, ...cached.jobs] });
  persist();
  emit();
  return job;
}

export function updateJob(id: string, patch: Partial<EmployerJob>): void {
  ensureLoaded();
  setCached({
    ...cached,
    jobs: cached.jobs.map((j) =>
      j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j,
    ),
  });
  persist();
  emit();
}

export function deleteJob(id: string): void {
  ensureLoaded();
  setCached({
    ...cached,
    jobs: cached.jobs.filter((j) => j.id !== id),
    applications: cached.applications.filter((a) => a.jobId !== id),
  });
  persist();
  emit();
}

export function setJobStatus(id: string, status: EmployerJobStatus): void {
  updateJob(id, { status });
}

export function getEmployerJob(id: string): EmployerJob | undefined {
  ensureLoaded();
  return cached.jobs.find((j) => j.id === id);
}
