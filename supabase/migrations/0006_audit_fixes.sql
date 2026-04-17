-- ============================================================
-- MUR.MC — Migration 0006 : Fixes post-audit global
-- ============================================================
-- C3  : stories_write RLS trop permissive → restreindre ou supprimer
-- C4  : custom_questions + colonnes bilingues absentes du schema.sql
--       (existent deja en prod, rien a ALTER — juste sync documentation)
-- H4  : Index composite (job_id, status, "order") pour le kanban
-- H5  : cloneJob devrait reset assigned_to (fix cote code, pas SQL)
-- ============================================================

-- C3 : La policy stories_write autorise TOUT employer admin/recruiter
-- de n'importe quelle company a ecrire dans le magazine.
-- Fix : supprimer la policy write (le magazine est edite via l'admin
-- Mur.mc / magazine-admin route, pas par les recruteurs externes).
-- En attendant un champ company_id sur stories, on deny all pour anon.
drop policy if exists "stories_write" on stories;

-- Si besoin futur de laisser les employers ecrire, re-creer avec
-- une whitelist company_id ou un flag is_mur_admin sur profiles.


-- H4 : Index composite pour le kanban qui filtre par job + tri par order
create index if not exists idx_applications_job_status_order
  on applications(job_id, status, "order");

-- Index utile pour le reporting (rejection reasons par job)
create index if not exists idx_applications_job_rejection
  on applications(job_id, rejection_reason)
  where rejection_reason is not null;


-- C4 doc-only : ces colonnes existent DEJA en prod (ajoutees avant
-- le tracking de migrations). Rien a ALTER, mais migration trackee
-- pour audit trail.
-- jobs.custom_questions text[]
-- jobs.work_permit_required boolean
-- jobs.hiring_priority text
-- jobs.convention_collective text
-- jobs.title_en text
-- jobs.short_description_en text
-- jobs.description_en text
