-- Create function to get user entitlements (bypasses RLS for server-side use)
CREATE OR REPLACE FUNCTION public.get_user_entitlements(p_user_id uuid)
RETURNS TABLE (
  tier_name text,
  scan_limit_per_month int,
  allow_soak boolean,
  allow_stress boolean,
  priority_queue boolean,
  retention_days int,
  max_concurrency int,
  subscription_status text,
  current_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    s.current_period_end
  FROM public.stripe_subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.current_period_end DESC
  LIMIT 1;
END;
$$;

-- Create function to get current month usage
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id uuid, p_period_start date)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COALESCE(scan_runs_created, 0) INTO v_count
  FROM public.usage_monthly
  WHERE user_id = p_user_id AND period_start = p_period_start;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Create function to increment usage (returns new count or -1 if over limit)
CREATE OR REPLACE FUNCTION public.increment_scan_usage(
  p_user_id uuid,
  p_period_start date,
  p_limit int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_new_count int;
BEGIN
  -- Get or create usage record with lock
  INSERT INTO public.usage_monthly (user_id, period_start, scan_runs_created)
  VALUES (p_user_id, p_period_start, 0)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Lock and check current usage
  SELECT scan_runs_created INTO v_current
  FROM public.usage_monthly
  WHERE user_id = p_user_id AND period_start = p_period_start
  FOR UPDATE;
  
  -- Check limit
  IF v_current >= p_limit THEN
    RETURN -1;
  END IF;
  
  -- Increment
  v_new_count := v_current + 1;
  UPDATE public.usage_monthly
  SET scan_runs_created = v_new_count, updated_at = now()
  WHERE user_id = p_user_id AND period_start = p_period_start;
  
  RETURN v_new_count;
END;
$$;

-- Create function to check if user can run gated tasks (for workers)
CREATE OR REPLACE FUNCTION public.can_run_gated_task(
  p_scan_run_id uuid,
  p_task_type text
)
RETURNS TABLE (
  allowed boolean,
  reason text,
  tier_name text,
  allow_soak boolean,
  allow_stress boolean,
  max_concurrency int,
  max_rps int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_user_id uuid;
  v_allow_advanced boolean;
  v_approved_production boolean;
  v_environment text;
  v_config jsonb;
BEGIN
  -- Get scan run details
  SELECT 
    sr.project_id,
    p.user_id,
    sr.allow_advanced_tests,
    sr.approved_for_production,
    p.environment::text,
    sr.config
  INTO v_project_id, v_user_id, v_allow_advanced, v_approved_production, v_environment, v_config
  FROM public.scan_runs sr
  JOIN public.projects p ON p.id = sr.project_id
  WHERE sr.id = p_scan_run_id;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Scan run not found'::text, null::text, false, false, 1, 10;
    RETURN;
  END IF;
  
  -- Get user entitlements
  RETURN QUERY
  SELECT 
    CASE
      -- Check task-specific gating
      WHEN p_task_type IN ('soak_test', 'soak') AND NOT COALESCE(e.allow_soak, false) THEN false
      WHEN p_task_type IN ('stress_test', 'stress', 'stress_recovery') AND NOT COALESCE(e.allow_stress, false) THEN false
      -- Check production approval for dangerous tasks
      WHEN p_task_type IN ('load_ramp_full', 'soak_test', 'stress_test') 
           AND v_environment = 'production' 
           AND NOT v_approved_production THEN false
      -- Check advanced tests flag
      WHEN p_task_type IN ('load_ramp_full', 'soak_test', 'stress_test') 
           AND NOT v_allow_advanced THEN false
      ELSE true
    END AS allowed,
    CASE
      WHEN p_task_type IN ('soak_test', 'soak') AND NOT COALESCE(e.allow_soak, false) 
        THEN 'Soak tests require Production tier'
      WHEN p_task_type IN ('stress_test', 'stress', 'stress_recovery') AND NOT COALESCE(e.allow_stress, false) 
        THEN 'Stress tests require Production tier'
      WHEN p_task_type IN ('load_ramp_full', 'soak_test', 'stress_test') 
           AND v_environment = 'production' 
           AND NOT v_approved_production 
        THEN 'Production environment requires explicit approval'
      WHEN p_task_type IN ('load_ramp_full', 'soak_test', 'stress_test') 
           AND NOT v_allow_advanced 
        THEN 'Advanced tests not enabled for this scan'
      ELSE 'Allowed'
    END AS reason,
    COALESCE(e.tier_name, 'none') AS tier_name,
    COALESCE(e.allow_soak, false) AS allow_soak,
    COALESCE(e.allow_stress, false) AS allow_stress,
    COALESCE(e.max_concurrency, 1) AS max_concurrency,
    COALESCE((v_config->>'maxRps')::int, 10) AS max_rps
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.get_user_entitlements(v_user_id) e ON true;
END;
$$;