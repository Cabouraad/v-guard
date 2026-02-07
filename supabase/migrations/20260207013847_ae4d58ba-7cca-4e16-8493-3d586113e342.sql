
-- B2: Restrict authenticated role to SELECT-only on user_entitlements view
REVOKE INSERT, UPDATE, DELETE ON public.user_entitlements FROM authenticated;
