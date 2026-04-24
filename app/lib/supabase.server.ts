import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder";

/**
 * Create a Supabase client for server-side use.
 *
 * This landing page has no user authentication — all reads are public
 * (testimonials, FAQs) and waitlist inserts use the anon key with
 * permissive RLS. No cookie/session handling needed.
 */
export function createSupabaseClient() {
  const url = supabaseUrl;
  const anonKey = supabaseAnonKey;

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
