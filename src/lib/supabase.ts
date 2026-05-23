import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment variables
// Vite exposes vars prefixed with VITE_ or NEXT_PUBLIC_ (see vite.config.ts).
// We read NEXT_PUBLIC_ first (shared root .env.local) then fall back to VITE_.
// ---------------------------------------------------------------------------
const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
      "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "are set in .env.local (project root or sentinel-ai/).",
  );
}

// ---------------------------------------------------------------------------
// Singleton client — import this wherever you need Supabase access.
// ---------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in localStorage so the user stays logged in
    // across page refreshes.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Re-export the URL so other modules can construct storage/function URLs.
export { supabaseUrl };
