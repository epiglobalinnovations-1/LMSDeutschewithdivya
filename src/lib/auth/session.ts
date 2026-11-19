import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type SessionUser = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  profile: Profile | null;
  roles: AppRole[];
  isStaff: boolean;
  isAdmin: boolean;
};

/**
 * Data Access Layer: the one place that reads the session. Verifies the JWT
 * with Supabase Auth (getUser), then loads the profile and roles through RLS.
 * Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("roles(key)").eq("user_id", user.id),
  ]);
  if (profileError || rolesError) {
    // Surface to logs; the page still renders with safe defaults.
    console.error("session profile/roles load failed", profileError ?? rolesError);
  }

  const roles = (roleRows ?? [])
    .map((r) => (r.roles as { key: AppRole } | null)?.key)
    .filter((k): k is AppRole => Boolean(k));

  return {
    id: user.id,
    email: user.email ?? "",
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile,
    roles,
    isStaff: roles.includes("teacher") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
  };
});

/** For pages under /app: signed-in users only. */
export async function requireUser(next = "/app"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For pages under /admin: teachers and admins only. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!user.isStaff) redirect("/app?denied=admin");
  return user;
}

export function displayName(user: SessionUser) {
  return user.profile?.display_name || user.profile?.full_name?.split(" ")[0] || user.email.split("@")[0];
}
