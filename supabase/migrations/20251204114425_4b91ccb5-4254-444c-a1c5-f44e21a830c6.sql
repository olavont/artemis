-- Remove the foreign key constraint from profiles to auth.users
-- This allows Keycloak users (who don't exist in auth.users) to have profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;