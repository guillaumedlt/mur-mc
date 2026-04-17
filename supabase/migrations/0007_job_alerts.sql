-- ============================================================
-- MUR.MC — Migration 0007 : Alertes email emploi
-- ============================================================
-- Les visiteurs SEO qui arrivent sur /emploi-monaco/metier/comptable
-- peuvent s'inscrire pour recevoir les nouvelles offres par email.
-- Fonctionne aussi pour les secteurs et contrats.
-- ============================================================

create table if not exists job_alerts (
  id uuid primary key default uuid_generate_v4(),
  -- L'user peut etre connecte (profile_id) ou juste un email anonyme
  profile_id uuid references profiles(id) on delete cascade,
  email text not null,
  -- Criteres de matching (au moins un requis)
  keywords text[] default '{}',       -- mots-cles dans le titre (ex: ["comptab", "accounting"])
  sector text,                         -- secteur exact (ex: "Banque & Finance")
  contract_type text,                  -- type de contrat (ex: "CDI")
  -- Meta
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  active boolean default true,
  token text unique default encode(gen_random_bytes(16), 'hex'),
  last_sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_job_alerts_email on job_alerts(email);
create index if not exists idx_job_alerts_active on job_alerts(active) where active = true;
create index if not exists idx_job_alerts_profile on job_alerts(profile_id);

alter table job_alerts enable row level security;

-- Lecture : le user voit ses propres alertes
drop policy if exists "job_alerts_own_read" on job_alerts;
create policy "job_alerts_own_read" on job_alerts
for select using (
  profile_id = auth.uid()
);

-- Insert : tout user authentifie peut creer une alerte
drop policy if exists "job_alerts_insert" on job_alerts;
create policy "job_alerts_insert" on job_alerts
for insert with check (
  profile_id = auth.uid()
);

-- Delete : le user peut supprimer ses propres alertes
drop policy if exists "job_alerts_own_delete" on job_alerts;
create policy "job_alerts_own_delete" on job_alerts
for delete using (
  profile_id = auth.uid()
);

-- Les insertions anonymes (sans auth, juste email) passent par service_role
-- via l'API route POST /api/alerts (pas de RLS pour anon insert).
