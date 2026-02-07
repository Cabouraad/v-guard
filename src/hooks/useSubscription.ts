import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SubscriptionState,
  DEFAULT_SUBSCRIPTION_STATE,
  SubscriptionTier,
} from "@/lib/subscription";

// Detect transient errors that are worth retrying
const isTransientError = (message: string): boolean => {
  const transientPatterns = [
    "Auth session missing",
    "Failed to fetch",
    "NetworkError",
    "TypeError: Load failed",
    "CORS",
    "500",
  ];
  return transientPatterns.some((p) =>
    message.toLowerCase().includes(p.toLowerCase())
  );
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>(
    DEFAULT_SUBSCRIPTION_STATE
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSubscription = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

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

      if (data && data.error) {
        if (
          typeof data.error === "string" &&
          data.error.includes("Auth session missing") &&
          retryCount < MAX_RETRIES
        ) {
          console.warn(
            `[useSubscription] Transient auth error, retrying (${retryCount + 1}/${MAX_RETRIES})...`
          );
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
          return checkSubscription(retryCount + 1);
        }
        throw new Error(data.error);
      }

      // Successfully got subscription data — clear any error and update state
      setError(null);
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

      // Retry on transient errors (500s, network issues)
      if (retryCount < MAX_RETRIES && isTransientError(message)) {
        console.warn(
          `[useSubscription] Transient error, retrying (${retryCount + 1}/${MAX_RETRIES})...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
        return checkSubscription(retryCount + 1);
      }

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

  // Check subscription on auth state changes only (not on mount directly)
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
            setSubscription(DEFAULT_SUBSCRIPTION_STATE);
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
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