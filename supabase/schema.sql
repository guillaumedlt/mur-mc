-- ============================================================
-- MUR.MC — Schema Supabase
-- A executer dans le SQL Editor du dashboard Supabase
-- https://rsgbywpbsipzpaqeffwk.supabase.co
-- ============================================================

-- Activer les extensions necessaires
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Entreprises
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  sector text not null,
  size text,
  location text,
  description text,
  tagline text,
  positioning text,
  culture text,
  perks text[] default '{}',
  website text,
  domain text,
  logo_color text default '#1C3D5A',
  initials text,
  founded integer,
  has_cover boolean default false,
  cover_url text,
  blocks jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profils utilisateurs (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('candidate', 'employer')),
  full_name text not null,
  email text not null,
  phone text,
  location text,
  headline text,
  bio text,
  avatar_url text,
  experience_years integer,
  skills text[] default '{}',
  languages text[] default '{}',
  sectors text[] default '{}',
  linkedin_url text,
  website_url text,
  cv_url text,
  cv_file_name text,
  -- Employer-specific
  company_id uuid references companies(id) on delete set null,
  team_role text check (team_role in ('admin', 'recruiter', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Offres d'emploi
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  slug text unique not null,
  title text not null,
  type text not null, -- CDI, CDD, Freelance, Stage, Alternance, Saison
  level text not null, -- Junior, Confirme, Senior, Manager, Direction
  sector text not null,
  location text not null,
  lat numeric,
  lng numeric,
  remote text default 'Sur site',
  work_time text default 'Temps plein',
  salary_min integer,
  salary_max integer,
  currency text default 'EUR',
  lang text default 'fr',
  languages text[] default '{}',
  tags text[] default '{}',
  short_description text,
  description text,
  responsibilities text[] default '{}',
  requirements text[] default '{}',
  benefits text[] default '{}',
  status text default 'published' check (status in ('draft', 'published', 'paused', 'closed')),
  featured boolean default false,
  urgent boolean default false,
  views integer default 0,
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Candidatures
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references profiles(id) on delete cascade,
  status text default 'received' check (status in ('received', 'reviewed', 'interview', 'offer', 'hired', 'rejected')),
  match_score integer default 0,
  rating integer default 0,
  cover_letter text,
  source text default 'platform' check (source in ('platform', 'manual', 'csv_import', 'referral')),
  added_by uuid references profiles(id),
  "order" integer default 0,
  applied_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Empecher un candidat de postuler 2 fois a la meme offre
  unique(job_id, candidate_id)
);

-- Evenements de candidature (timeline)
create table if not exists application_events (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  type text not null,
  text text,
  by_user_id uuid references profiles(id),
  by_name text,
  from_status text,
  to_status text,
  created_at timestamptz default now()
);

-- Offres sauvegardees par les candidats
create table if not exists saved_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- Articles du magazine
create table if not exists stories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  category text not null,
  title text not null,
  excerpt text,
  lead text,
  body jsonb default '[]',
  author_name text,
  author_role text,
  reading_minutes integer default 5,
  featured boolean default false,
  tags text[] default '{}',
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEX pour la performance
-- ============================================================

create index if not exists idx_jobs_company on jobs(company_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_sector on jobs(sector);
create index if not exists idx_jobs_slug on jobs(slug);
create index if not exists idx_jobs_published on jobs(published_at desc);

create index if not exists idx_applications_job on applications(job_id);
create index if not exists idx_applications_candidate on applications(candidate_id);
create index if not exists idx_applications_status on applications(status);

create index if not exists idx_application_events_app on application_events(application_id);

create index if not exists idx_profiles_company on profiles(company_id);
create index if not exists idx_profiles_role on profiles(role);

create index if not exists idx_saved_jobs_user on saved_jobs(user_id);

create index if not exists idx_companies_slug on companies(slug);

create index if not exists idx_stories_slug on stories(slug);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table application_events enable row level security;
alter table saved_jobs enable row level security;
alter table stories enable row level security;

-- Companies : lecture publique, ecriture par les membres
create policy "companies_read" on companies for select using (true);
create policy "companies_write" on companies for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = companies.id
    and profiles.team_role in ('admin', 'recruiter')
  )
);

-- Profiles : chaque user voit/edite le sien
create policy "profiles_own" on profiles for all using (id = auth.uid());
-- Les recruteurs voient les profils candidats
create policy "profiles_read_candidates" on profiles for select using (
  role = 'candidate' or id = auth.uid()
);

-- Jobs : lecture publique (publiees), CRUD par les recruteurs de l'entreprise
create policy "jobs_read_published" on jobs for select using (
  status = 'published'
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = jobs.company_id
  )
);
create policy "jobs_write" on jobs for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = jobs.company_id
    and profiles.team_role in ('admin', 'recruiter')
  )
);

-- Applications : le candidat voit les siennes, le recruteur voit celles de ses offres
create policy "applications_candidate" on applications for all using (
  candidate_id = auth.uid()
);
create policy "applications_employer" on applications for all using (
  exists (
    select 1 from jobs
    join profiles on profiles.company_id = jobs.company_id
    where jobs.id = applications.job_id
    and profiles.id = auth.uid()
  )
);

-- Events : meme logique que les applications
create policy "events_read" on application_events for select using (
  exists (
    select 1 from applications
    where applications.id = application_events.application_id
    and (
      applications.candidate_id = auth.uid()
      or exists (
        select 1 from jobs
        join profiles on profiles.company_id = jobs.company_id
        where jobs.id = applications.job_id
        and profiles.id = auth.uid()
      )
    )
  )
);
create policy "events_write" on application_events for insert with check (
  exists (
    select 1 from applications
    join jobs on jobs.id = applications.job_id
    join profiles on profiles.company_id = jobs.company_id
    where applications.id = application_events.application_id
    and profiles.id = auth.uid()
  )
);

-- Saved jobs : chaque user gere les siens
create policy "saved_own" on saved_jobs for all using (user_id = auth.uid());

-- Stories : lecture publique
create policy "stories_read" on stories for select using (true);

-- ============================================================
-- TRIGGERS pour updated_at auto
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_companies_updated before update on companies
  for each row execute function update_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function update_updated_at();
create trigger trg_jobs_updated before update on jobs
  for each row execute function update_updated_at();
create trigger trg_applications_updated before update on applications
  for each row execute function update_updated_at();
create trigger trg_stories_updated before update on stories
  for each row execute function update_updated_at();
