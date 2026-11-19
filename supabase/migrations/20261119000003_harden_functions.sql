-- =============================================================================
-- Hardening from the Supabase security advisor
--
-- * Role helpers move to a "private" schema. RLS policies still call them
--   (policies reference functions by OID, so they follow the move), but they
--   are no longer exposed as /rest/v1/rpc endpoints.
-- * current_plan_tier stays callable by signed-in users (it only reveals the
--   caller's own tier) but not by anonymous visitors.
-- * Trigger function gets a fixed search_path.
-- =============================================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

alter function public.has_role(public.app_role) set schema private;
alter function public.is_staff() set schema private;
alter function public.is_admin() set schema private;

-- Bodies referenced public.has_role; recreate with the new location.
create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_role('teacher') or private.has_role('admin');
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_role('admin');
$$;

revoke all on function private.has_role(public.app_role) from public;
revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function private.is_staff() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

revoke execute on function public.current_plan_tier() from public, anon;
grant execute on function public.current_plan_tier() to authenticated, service_role;

alter function public.set_updated_at() set search_path = public;
