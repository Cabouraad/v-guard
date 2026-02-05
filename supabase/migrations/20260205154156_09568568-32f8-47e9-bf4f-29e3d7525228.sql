-- SECURITY HARDENING: Revoke anon access from all user tables
-- RLS provides row-level protection, but grants provide table-level access control (defense in depth)

-- Revoke ALL from anon on user-owned tables
REVOKE ALL ON public.projects FROM anon;
REVOKE ALL ON public.scan_runs FROM anon;
REVOKE ALL ON public.scan_tasks FROM anon;
REVOKE ALL ON public.scan_findings FROM anon;
REVOKE ALL ON public.scan_metrics FROM anon;
REVOKE ALL ON public.scan_artifacts FROM anon;
REVOKE ALL ON public.scan_reports FROM anon;
REVOKE ALL ON public.stripe_customers FROM anon;
REVOKE ALL ON public.stripe_events FROM anon;
REVOKE ALL ON public.stripe_subscriptions FROM anon;
REVOKE ALL ON public.usage_monthly FROM anon;
REVOKE ALL ON public.user_entitlements FROM anon;

-- Restrict authenticated users to minimal required permissions
-- Projects: users need full CRUD for their own projects
REVOKE ALL ON public.projects FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- Scan runs: users need full CRUD
REVOKE ALL ON public.scan_runs FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_runs TO authenticated;

-- Scan tasks: users only need SELECT (writes via edge functions)
REVOKE ALL ON public.scan_tasks FROM authenticated;
GRANT SELECT ON public.scan_tasks TO authenticated;

-- Scan findings: users only need SELECT (writes via edge functions)
REVOKE ALL ON public.scan_findings FROM authenticated;
GRANT SELECT ON public.scan_findings TO authenticated;

-- Scan metrics: users only need SELECT (writes via edge functions)
REVOKE ALL ON public.scan_metrics FROM authenticated;
GRANT SELECT ON public.scan_metrics TO authenticated;

-- Scan artifacts: users only need SELECT (writes via edge functions)
REVOKE ALL ON public.scan_artifacts FROM authenticated;
GRANT SELECT ON public.scan_artifacts TO authenticated;

-- Scan reports: users only need SELECT (writes via edge functions)
REVOKE ALL ON public.scan_reports FROM authenticated;
GRANT SELECT ON public.scan_reports TO authenticated;

-- Billing tables: SELECT only (writes via Stripe webhooks with service role)
REVOKE ALL ON public.stripe_customers FROM authenticated;
GRANT SELECT ON public.stripe_customers TO authenticated;

REVOKE ALL ON public.stripe_events FROM authenticated;
-- No SELECT for stripe_events (already blocked by RLS policy USING(false))

REVOKE ALL ON public.stripe_subscriptions FROM authenticated;
GRANT SELECT ON public.stripe_subscriptions TO authenticated;

REVOKE ALL ON public.usage_monthly FROM authenticated;
GRANT SELECT ON public.usage_monthly TO authenticated;

-- User entitlements view: SELECT only
REVOKE ALL ON public.user_entitlements FROM authenticated;
GRANT SELECT ON public.user_entitlements TO authenticated;