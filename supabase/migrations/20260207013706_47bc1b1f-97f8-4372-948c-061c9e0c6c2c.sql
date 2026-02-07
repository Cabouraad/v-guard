
-- B1: Revoke all write privileges from anon on onboarding_progress
REVOKE INSERT, UPDATE, DELETE ON public.onboarding_progress FROM anon;
