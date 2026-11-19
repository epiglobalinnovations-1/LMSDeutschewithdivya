#!/usr/bin/env bash
# Drops and re-applies the public schema on the local verification database.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGPASSWORD=${PGPASSWORD:-postgres}
PSQL="psql -h localhost -p ${DB_PORT:-54322} -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL <<'SQL'
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_email_changed on auth.users;
delete from auth.users;
drop schema public cascade;
drop schema if exists private cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
SQL
for f in supabase/migrations/*.sql; do echo "applying $f"; $PSQL -f "$f"; done
if [ -f supabase/seed.sql ]; then echo "seeding"; $PSQL -f supabase/seed.sql; fi
for f in supabase/content/*.sql; do [ -f "$f" ] && { echo "content $f"; $PSQL -f "$f" >/dev/null; }; done
echo "done"
psql -h localhost -p ${DB_PORT:-54322} -U postgres -d postgres -q -c "notify pgrst, 'reload schema'" || true
