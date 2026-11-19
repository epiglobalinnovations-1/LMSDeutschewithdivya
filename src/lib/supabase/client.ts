"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/** Supabase client for Client Components (uses the publishable key + user session). */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
