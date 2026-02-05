-- =============================================
-- STRIPE SUBSCRIPTION TABLES
-- =============================================

-- Table: stripe_customers (links users to Stripe customers)
CREATE TABLE public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: stripe_subscriptions (tracks subscription state)
CREATE TABLE public.stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: stripe_events (idempotency tracking for webhooks)
CREATE TABLE public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Table: usage_monthly (tracks scan usage per billing period)
CREATE TABLE public.usage_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  scan_runs_created integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);
CREATE INDEX idx_usage_monthly_user_period ON public.usage_monthly(user_id, period_start);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_monthly_updated_at
  BEFORE UPDATE ON public.usage_monthly
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_monthly ENABLE ROW LEVEL SECURITY;

-- stripe_customers: Users can only READ their own record
CREATE POLICY "Users can view their own stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

-- stripe_subscriptions: Users can only READ their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- stripe_events: No user access (server-only via service role)
-- No policies = no access for authenticated users

-- usage_monthly: Users can only READ their own usage
CREATE POLICY "Users can view their own usage"
  ON public.usage_monthly FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- ENTITLEMENTS VIEW
-- =============================================
CREATE OR REPLACE VIEW public.user_entitlements AS
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