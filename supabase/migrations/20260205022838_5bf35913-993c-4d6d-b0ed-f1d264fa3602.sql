-- Drop existing view
DROP VIEW IF EXISTS public.user_entitlements;

-- Recreate view with security_invoker to enforce caller's permissions
-- This means the view will respect RLS on stripe_subscriptions (which has user_id = auth.uid())
CREATE VIEW public.user_entitlements
WITH (security_invoker = on)
AS
SELECT
  s.user_id,
  s.stripe_subscription_id,
  s.price_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  -- Compute tier-based entitlements
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 15  -- production
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 5   -- standard
    ELSE 0
  END AS scan_limit_per_month,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true
    ELSE false
  END AS allow_soak,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true
    ELSE false
  END AS allow_stress,
  CASE
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true
    ELSE false
  END AS priority_queue,
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
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 'production'
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 'standard'
    ELSE 'free'
  END AS tier_name
FROM public.stripe_subscriptions s
WHERE s.status IN ('active', 'trialing');

-- Grant SELECT only to authenticated users (view inherits RLS from stripe_subscriptions)
GRANT SELECT ON public.user_entitlements TO authenticated;

-- Revoke all from anon
REVOKE ALL ON public.user_entitlements FROM anon;

-- Views are read-only by default, no INSERT/UPDATE/DELETE possible
-- Service-role edge functions write to stripe_subscriptions directly, not the view