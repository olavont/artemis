// Public (non-secret) Supabase configuration.
// NOTE: In Lovable published apps, Vite env (import.meta.env) may not be available.
// These values are safe to ship to the client (anon/publishable key).

export const SUPABASE_PROJECT_REF = "scvjvglrzriqkirpotxq";
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// Anon (publishable) key – safe to expose in the frontend.
export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmp2Z2xyenJpcWtpcnBvdHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDEzNDMsImV4cCI6MjA4MDI3NzM0M30.fFTskWARW_cNgyioTb1HHEMZmOKFiLKdYHKAVduhgVw";
