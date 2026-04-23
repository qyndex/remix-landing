import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Create a Supabase client for server-side use.
 *
 * This landing page has no user authentication — all reads are public
 * (testimonials, FAQs) and waitlist inserts use the anon key with
 * permissive RLS. No cookie/session handling needed.
 */
export function createSupabaseClient() {
  const url = requireEnv("SUPABASE_URL", supabaseUrl);
  const anonKey = requireEnv("SUPABASE_ANON_KEY", supabaseAnonKey);

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
