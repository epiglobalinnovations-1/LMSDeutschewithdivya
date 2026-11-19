import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Acts as the signed-in user, so Row Level Security applies to every query.
 */
export async function createClient() {
  // Read cookies first: this marks the route as dynamic even when Supabase is
  // not configured (for example a CI build without credentials).
  const cookieStore = await cookies();
  assertSupabaseConfigured();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session cookie, so this is safe to ignore.
        }
      },
    },
  });
}
