import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xgokwsumwgvnmcambeeb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnb2t3c3Vtd2d2bm1jYW1iZWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjQ2NTYsImV4cCI6MjA5MzgwMDY1Nn0.gXt5Uq-b4FnY2sYC3neWja0wNHNAX0WHbG5FJ5aKE7U";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? SUPABASE_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill in your Supabase credentials.",
  );
}

export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: false, // we use a custom username/password flow
      autoRefreshToken: false,
    },
  },
);
