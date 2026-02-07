import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = [
  "https://v-guard.lovable.app",
  "https://id-preview--f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovable.app",
  "https://f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovableproject.com",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Default response for users with no active subscription
const NO_SUBSCRIPTION = {
  subscribed: false,
  tier: null,
  price_id: null,
  subscription_end: null,
  cancel_at_period_end: false,
  scan_limit: 0,
  scans_used: 0,
  scans_remaining: 0,
  period_reset_date: null,
  allow_soak: false,
  allow_stress: false,
  priority_queue: false,
  retention_days: 7,
  max_concurrency: 1,
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Retry getUser up to 2 times to handle transient "Auth session missing" errors
    let userData;
    let userError;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.auth.getUser(token);
      userData = result.data;
      userError = result.error;
      if (!userError && userData?.user) break;
      if (attempt < 2) {
        logStep(`getUser attempt ${attempt + 1} failed, retrying...`, {
          error: userError?.message,
        });
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }

    if (userError) {
      logStep("Authentication failed after retries", { error: userError.message });
      return new Response(JSON.stringify({ error: `Authentication error: ${userError.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id });

    // Check if this is an internal test user (server-side only, cannot be spoofed)
    const { data: isTestUser } = await supabase.rpc("is_internal_test_user", {
      p_user_id: user.id,
    });
    logStep("Test user check", { isTestUser: !!isTestUser });

    // ── Read entitlements from DB (no Stripe API call) ──────────────
    const { data: entitlements, error: entError } = await supabase
      .rpc("get_user_entitlements", { p_user_id: user.id });

    if (entError) {
      logStep("Entitlements query error", { message: entError.message });
      throw new Error(`Failed to read entitlements: ${entError.message}`);
    }

    // No active subscription found in DB
    if (!entitlements || entitlements.length === 0) {
      logStep("No active subscription in database");
      return new Response(JSON.stringify(NO_SUBSCRIPTION), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const ent = entitlements[0];
    logStep("Entitlements loaded from DB", {
      tier: ent.tier_name,
      status: ent.subscription_status,
      scanLimit: ent.scan_limit_per_month,
    });

    // ── Read monthly usage from DB ──────────────────────────────────
    const periodEnd = new Date(ent.current_period_end);
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const periodStartStr = periodStart.toISOString().split("T")[0];

    const { data: usageData } = await supabase.rpc("get_monthly_usage", {
      p_user_id: user.id,
      p_period_start: periodStartStr,
    });
    const scansUsed = usageData ?? 0;

    const scanLimit = ent.scan_limit_per_month;
    const subscriptionEnd = new Date(ent.current_period_end).toISOString();

    const response = {
      subscribed: true,
      tier: ent.tier_name,
      price_id: null, // Not exposed to client; tier name is sufficient
      subscription_end: subscriptionEnd,
      cancel_at_period_end: ent.cancel_at_period_end ?? false,
      scan_limit: scanLimit,
      scans_used: scansUsed,
      scans_remaining: Math.max(0, scanLimit - scansUsed),
      period_reset_date: subscriptionEnd,
      allow_soak: ent.allow_soak,
      allow_stress: ent.allow_stress,
      priority_queue: ent.priority_queue,
      retention_days: ent.retention_days,
      max_concurrency: ent.max_concurrency,
      is_test_user: !!isTestUser,
    };

    logStep("Returning DB-driven entitlements", {
      tier: response.tier,
      scansUsed,
      scansRemaining: response.scans_remaining,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
