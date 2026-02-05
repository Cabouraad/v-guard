
-- Drop and recreate with updated return type (adding cancel_at_period_end)
DROP FUNCTION IF EXISTS public.get_user_entitlements(uuid);

CREATE FUNCTION public.get_user_entitlements(p_user_id uuid)
 RETURNS TABLE(
   tier_name text,
   scan_limit_per_month integer,
   allow_soak boolean,
   allow_stress boolean,
   priority_queue boolean,
   retention_days integer,
   max_concurrency integer,
   subscription_status text,
   current_period_end timestamp with time zone,
   cancel_at_period_end boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
