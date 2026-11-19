#!/usr/bin/env bash
# Starts a minimal local Supabase-compatible stack for verification:
#   - Postgres 16 with the Supabase roles (port 54322)
#   - GoTrue (Supabase Auth) on port 9999
#   - PostgREST on port 3001
#   - gateway.mjs on :54321 (Supabase-style /auth/v1 and /rest/v1) with an
#     SMTP sink on :2500 whose captured emails are at http://localhost:54321/__mail
# Then applies migrations and seed. Used where the full `supabase start`
# stack (which needs ~12 images) is not available.
set -euo pipefail
cd "$(dirname "$0")"
SECRET_FILE=.jwt-secret
[ -f "$SECRET_FILE" ] || openssl rand -hex 32 > "$SECRET_FILE"
JWT=$(cat "$SECRET_FILE")

docker network inspect dwd >/dev/null 2>&1 || docker network create dwd >/dev/null
docker rm -f dwd-db dwd-auth dwd-rest >/dev/null 2>&1 || true

docker run -d --name dwd-db --network dwd -p 54322:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine >/dev/null
until docker exec dwd-db pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 2
until docker exec dwd-db pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
docker exec -i dwd-db psql -q -U postgres -d postgres -v ON_ERROR_STOP=1 < 00-roles.sql

docker run -d --name dwd-auth --network dwd -p 9999:9999 \
  -e GOTRUE_API_HOST=0.0.0.0 -e PORT=9999 \
  -e API_EXTERNAL_URL=http://localhost:54321 \
  -e GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify \
  -e GOTRUE_MAILER_URLPATHS_INVITE=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify \
  -e GOTRUE_DB_DRIVER=postgres \
  -e "GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:postgres@dwd-db:5432/postgres?search_path=auth" \
  -e GOTRUE_SITE_URL=http://localhost:3000 \
  -e GOTRUE_URI_ALLOW_LIST="http://localhost:3000/**" \
  -e GOTRUE_JWT_SECRET="$JWT" -e GOTRUE_JWT_EXP=3600 -e GOTRUE_JWT_AUD=authenticated \
  -e GOTRUE_JWT_ADMIN_ROLES=service_role -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
  -e GOTRUE_DISABLE_SIGNUP=false -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  -e GOTRUE_MAILER_AUTOCONFIRM=false \
  --add-host=host.docker.internal:host-gateway -e GOTRUE_SMTP_HOST=host.docker.internal -e GOTRUE_SMTP_PORT=2500 \
  -e GOTRUE_SMTP_ADMIN_EMAIL=hallo@deutschewithdivya.com -e GOTRUE_SMTP_SENDER_NAME="Deutsche with Divya" \
  -e GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 \
  supabase/gotrue:v2.180.0 >/dev/null
until curl -sf localhost:9999/health >/dev/null; do sleep 1; done
echo "auth up"
../local-stack/reset-db.sh

docker run -d --name dwd-rest --network dwd -p 3001:3000 \
  -e PGRST_DB_URI=postgres://authenticator:postgres@dwd-db:5432/postgres \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$JWT" -e PGRST_DB_USE_LEGACY_GUCS=false \
  postgrest/postgrest:v13.0.7 >/dev/null
until curl -s -o /dev/null localhost:3001/; do sleep 1; done
echo "rest up"

if ! curl -s -o /dev/null localhost:54321/__mail; then
  nohup node gateway.mjs > gateway.log 2>&1 &
  until curl -s -o /dev/null localhost:54321/__mail; do sleep 1; done
fi
echo "gateway up on http://localhost:54321"
node keys.mjs
