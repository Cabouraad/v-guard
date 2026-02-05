
-- Step 1: Recreate the view with security_barrier to prevent optimization leakage
CREATE OR REPLACE VIEW public.user_entitlements WITH (security_barrier = true) AS
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
        WHEN s.price_id = 'price_1SxHvm1B5M2OuX4nxghY7dP7' THEN 'production'
        WHEN s.price_id = 'price_1SxHva1B5M2OuX4nze4AU7Up' THEN 'standard'
        ELSE 'free'
    END AS tier_name
FROM public.stripe_subscriptions s
WHERE s.status IN ('active', 'trialing')
  AND s.user_id = auth.uid();

-- Step 2: Revoke all access from anon role
REVOKE ALL ON public.user_entitlements FROM anon;

-- Step 3: Grant SELECT-only to authenticated users
GRANT SELECT ON public.user_entitlements TO authenticated;

-- Step 4: Ensure service_role retains full access (for Edge Functions)
GRANT ALL ON public.user_entitlements TO service_role;
