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
  logo_url text,
  initials text,
  founded integer,
  has_cover boolean default false,
  cover_url text,
  blocks jsonb default '[]',
  job_quota integer default 1,
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
  status text default 'received' check (status in ('received', 'shortlisted', 'reviewed', 'interview', 'offer', 'hired', 'rejected')),
  match_score integer default 0,
  rating integer default 0,
  cover_letter text,
  source text default 'platform' check (source in ('platform', 'manual', 'csv_import', 'referral')),
  added_by uuid references profiles(id),
  "order" integer default 0,
  tags text[] default '{}',
  notes text,
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

-- Candidats ajoutes manuellement (pas de compte Supabase)
create table if not exists manual_candidates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  location text,
  headline text,
  skills text[] default '{}',
  languages text[] default '{}',
  cover_letter text,
  status text default 'received' check (status in ('received','shortlisted','reviewed','interview','offer','hired','rejected')),
  rating integer default 0,
  source text default 'manual' check (source in ('manual','csv_import','referral')),
  added_by uuid references profiles(id),
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Timeline candidats manuels
create table if not exists candidate_events (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references manual_candidates(id) on delete cascade,
  type text not null,
  text text,
  from_status text,
  to_status text,
  job_id uuid references jobs(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Invitations equipe
create table if not exists team_invitations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  team_role text not null check (team_role in ('admin', 'recruiter', 'viewer')),
  invited_by uuid references profiles(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  token text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz default now(),
  unique(company_id, email)
);

-- Vues uniques par offre (fingerprint = hash IP + UA)
create table if not exists job_views (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  fingerprint text not null,
  user_agent text,
  referrer text,
  created_at timestamptz default now(),
  unique(job_id, fingerprint)
);

-- Cooptation / referral
create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  referrer_id uuid not null references profiles(id),
  referrer_name text not null,
  token text unique default encode(gen_random_bytes(12), 'hex'),
  candidate_name text,
  candidate_email text,
  status text default 'pending' check (status in ('pending', 'applied', 'hired', 'expired')),
  application_id uuid references applications(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Entretiens
create table if not exists interviews (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_name text not null,
  interviewer_id uuid references profiles(id),
  interviewer_name text,
  type text default 'onsite' check (type in ('onsite', 'visio', 'phone')),
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')),
  scheduled_at timestamptz not null,
  duration_minutes integer default 45,
  location text,
  visio_link text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scorecards d'entretien
create table if not exists interview_scorecards (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  interviewer_id uuid not null references profiles(id),
  interviewer_name text not null,
  overall_rating integer default 0 check (overall_rating >= 0 and overall_rating <= 5),
  recommendation text check (recommendation in ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  notes text,
  criteria jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Log des vues de profil candidat
create table if not exists profile_views_log (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  viewer_id uuid references profiles(id),
  fingerprint text,
  created_at timestamptz default now(),
  unique(profile_id, fingerprint)
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

-- Companies : lecture publique
create policy "companies_read" on companies for select using (true);
-- Companies : creation par tout employer authentifie (onboarding)
create policy "companies_insert" on companies for insert with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'employer'
  )
);
-- Companies : update/delete par les membres admin/recruiter
create policy "companies_update" on companies for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = companies.id
    and profiles.team_role in ('admin', 'recruiter')
  )
);
create policy "companies_delete" on companies for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = companies.id
    and profiles.team_role = 'admin'
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

-- Stories : lecture publique, ecriture par les employeurs admin
create policy "stories_read" on stories for select using (true);
create policy "stories_write" on stories for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'employer'
    and profiles.team_role in ('admin', 'recruiter')
  )
);

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
