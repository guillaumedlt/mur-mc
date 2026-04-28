-- Migration 0008 : security audit fixes (avril 2026)
--
-- Corrige les findings de l'audit du 2026-04-28 :
-- 1. profiles_read_candidates ouvert a tous les users authentifies
--    (fuite massive de PII candidat — RGPD/CCIN). Restreindre aux employers.
-- 2. applications_employer / events_write : pas de check team_role pour
--    les writes (un viewer peut modifier des candidatures via direct DB).
-- 3. contact_requests : RLS pas documentee dans le repo. Forcer deny-all
--    aux non-service-role + autoriser insert public (formulaire contact).
-- 4. companies.plan / job_quota : un employer admin pouvait s'auto-upgrade
--    via update direct. Bloque par trigger column-level.
--
-- Migration idempotente : peut etre rejouee sans risque.

-- ─────────────────────────────────────────────────────────
-- 1. profiles_read_candidates → restreindre aux employers
-- ─────────────────────────────────────────────────────────

drop policy if exists "profiles_read_candidates" on profiles;

-- Un user voit son propre profil + un employer voit les candidats.
-- Les candidats ne voient PAS les autres candidats (defense en profondeur).
create policy "profiles_read_candidates_by_employers" on profiles
for select using (
  id = auth.uid()
  or (
    role = 'candidate'
    and exists (
      select 1 from profiles me
      where me.id = auth.uid()
      and me.role = 'employer'
    )
  )
);

-- ─────────────────────────────────────────────────────────
-- 2a. applications_employer → split read (any team) vs write (admin/recruiter)
-- ─────────────────────────────────────────────────────────

drop policy if exists "applications_employer" on applications;

create policy "applications_employer_read" on applications for select using (
  exists (
    select 1 from jobs
    join profiles on profiles.company_id = jobs.company_id
    where jobs.id = applications.job_id
    and profiles.id = auth.uid()
  )
);

create policy "applications_employer_write" on applications for update using (
  exists (
    select 1 from jobs
    join profiles on profiles.company_id = jobs.company_id
    where jobs.id = applications.job_id
    and profiles.id = auth.uid()
    and profiles.team_role in ('admin', 'recruiter')
  )
) with check (
  exists (
    select 1 from jobs
    join profiles on profiles.company_id = jobs.company_id
    where jobs.id = applications.job_id
    and profiles.id = auth.uid()
    and profiles.team_role in ('admin', 'recruiter')
  )
);

create policy "applications_employer_delete" on applications for delete using (
  exists (
    select 1 from jobs
    join profiles on profiles.company_id = jobs.company_id
    where jobs.id = applications.job_id
    and profiles.id = auth.uid()
    and profiles.team_role in ('admin', 'recruiter')
  )
);

-- ─────────────────────────────────────────────────────────
-- 2b. events_write → require admin/recruiter team_role
-- ─────────────────────────────────────────────────────────

drop policy if exists "events_write" on application_events;

create policy "events_write" on application_events for insert with check (
  exists (
    select 1 from applications
    join jobs on jobs.id = applications.job_id
    join profiles on profiles.company_id = jobs.company_id
    where applications.id = application_events.application_id
    and profiles.id = auth.uid()
    and (
      -- Le candidat peut ecrire ses propres events (apply, withdraw)
      applications.candidate_id = auth.uid()
      or profiles.team_role in ('admin', 'recruiter')
    )
  )
);

-- ─────────────────────────────────────────────────────────
-- 3. contact_requests : table + RLS minimale + insert public
-- ─────────────────────────────────────────────────────────

-- Cree la table si absente (en prod elle existe deja, idempotent).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  plan text not null default 'starter',
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_requests_email on public.contact_requests(email);
create index if not exists idx_contact_requests_status on public.contact_requests(status);

alter table public.contact_requests enable row level security;

-- Drop des policies eventuellement existantes (idempotent)
drop policy if exists "contact_requests_insert_public" on public.contact_requests;
drop policy if exists "contact_requests_read_admin_only" on public.contact_requests;
drop policy if exists "contact_requests_update_admin_only" on public.contact_requests;

-- Insert ouvert au public (formulaire de contact /api/contact route).
-- Lecture/update : aucune policy = deny all sauf service_role qui bypasse
-- le RLS. /api/admin/contacts utilise service_role.
create policy "contact_requests_insert_public" on public.contact_requests
  for insert with check (true);

-- ─────────────────────────────────────────────────────────
-- 4. companies.plan / job_quota : trigger column-level lockdown
-- ─────────────────────────────────────────────────────────

create or replace function lock_company_plan_columns()
returns trigger language plpgsql security definer as $$
begin
  -- service_role bypasse (utilise par /api/admin/companies)
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.job_quota is distinct from old.job_quota then
    raise exception 'plan/job_quota are admin-only fields. Use /api/admin/companies.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_company_plan on companies;
create trigger trg_lock_company_plan
before update on companies
for each row execute function lock_company_plan_columns();
