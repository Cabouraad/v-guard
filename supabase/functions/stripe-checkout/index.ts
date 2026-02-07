import Stripe from "stripe";
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
 
 // Price IDs for subscription tiers
 const PRICE_IDS = {
   standard: "price_1SxHva1B5M2OuX4nze4AU7Up",
   production: "price_1SxHvm1B5M2OuX4nxghY7dP7",
 };
 
 const logStep = (step: string, details?: unknown) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
   console.log(`[STRIPE-CHECKOUT] ${step}${detailsStr}`);
 };
 
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
 
   try {
     logStep("Function started");
 
     const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
     if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
     logStep("Stripe key verified");
 
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error(`Authentication error: ${claimsError?.message || "Invalid token"}`);

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userEmail) throw new Error("User email not available in token");
    logStep("User authenticated", { userId, email: userEmail });

    // ── Bypass Stripe for internal test users ──────────────────────
    const { data: isTestUser } = await supabaseAdmin.rpc("is_internal_test_user", { p_user_id: userId });
    if (isTestUser) {
      logStep("Internal test user detected — skipping Stripe checkout", { userId });
      return new Response(
        JSON.stringify({
          error: "TEST_USER_BYPASS",
          message: "Internal test users already have full Production entitlements. No subscription required.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse request body for tier selection
    const { tier = "standard" } = await req.json().catch(() => ({}));
     const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS] || PRICE_IDS.standard;
     logStep("Selected tier", { tier, priceId });
 
     const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
 
     // Check for existing customer
     const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
     let customerId: string | undefined;
     if (customers.data.length > 0) {
       customerId = customers.data[0].id;
       logStep("Found existing Stripe customer", { customerId });
     }
 
     const origin = req.headers.get("origin") || "http://localhost:5173";
 
     const session = await stripe.checkout.sessions.create({
       customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        client_reference_id: userId,
       line_items: [
         {
           price: priceId,
           quantity: 1,
         },
       ],
       mode: "subscription",
       success_url: `${origin}/dashboard?checkout=success`,
       cancel_url: `${origin}/pricing?checkout=canceled`,
       metadata: {
         user_id: userId,
         tier: tier,
       },
     });
 
     logStep("Checkout session created", { sessionId: session.id });
 
     return new Response(JSON.stringify({ url: session.url }), {
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