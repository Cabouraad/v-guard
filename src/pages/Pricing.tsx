import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Loader2, Settings, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiteNav, SiteFooter } from '@/components/marketing';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/subscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tierConfigs = [
  {
    key: 'standard' as SubscriptionTier,
    name: 'Standard',
    price: '$49',
    period: '/mo',
    description: 'For individual developers and small teams validating their applications.',
    features: [
      'Up to 5 scans/month',
      'URL-only + Authenticated scans',
      'Safe security analysis (read-only)',
      'Baseline performance + light load ramp',
      '30-day artifact retention',
      'Conservative concurrency cap; cooldown enforced',
    ],
    highlighted: false,
  },
  {
    key: 'production' as SubscriptionTier,
    name: 'Production',
    price: '$199',
    period: '/mo',
    description: 'For teams requiring deeper analysis on staging and production systems.',
    features: [
      'Up to 15 scans/month',
      'Authenticated scans (multi-user)',
      'Full security pipeline',
      'Load ramp + soak & recovery testing (staging or explicitly approved)',
      '180-day artifact retention',
      'Priority execution',
    ],
    highlighted: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { subscription, loading: subLoading, createCheckout, openPortal } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<SubscriptionTier | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const isTestUser = subscription.is_test_user;

  const handleSubscribe = async (tier: SubscriptionTier) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please sign in to subscribe');
        navigate('/auth');
        return;
      }

      setCheckingOut(tier);
      await createCheckout(tier);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      toast.error(message);
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);
      await openPortal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open portal';
      toast.error(message);
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest">PLANS</span>
          <h1 className="text-3xl md:text-4xl font-mono font-light tracking-tight leading-tight mt-3 mb-6">
            Pricing
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            Two tiers. No hidden fees. Heavy testing is gated and auditable.
          </p>
          
          {/* Current Plan Badge */}
          {subscription.subscribed && subscription.tier && (
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 border border-primary/30 bg-primary/10">
              {isTestUser && <FlaskConical className="w-3 h-3 text-primary" />}
              <span className="text-[10px] font-mono text-primary tracking-wider">
                CURRENT PLAN: {subscription.tier.toUpperCase()}
                {isTestUser && ' (INTERNAL)'}
              </span>
              {!isTestUser && subscription.subscription_end && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  • Renews {new Date(subscription.subscription_end).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tierConfigs.map((tier) => {
              const isCurrentPlan = subscription.subscribed && subscription.tier === tier.key;
              const isLoading = checkingOut === tier.key;
              
              return (
              <div
                key={tier.key}
                className={`border p-6 ${
                  isCurrentPlan
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : tier.highlighted
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-card/30'
                }`}
              >
                {isCurrentPlan && (
                  <div className="mb-4 -mt-2">
                    <span className="text-[9px] font-mono tracking-widest text-primary bg-primary/20 px-2 py-0.5">
                      {isTestUser ? 'YOUR PLAN (INTERNAL)' : 'YOUR PLAN'}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-sm font-mono tracking-wider mb-2">{tier.name.toUpperCase()}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono text-foreground">{tier.price}</span>
                    <span className="text-sm font-mono text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                </div>

                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        tier.highlighted ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {isTestUser ? (
                  // Test users see no billing actions
                  isCurrentPlan ? (
                    <div className="w-full py-2.5 text-center font-mono text-[11px] text-muted-foreground border border-border bg-muted/30">
                      MANAGED ENTITLEMENT
                    </div>
                  ) : (
                    <div className="w-full py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                      —
                    </div>
                  )
                ) : isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full font-mono text-[11px] rounded-sm h-10 border-primary/50 hover:bg-primary/10"
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                  >
                    {openingPortal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        OPENING PORTAL...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        MANAGE SUBSCRIPTION
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={tier.highlighted ? 'default' : 'outline'}
                    className={`w-full font-mono text-[11px] rounded-sm h-10 ${
                      tier.highlighted
                        ? 'bg-primary hover:bg-primary/90'
                        : 'border-border hover:bg-muted/30'
                    }`}
                    onClick={() => handleSubscribe(tier.key)}
                    disabled={isLoading || subLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AUTHORIZING...
                      </>
                    ) : (
                      <>
                        SUBSCRIBE
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              );
            })}
          </div>

           {/* Note */}
           <div className="mt-8 text-center space-y-2">
             <p className="text-[11px] font-mono text-muted-foreground">
               Heavy testing is gated and auditable.
             </p>
             <p className="text-[10px] font-mono text-muted-foreground/60">
               Beta pricing applies during the public beta period. Plan limits and safety guarantees apply as listed.
             </p>
           </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 px-6 border-t border-border/30 bg-card/20">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-mono tracking-wider mb-6">WHAT'S INCLUDED IN EVERY PLAN</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Evidence Artifacts', value: 'Yes' },
              { label: 'Audit Trail', value: 'Yes' },
              { label: 'Halt Controls', value: 'Yes' },
              { label: 'DO_NOT_TEST Routes', value: 'Yes' },
            ].map((item, i) => (
              <div key={i} className="p-4 border border-border/50 bg-background/50">
                <div className="text-sm font-mono text-foreground">{item.value}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
