
-- 1. Create a helper function to check internal test user status
-- This is SECURITY DEFINER so it can access auth.users safely
CREATE OR REPLACE FUNCTION public.is_internal_test_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
      AND (raw_app_meta_data->>'internal_test_user')::boolean = true
  );
$$;

-- 2. Update get_user_entitlements to return Production entitlements for internal test users
CREATE OR REPLACE FUNCTION public.get_user_entitlements(p_user_id uuid)
 RETURNS TABLE(tier_name text, scan_limit_per_month integer, allow_soak boolean, allow_stress boolean, priority_queue boolean, retention_days integer, max_concurrency integer, subscription_status text, current_period_end timestamp with time zone, cancel_at_period_end boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Internal test users get full Production entitlements without a Stripe subscription
  IF public.is_internal_test_user(p_user_id) THEN
    RETURN QUERY SELECT
      'production'::text AS tier_name,
      9999 AS scan_limit_per_month,
      true AS allow_soak,
      true AS allow_stress,
      true AS priority_queue,
      180 AS retention_days,
      5 AS max_concurrency,
      'active'::text AS subscription_status,
      (now() + interval '10 years')::timestamptz AS current_period_end,
      false AS cancel_at_period_end;
    RETURN;
  END IF;

  -- Standard path: read from stripe_subscriptions
  RETURN QUERY
  SELECT
    CASE
      WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 'standard'::text
      WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 'production'::text
      ELSE 'none'::text
    END AS tier_name,
    CASE
      WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 5
      WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 15
      ELSE 0
    END AS scan_limit_per_month,
    CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS allow_soak,
    CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS allow_stress,
    CASE WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN true ELSE false END AS priority_queue,
    CASE
      WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 30
      WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 180
      ELSE 7
    END AS retention_days,
    CASE
      WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 2
      WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 5
      ELSE 1
    END AS max_concurrency,
    s.status AS subscription_status,
    s.current_period_end,
    s.cancel_at_period_end
  FROM public.stripe_subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.current_period_end DESC
  LIMIT 1;
END;
$function$;

-- 3. Update user_entitlements view to include internal test users
DROP VIEW IF EXISTS public.user_entitlements;

CREATE VIEW public.user_entitlements
WITH (security_barrier = true, security_invoker = true)
AS
-- Regular subscribers
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
  AND s.user_id = auth.uid()
  AND NOT public.is_internal_test_user(auth.uid())

UNION ALL

-- Internal test users get synthetic Production entitlements
SELECT
  auth.uid() AS user_id,
  'internal_test'::text AS stripe_subscription_id,
  'price_1SxHvm1B5M2OuX4nxghY7dP7'::text AS price_id,
  'active'::text AS status,
  now() AS current_period_start,
  (now() + interval '10 years')::timestamptz AS current_period_end,
  false AS cancel_at_period_end,
  9999 AS scan_limit_per_month,
  true AS allow_soak,
  true AS allow_stress,
  true AS priority_queue,
  180 AS retention_days,
  5 AS max_concurrency,
  'production'::text AS tier_name
WHERE public.is_internal_test_user(auth.uid());

-- Re-apply grants
REVOKE ALL ON public.user_entitlements FROM anon;
GRANT SELECT ON public.user_entitlements TO authenticated;
