
-- Fix: Recreate user_entitlements view with SECURITY INVOKER
-- This ensures RLS from the underlying stripe_subscriptions table is enforced
-- (the querying user's permissions apply, not the view owner's)

DROP VIEW IF EXISTS public.user_entitlements;

CREATE VIEW public.user_entitlements
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  s.user_id,
  s.stripe_subscription_id,
  s.price_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 15
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 5
    ELSE 0
  END AS scan_limit_per_month,
  CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS allow_soak,
  CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS allow_stress,
  CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS priority_queue,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 180
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 30
    ELSE 7
  END AS retention_days,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 5
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 2
    ELSE 1
  END AS max_concurrency,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 'production'::text
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 'standard'::text
    ELSE 'free'::text
  END AS tier_name
FROM public.stripe_subscriptions s
WHERE s.status IN ('active', 'trialing')
  AND s.user_id = auth.uid();

-- Revoke all access from anonymous users
REVOKE ALL ON public.user_entitlements FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.user_entitlements TO authenticated;
