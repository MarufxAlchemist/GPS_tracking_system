import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment variables
// Vite exposes vars prefixed with VITE_ or NEXT_PUBLIC_ (see vite.config.ts).
// We read NEXT_PUBLIC_ first (shared root .env.local) then fall back to VITE_.
// ---------------------------------------------------------------------------

// Safe access — import.meta.env may be undefined during SSR precompilation
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {} as Record<string, string>;

const supabaseUrl: string =
  env["NEXT_PUBLIC_SUPABASE_URL"] ??
  env["VITE_SUPABASE_URL"] ??
  "";

const supabaseAnonKey: string =
  env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??
  env["VITE_SUPABASE_ANON_KEY"] ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  // Only throw on the client side — SSR may not have env vars during prerender
  if (typeof window !== "undefined") {
    throw new Error(
      "Missing Supabase environment variables.\n" +
        "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "are set in .env.local (project root or sentinel-ai/).",
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton client — import this wherever you need Supabase access.
// We create a safe dummy client on the server if vars are missing.
// ---------------------------------------------------------------------------
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      // Persist the session in localStorage so the user stays logged in
      // across page refreshes.
      persistSession: typeof window !== "undefined",
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== "undefined",
    },
  },
);

// Re-export the URL so other modules can construct storage/function URLs.
export { supabaseUrl };
