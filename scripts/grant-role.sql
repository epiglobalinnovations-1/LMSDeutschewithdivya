-- Grant a role to an existing account (run in the Supabase SQL editor).
-- Used once to make Divya an administrator and teacher after she signs up.
--
--   1. Divya registers at /register and confirms her email.
--   2. Replace the email below and run this script.

with target as (
  select id from auth.users where email = lower('divya@example.com')
)
insert into public.user_roles (user_id, role_id)
select target.id, r.id
from target
cross join public.roles r
where r.key in ('teacher', 'admin')
on conflict do nothing;

-- Check:
-- select u.email, array_agg(r.key) from auth.users u
--   join public.user_roles ur on ur.user_id = u.id
--   join public.roles r on r.id = ur.role_id
--  group by u.email;
