 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import {
   SubscriptionState,
   DEFAULT_SUBSCRIPTION_STATE,
   SubscriptionTier,
 } from "@/lib/subscription";
 
 export function useSubscription() {
   const [subscription, setSubscription] = useState<SubscriptionState>(
     DEFAULT_SUBSCRIPTION_STATE
   );
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const checkSubscription = useCallback(async () => {
     try {
       setLoading(true);
       setError(null);
 
       const { data: session } = await supabase.auth.getSession();
       if (!session.session) {
         setSubscription(DEFAULT_SUBSCRIPTION_STATE);
         return;
       }
 
       const { data, error: fnError } = await supabase.functions.invoke(
         "check-subscription"
       );
 
       if (fnError) {
         throw new Error(fnError.message);
       }
 
       if (data.error) {
         throw new Error(data.error);
       }
 
setSubscription({
  subscribed: data.subscribed ?? false,
  tier: data.tier as SubscriptionTier | null,
  price_id: data.price_id ?? null,
  subscription_end: data.subscription_end ?? null,
  cancel_at_period_end: data.cancel_at_period_end ?? false,
  scan_limit: data.scan_limit ?? 0,
  scans_used: data.scans_used ?? 0,
  scans_remaining: data.scans_remaining ?? 0,
  period_reset_date: data.period_reset_date ?? null,
  allow_soak: data.allow_soak ?? false,
  allow_stress: data.allow_stress ?? false,
  priority_queue: data.priority_queue ?? false,
  retention_days: data.retention_days ?? 7,
  max_concurrency: data.max_concurrency ?? 1,
  is_test_user: data.is_test_user ?? false,
});
     } catch (err) {
       const message = err instanceof Error ? err.message : "Unknown error";
       setError(message);
       console.error("[useSubscription] Error:", message);
     } finally {
       setLoading(false);
     }
   }, []);
 
   const createCheckout = useCallback(async (tier: SubscriptionTier) => {
     try {
       const { data, error: fnError } = await supabase.functions.invoke(
         "stripe-checkout",
         { body: { tier } }
       );
 
       if (fnError) throw new Error(fnError.message);
       if (data.error) throw new Error(data.error);
 
       if (data.url) {
         window.open(data.url, "_blank");
       }
     } catch (err) {
       const message = err instanceof Error ? err.message : "Unknown error";
       console.error("[createCheckout] Error:", message);
       throw err;
     }
   }, []);
 
   const openPortal = useCallback(async () => {
     try {
       const { data, error: fnError } = await supabase.functions.invoke(
         "stripe-portal"
       );
 
       if (fnError) throw new Error(fnError.message);
       if (data.error) throw new Error(data.error);
 
       if (data.url) {
         window.open(data.url, "_blank");
       }
     } catch (err) {
       const message = err instanceof Error ? err.message : "Unknown error";
       console.error("[openPortal] Error:", message);
       throw err;
     }
   }, []);
 
   // Check subscription on mount and auth changes
   useEffect(() => {
     checkSubscription();
 
     const { data: authListener } = supabase.auth.onAuthStateChange(() => {
       checkSubscription();
     });
 
     return () => {
       authListener.subscription.unsubscribe();
     };
   }, [checkSubscription]);
 
   // Periodic refresh every 60 seconds
   useEffect(() => {
     const interval = setInterval(checkSubscription, 60000);
     return () => clearInterval(interval);
   }, [checkSubscription]);
 
   return {
     subscription,
     loading,
     error,
     checkSubscription,
     createCheckout,
     openPortal,
   };
 }