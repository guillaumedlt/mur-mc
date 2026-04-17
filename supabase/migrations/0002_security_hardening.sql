-- ============================================================
-- MUR.MC — Migration 0002 : Security hardening (P0)
-- Executee en prod le 2026-04-16 via Management API
-- ============================================================
--
-- Objet :
--  1. FIX CRITIQUE : la policy team_invitations.invitations_read etait
--     "using (true)" → tout user authentifie pouvait lire TOUS les tokens
--     d'invitation de toutes les companies. On la remplace.
--  2. FIX : profile_views_log.profile_views_write acceptait tout insert
--     (with_check = true). On exige viewer_id = auth.uid().
--  3. Trigger BEFORE UPDATE sur profiles : bloque la self-escalation de
--     role / team_role / company_id. Bypass pour service_role.
--  4. Colonne expires_at (30j) sur team_invitations.
--  5. Table rate_limits + RPC check_rate_limit() pour remplacer le store
--     in-memory de src/lib/rate-limit.ts (reset a chaque redeploy).
--  6. Index de performance manquants.
--
-- Idempotent : executable plusieurs fois sans effet de bord.
-- ============================================================


-- 1. FIX CRITIQUE : invitations_read trop permissive
drop policy if exists "invitations_read" on team_invitations;
create policy "invitations_read" on team_invitations
for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.company_id = team_invitations.company_id
  )
);


-- 2. FIX : profile_views_write sans verification de viewer_id
drop policy if exists "profile_views_write" on profile_views_log;
create policy "profile_views_write" on profile_views_log
for insert with check (
  viewer_id = auth.uid()
);


-- 3. Trigger anti-self-escalation sur profiles
create or replace function prevent_profile_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.id = auth.uid() then
    if old.role is distinct from new.role then
      raise exception 'Modification interdite du champ role (self-escalation bloquee)';
    end if;
    if old.team_role is distinct from new.team_role then
      raise exception 'Modification interdite du champ team_role (self-escalation bloquee)';
    end if;
    if old.company_id is distinct from new.company_id then
      raise exception 'Modification interdite du champ company_id (self-escalation bloquee)';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_no_self_escalation on profiles;
create trigger trg_profiles_no_self_escalation
  before update on profiles
  for each row execute function prevent_profile_self_escalation();


-- 4. team_invitations : expires_at 30j + index
alter table team_invitations
  add column if not exists expires_at timestamptz default (now() + interval '30 days');

update team_invitations
  set expires_at = created_at + interval '30 days'
  where expires_at is null;

create index if not exists idx_team_invitations_token on team_invitations(token);
create index if not exists idx_team_invitations_company on team_invitations(company_id);


-- 5. rate_limits : persistance des quotas AI
create table if not exists rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table rate_limits enable row level security;
-- Aucune policy = deny all sauf service_role (utilise par la RPC ci-dessous)

create or replace function check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_limit int,
  p_window_seconds int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_end timestamptz;
  v_count int;
  v_window_start timestamptz;
begin
  insert into rate_limits (user_id, endpoint, count, window_start)
    values (p_user_id, p_endpoint, 0, v_now)
    on conflict (user_id, endpoint) do nothing;

  select count, window_start into v_count, v_window_start
    from rate_limits
    where user_id = p_user_id and endpoint = p_endpoint
    for update;

  v_window_end := v_window_start + make_interval(secs => p_window_seconds);

  if v_now > v_window_end then
    update rate_limits
      set count = 1, window_start = v_now
      where user_id = p_user_id and endpoint = p_endpoint;
    return jsonb_build_object(
      'allowed', true,
      'remaining', p_limit - 1,
      'reset_in_seconds', p_window_seconds
    );
  end if;

  if v_count >= p_limit then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_in_seconds', greatest(1, extract(epoch from (v_window_end - v_now))::int)
    );
  end if;

  update rate_limits
    set count = count + 1
    where user_id = p_user_id and endpoint = p_endpoint;

  return jsonb_build_object(
    'allowed', true,
    'remaining', p_limit - v_count - 1,
    'reset_in_seconds', greatest(1, extract(epoch from (v_window_end - v_now))::int)
  );
end;
$$;

revoke all on function check_rate_limit(uuid, text, int, int) from public;
revoke all on function check_rate_limit(uuid, text, int, int) from anon;
revoke all on function check_rate_limit(uuid, text, int, int) from authenticated;


-- 6. Index de performance manquants
create index if not exists idx_manual_candidates_company on manual_candidates(company_id);
create index if not exists idx_manual_candidates_job on manual_candidates(job_id);
create index if not exists idx_candidate_events_candidate on candidate_events(candidate_id);
create index if not exists idx_referrals_company on referrals(company_id);
create index if not exists idx_referrals_referrer on referrals(referrer_id);
create index if not exists idx_interviews_job on interviews(job_id);
create index if not exists idx_interviews_application on interviews(application_id);
create index if not exists idx_interviews_scheduled on interviews(scheduled_at);
create index if not exists idx_scorecards_application on interview_scorecards(application_id);
create index if not exists idx_job_views_job on job_views(job_id);
create index if not exists idx_profile_views_profile on profile_views_log(profile_id);
create index if not exists idx_rate_limits_window on rate_limits(window_start);


-- ============================================================
-- FIN MIGRATION 0002 — verification post-execution :
--   select tablename, policyname, qual from pg_policies
--   where tablename='team_invitations' and policyname='invitations_read';
-- Doit retourner la version "exists profiles where company_id matches"
-- (pas "true").
-- ============================================================
