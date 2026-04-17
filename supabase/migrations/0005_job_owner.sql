-- ============================================================
-- MUR.MC — Migration 0005 : Recruteur assigne a une offre
-- ============================================================
-- Objet : ajouter jobs.assigned_to pour qu'un job ait un recruteur
-- principal (filtrage "mes offres" + attribution automatique des candidats).
-- Idempotent.
-- ============================================================

alter table jobs
  add column if not exists assigned_to uuid references profiles(id) on delete set null;

create index if not exists idx_jobs_assigned_to on jobs(assigned_to);
