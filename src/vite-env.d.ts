/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase — NEXT_PUBLIC_ prefix (from shared root .env.local).
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // Supabase — VITE_ prefix (project-local .env.local fallback).
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
