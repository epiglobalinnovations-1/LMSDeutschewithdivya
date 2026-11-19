import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Session-less client for public pages (course catalogue, pricing). Reads only
 * what anonymous visitors may see under RLS, and keeps those pages cacheable.
 * Returns null when Supabase is not configured, so pages can render a notice.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
