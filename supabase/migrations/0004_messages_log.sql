-- ============================================================
-- MUR.MC — Migration 0004 : Journal des messages recruteur ↔ candidat
-- ============================================================
-- Objet : historiser tous les emails envoyes au candidat depuis l'ATS,
-- avec le statut d'envoi Resend, pour les afficher dans la fiche
-- candidate-detail (thread) et alimenter le reporting.
-- Idempotent.
-- ============================================================

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  -- "outbound" = recruteur -> candidat ; "inbound" = reponse (future)
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  -- kind = categorie fonctionnelle (status_update, custom, offer, rejection, interview_invite...)
  kind text not null default 'custom',
  subject text,
  body text not null,
  sent_by uuid references profiles(id) on delete set null,
  sent_by_name text,
  -- Statut d'envoi du provider email (Resend)
  delivery_status text not null default 'pending' check (
    delivery_status in ('pending', 'sent', 'failed')
  ),
  delivery_error text,
  created_at timestamptz default now()
);

create index if not exists idx_messages_application on messages(application_id);
create index if not exists idx_messages_created on messages(created_at desc);

alter table messages enable row level security;

-- Lecture : membres de la company (chemin applications -> jobs -> profiles)
-- + le candidat voit ses propres messages.
drop policy if exists "messages_read" on messages;
create policy "messages_read" on messages
for select using (
  exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    join profiles p on p.company_id = j.company_id
    where a.id = messages.application_id
    and p.id = auth.uid()
  )
  or exists (
    select 1 from applications a
    where a.id = messages.application_id
    and a.candidate_id = auth.uid()
  )
);

-- Insert : admin/recruiter de la company (les viewers ne peuvent pas envoyer)
drop policy if exists "messages_insert" on messages;
create policy "messages_insert" on messages
for insert with check (
  exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    join profiles p on p.company_id = j.company_id
    where a.id = messages.application_id
    and p.id = auth.uid()
    and p.team_role in ('admin', 'recruiter')
  )
);

-- Update : personne via anon key. Le statut delivery_status est bump
-- uniquement cote service_role (API route /api/notify).
-- Aucune policy update = deny all (bypass service_role).
