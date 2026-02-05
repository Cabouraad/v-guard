 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import Stripe from "stripe";
 import { createClient } from "@supabase/supabase-js";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Price IDs to tier mapping
 const PRICE_TO_TIER: Record<string, string> = {
   "price_1SxHva1B5M2OuX4nze4AU7Up": "standard",
   "price_1SxHvm1B5M2OuX4nxghY7dP7": "production",
 };
 
 const logStep = (step: string, details?: unknown) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
   console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
 };
 
 serve(async (req) => {
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
 
     // Find customer
     const customers = await stripe.customers.list({ email: user.email, limit: 1 });
     if (customers.data.length === 0) {
       logStep("No customer found");
       return new Response(JSON.stringify({ 
         subscribed: false,
         tier: null,
         subscription_end: null,
         scan_limit: 0,
         allow_soak: false,
         allow_stress: false,
         priority_queue: false,
         retention_days: 7,
         max_concurrency: 1,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
         status: 200,
       });
     }
 
     const customerId = customers.data[0].id;
     logStep("Found Stripe customer", { customerId });
 
     // Get active subscriptions
     const subscriptions = await stripe.subscriptions.list({
       customer: customerId,
       status: "active",
       limit: 1,
     });
 
     if (subscriptions.data.length === 0) {
       logStep("No active subscription found");
       return new Response(JSON.stringify({ 
         subscribed: false,
         tier: null,
         subscription_end: null,
         scan_limit: 0,
         allow_soak: false,
         allow_stress: false,
         priority_queue: false,
         retention_days: 7,
         max_concurrency: 1,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
         status: 200,
       });
     }
 
     const subscription = subscriptions.data[0] as unknown as {
       id: string;
       current_period_end: number;
       cancel_at_period_end: boolean;
       items: { data: Array<{ price: { id: string } }> };
     };
     const priceId = subscription.items.data[0].price.id;
     const tier = PRICE_TO_TIER[priceId] || "unknown";
     const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
 
     logStep("Active subscription found", { 
       subscriptionId: subscription.id, 
       tier, 
       priceId,
       endDate: subscriptionEnd 
     });
 
     // Calculate entitlements based on tier
     const isProduction = tier === "production";
     const entitlements = {
       subscribed: true,
       tier,
       price_id: priceId,
       subscription_end: subscriptionEnd,
       cancel_at_period_end: subscription.cancel_at_period_end,
       scan_limit: isProduction ? 15 : 5,
       allow_soak: isProduction,
       allow_stress: isProduction,
       priority_queue: isProduction,
       retention_days: isProduction ? 180 : 30,
       max_concurrency: isProduction ? 5 : 2,
     };
 
     return new Response(JSON.stringify(entitlements), {
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