-- Fix security issues from linter

-- 1. Drop the SECURITY DEFINER view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_entitlements;

CREATE VIEW public.user_entitlements
WITH (security_invoker = true)
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
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 'standard'
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 'production'
    ELSE 'unknown'
  END AS tier_name,
  CASE
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 5
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 15
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
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 30
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 180
    ELSE 7
  END AS retention_days,
  CASE
    WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 2
    WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 5
    ELSE 1
  END AS max_concurrency
FROM public.stripe_subscriptions s
WHERE s.status IN ('active', 'trialing');

-- 2. Add a restrictive SELECT policy to stripe_events (no users can access, only service role)
-- This policy uses a false condition so no authenticated users can read
CREATE POLICY "No user access to stripe events"
  ON public.stripe_events FOR SELECT
  USING (false);