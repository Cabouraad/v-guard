import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
 
const ALLOWED_ORIGINS = [
  "https://v-guard.lovable.app",
  "https://id-preview--f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovable.app",
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
   console.log(`[STRIPE-PORTAL] ${step}${detailsStr}`);
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
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
       { auth: { persistSession: false } }
     );
 
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) throw new Error("No authorization header provided");
 
     const token = authHeader.replace("Bearer ", "");
     const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
     if (userError) throw new Error(`Authentication error: ${userError.message}`);
     
     const user = userData.user;
     if (!user?.email) throw new Error("User not authenticated or email not available");
     logStep("User authenticated", { userId: user.id, email: user.email });
 
     const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
 
     // Find customer by email
     const customers = await stripe.customers.list({ email: user.email, limit: 1 });
     if (customers.data.length === 0) {
       throw new Error("No Stripe customer found for this user");
     }
     const customerId = customers.data[0].id;
     logStep("Found Stripe customer", { customerId });
 
     const origin = req.headers.get("origin") || "http://localhost:5173";
 
     const portalSession = await stripe.billingPortal.sessions.create({
       customer: customerId,
       return_url: `${origin}/dashboard`,
     });
 
     logStep("Portal session created", { sessionId: portalSession.id });
 
     return new Response(JSON.stringify({ url: portalSession.url }), {
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