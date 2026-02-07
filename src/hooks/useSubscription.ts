import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SubscriptionState,
  DEFAULT_SUBSCRIPTION_STATE,
  SubscriptionTier,
} from "@/lib/subscription";

/**
 * Maps raw API response to SubscriptionState.
 */
function mapResponseToState(data: Record<string, unknown>): SubscriptionState {
  return {
    subscribed: (data.subscribed as boolean) ?? false,
    tier: (data.tier as SubscriptionTier | null) ?? null,
    price_id: (data.price_id as string | null) ?? null,
    subscription_end: (data.subscription_end as string | null) ?? null,
    cancel_at_period_end: (data.cancel_at_period_end as boolean) ?? false,
    scan_limit: (data.scan_limit as number) ?? 0,
    scans_used: (data.scans_used as number) ?? 0,
    scans_remaining: (data.scans_remaining as number) ?? 0,
    period_reset_date: (data.period_reset_date as string | null) ?? null,
    allow_soak: (data.allow_soak as boolean) ?? false,
    allow_stress: (data.allow_stress as boolean) ?? false,
    priority_queue: (data.priority_queue as boolean) ?? false,
    retention_days: (data.retention_days as number) ?? 7,
    max_concurrency: (data.max_concurrency as number) ?? 1,
    is_test_user: (data.is_test_user as boolean) ?? false,
  };
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>(
    DEFAULT_SUBSCRIPTION_STATE
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication: track in-flight call with a monotonic counter.
  // Only the latest call is allowed to write state.
  const callIdRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if we've ever received a successful response this session
  const hasSucceededRef = useRef(false);

  const checkSubscription = useCallback(async () => {
    // Increment call ID — only the latest caller will write state
    const thisCallId = ++callIdRef.current;

    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        // No session = not logged in; only write if still latest call
        if (thisCallId === callIdRef.current) {
          setSubscription(DEFAULT_SUBSCRIPTION_STATE);
          setError(null);
          setLoading(false);
        }
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "check-subscription"
      );

      // Stale call — a newer one has started, discard this result
      if (thisCallId !== callIdRef.current) return;

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      // Success — update state
      hasSucceededRef.current = true;
      setError(null);
      setSubscription(mapResponseToState(data));
    } catch (err) {
      // Stale call — discard
      if (thisCallId !== callIdRef.current) return;

      const message = err instanceof Error ? err.message : "Unknown error";

      // If we've already received valid subscription data this session,
      // don't overwrite it with an error — just log and ignore.
      if (hasSucceededRef.current) {
        console.warn("[useSubscription] Transient error after prior success, ignoring:", message);
        return;
      }

      setError(message);
      console.error("[useSubscription] Error:", message);
    } finally {
      if (thisCallId === callIdRef.current) {
        setLoading(false);
      }
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

  // Check subscription on auth state changes — debounced via callIdRef
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          if (session) {
            checkSubscription();
          } else {
            hasSucceededRef.current = false;
            setSubscription(DEFAULT_SUBSCRIPTION_STATE);
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          hasSucceededRef.current = false;
          setSubscription(DEFAULT_SUBSCRIPTION_STATE);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkSubscription]);

  // Auto-retry when in error state — self-heal after 3 seconds
  useEffect(() => {
    if (error && !subscription.subscribed) {
      retryTimeoutRef.current = setTimeout(() => {
        console.log("[useSubscription] Auto-retrying after error...");
        checkSubscription();
      }, 3000);
      return () => {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      };
    }
  }, [error, subscription.subscribed, checkSubscription]);

  // Periodic refresh every 60 seconds (only when subscribed)
  useEffect(() => {
    if (!subscription.subscribed) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription, subscription.subscribed]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createCheckout,
    openPortal,
  };
}
