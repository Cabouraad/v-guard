 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import Stripe from "stripe";
 import { createClient } from "@supabase/supabase-js";
 
// No CORS headers — this endpoint is called server-to-server by Stripe only.
const jsonHeaders = { "Content-Type": "application/json" };
 
 const logStep = (step: string, details?: unknown) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
   console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
 };
 
serve(async (req) => {
  // Stripe webhooks are POST only — reject anything else.
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
 
   try {
     logStep("Webhook received");
 
     const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
     const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
     
     if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
     if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
 
     const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
 
     // Initialize Supabase with service role for writes
     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
       { auth: { persistSession: false } }
     );
 
     const signature = req.headers.get("stripe-signature");
     if (!signature) throw new Error("No stripe-signature header");
 
     const body = await req.text();
     let event: Stripe.Event;
 
     try {
       event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
     } catch (err) {
       const message = err instanceof Error ? err.message : "Unknown error";
       logStep("Webhook signature verification failed", { message });
        return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
          status: 400,
          headers: jsonHeaders,
        });
     }
 
     logStep("Event verified", { type: event.type, id: event.id });
 
     // Idempotency check
     const { data: existingEvent } = await supabaseAdmin
       .from("stripe_events")
       .select("id")
       .eq("stripe_event_id", event.id)
       .maybeSingle();
 
     if (existingEvent) {
       logStep("Event already processed", { eventId: event.id });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: jsonHeaders,
        });
     }
 
     // Record event for idempotency
     await supabaseAdmin.from("stripe_events").insert({
       stripe_event_id: event.id,
       event_type: event.type,
     });
 
     // Handle events
     switch (event.type) {
       case "checkout.session.completed": {
         const session = event.data.object as Stripe.Checkout.Session;
         logStep("Checkout completed", { sessionId: session.id });
 
         if (session.mode === "subscription" && session.subscription && session.customer) {
           const userId = session.client_reference_id || session.metadata?.user_id;
           if (!userId) {
             logStep("No user_id in session metadata");
             break;
           }
 
           const customerId = typeof session.customer === "string" 
             ? session.customer 
             : session.customer.id;
 
           // Upsert stripe_customers
           await supabaseAdmin
             .from("stripe_customers")
             .upsert({
               user_id: userId,
               stripe_customer_id: customerId,
             }, { onConflict: "user_id" });
 
           logStep("Customer record upserted", { userId, customerId });
 
           // Fetch subscription details
           const subscriptionId = typeof session.subscription === "string"
             ? session.subscription
             : session.subscription.id;
 
           const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
           const subscription = subscriptionResponse as unknown as {
             id: string;
             status: string;
             current_period_start: number;
             current_period_end: number;
             cancel_at_period_end: boolean;
             items: { data: Array<{ price: { id: string } }> };
           };
           const priceId = subscription.items.data[0].price.id;
 
           // Upsert stripe_subscriptions
           await supabaseAdmin
             .from("stripe_subscriptions")
             .upsert({
               user_id: userId,
               stripe_subscription_id: subscriptionId,
               price_id: priceId,
               status: subscription.status,
               current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
               current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
               cancel_at_period_end: subscription.cancel_at_period_end,
             }, { onConflict: "stripe_subscription_id" });
 
           logStep("Subscription record created", { subscriptionId, priceId, status: subscription.status });
         }
         break;
       }
 
       case "customer.subscription.updated": {
         const subscription = event.data.object as Stripe.Subscription;
         const sub = subscription as unknown as {
           id: string;
           status: string;
           current_period_start: number;
           current_period_end: number;
           cancel_at_period_end: boolean;
           items: { data: Array<{ price: { id: string } }> };
         };
         logStep("Subscription updated", { subscriptionId: sub.id, status: sub.status });
 
         const priceId = sub.items.data[0].price.id;
 
         const { error } = await supabaseAdmin
           .from("stripe_subscriptions")
           .update({
             price_id: priceId,
             status: sub.status,
             current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
             current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
             cancel_at_period_end: sub.cancel_at_period_end,
           })
           .eq("stripe_subscription_id", sub.id);
 
         if (error) {
           logStep("Failed to update subscription", { error: error.message });
         } else {
           logStep("Subscription record updated");
         }
         break;
       }
 
       case "customer.subscription.deleted": {
         const subscription = event.data.object as Stripe.Subscription;
         logStep("Subscription deleted", { subscriptionId: subscription.id });
 
         const { error } = await supabaseAdmin
           .from("stripe_subscriptions")
           .update({ status: "canceled" })
           .eq("stripe_subscription_id", subscription.id);
 
         if (error) {
           logStep("Failed to update subscription status", { error: error.message });
         } else {
           logStep("Subscription marked as canceled");
         }
         break;
       }
 
       case "invoice.payment_succeeded": {
         const invoice = event.data.object as Stripe.Invoice;
         const inv = invoice as unknown as { id: string; subscription?: string | { id: string } };
         if (inv.subscription) {
           logStep("Invoice paid, updating period", { invoiceId: invoice.id });
 
           const subscriptionId = typeof inv.subscription === "string"
             ? inv.subscription
             : inv.subscription.id;
 
           const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
           const subscription = subscriptionResponse as unknown as {
             status: string;
             current_period_start: number;
             current_period_end: number;
           };
 
           await supabaseAdmin
             .from("stripe_subscriptions")
             .update({
               status: subscription.status,
               current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
               current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
             })
             .eq("stripe_subscription_id", subscriptionId);
 
           logStep("Subscription period updated");
         }
         break;
       }
 
       case "invoice.payment_failed": {
         const invoice = event.data.object as Stripe.Invoice;
         const inv = invoice as unknown as { id: string; subscription?: string | { id: string } };
         if (inv.subscription) {
           logStep("Payment failed", { invoiceId: invoice.id });
 
           const subscriptionId = typeof inv.subscription === "string"
             ? inv.subscription
             : inv.subscription.id;
 
           await supabaseAdmin
             .from("stripe_subscriptions")
             .update({ status: "past_due" })
             .eq("stripe_subscription_id", subscriptionId);
 
           logStep("Subscription marked as past_due");
         }
         break;
       }
 
       default:
         logStep("Unhandled event type", { type: event.type });
     }
 
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: jsonHeaders,
      });
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     logStep("ERROR", { message: errorMessage });
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: jsonHeaders,
        status: 500,
      });
   }
 });