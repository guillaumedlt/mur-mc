-- ============================================================
-- MUR.MC — Migration 0003 : ATS Vague 1
-- ============================================================
-- Objets :
--   1. Table job_templates (item 2 : templates & duplication d'offres)
--   2. applications.rejection_reason + rejection_note (item 4)
--   3. jobs.scorecard_criteria jsonb (item 5 : scorecards custom par job)
-- Idempotent.
-- ============================================================

-- 1. job_templates : offres sauvegardees comme template par la company
create table if not exists job_templates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_job_templates_company on job_templates(company_id);

alter table job_templates enable row level security;

drop policy if exists "job_templates_read" on job_templates;
create policy "job_templates_read" on job_templates
for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = job_templates.company_id
  )
);

drop policy if exists "job_templates_write" on job_templates;
create policy "job_templates_write" on job_templates
for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = job_templates.company_id
    and profiles.team_role in ('admin', 'recruiter')
  )
);

drop trigger if exists trg_job_templates_updated on job_templates;
create trigger trg_job_templates_updated before update on job_templates
  for each row execute function update_updated_at();


-- 2. Motif de refus structure
alter table applications
  add column if not exists rejection_reason text check (
    rejection_reason is null
    or rejection_reason in (
      'skills_gap',
      'experience_gap',
      'culture_fit',
      'overqualified',
      'location',
      'salary',
      'no_response',
      'hired_elsewhere',
      'other'
    )
  );

alter table applications
  add column if not exists rejection_note text;


-- 3. Criteres de scorecard customisables par job
alter table jobs
  add column if not exists scorecard_criteria jsonb default null;
-- Format attendu : [{"name": "Competences tech", "weight": 1}, ...]
-- NULL = fallback aux 6 criteres par defaut (cote composant)
