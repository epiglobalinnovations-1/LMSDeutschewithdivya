-- Local verification stack only: recreates the roles and grants a hosted
-- Supabase project already has, so migrations and RLS behave identically.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login password 'postgres' noinherit;
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login password 'postgres' createrole noinherit;
create schema if not exists auth authorization supabase_auth_admin;
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;
alter role supabase_auth_admin set search_path = auth;
grant create on database postgres to supabase_auth_admin;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
