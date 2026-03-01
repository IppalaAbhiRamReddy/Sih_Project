// src/lib/supabase.js
// Supabase client singleton — import this everywhere instead of creating new instances.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Bypass Navigator LockManager to prevent 10s timeout errors
    // caused by stale sessions from hot-module-reload or multiple tabs.
    lock: (_name, _timeout, fn) => fn(),
  },
});
