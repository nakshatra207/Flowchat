import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://bmuouuccqbjvewfcprjc.supabase.co";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdW91dWNjcWJqdmV3ZmNwcmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjE3NzgsImV4cCI6MjA5NzE5Nzc3OH0.iyh2xMqCRQHO9jZhKsAHAclezz-5qYf0f3136_MK_cQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
