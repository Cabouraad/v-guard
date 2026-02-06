 // Stripe subscription tier configuration
 export const SUBSCRIPTION_TIERS = {
   standard: {
     tier: "standard",
     price_id: "price_1SxHva1B5M2OuX4nze4AU7Up",
     product_id: "prod_Tv8BKO9Mk1X1A1",
     price: 4900,
     name: "Standard",
     scan_limit: 5,
     allow_soak: false,
     allow_stress: false,
     priority_queue: false,
     retention_days: 30,
     max_concurrency: 2,
   },
   production: {
     tier: "production",
     price_id: "price_1SxHvm1B5M2OuX4nxghY7dP7",
     product_id: "prod_Tv8C1jkuSoAFUc",
     price: 19900,
     name: "Production",
     scan_limit: 15,
     allow_soak: true,
     allow_stress: true,
     priority_queue: true,
     retention_days: 180,
     max_concurrency: 5,
   },
 } as const;
 
 export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
 
export interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier | null;
  price_id: string | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  scan_limit: number;
  scans_used: number;
  scans_remaining: number;
  period_reset_date: string | null;
  allow_soak: boolean;
  allow_stress: boolean;
  priority_queue: boolean;
  retention_days: number;
  max_concurrency: number;
  is_test_user: boolean;
}
 
export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
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
  is_test_user: false,
};