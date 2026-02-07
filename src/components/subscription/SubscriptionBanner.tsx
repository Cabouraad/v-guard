import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Zap, 
  ArrowUpRight, 
  Settings2,
  AlertCircle,
  FlaskConical,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import type { SubscriptionState } from '@/lib/subscription';

interface SubscriptionBannerProps {
  subscription: SubscriptionState;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUpgrade: () => void;
  onManageBilling: () => void;
}

export function SubscriptionBanner({ 
  subscription, 
  loading, 
  error,
  onRetry,
  onUpgrade, 
  onManageBilling 
}: SubscriptionBannerProps) {
  if (loading) {
    return (
      <div className="p-4 border border-border bg-muted/20 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // If check failed with an error, show a retry state instead of "NO ACTIVE SUBSCRIPTION"
  if (!subscription.subscribed && error) {
    return (
      <div className="p-4 border border-severity-medium/30 bg-severity-medium/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-severity-medium mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-severity-medium">
              CONNECTION ERROR
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Could not verify subscription status. Please retry.
            </p>
          </div>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="gap-1">
              <RefreshCw className="w-3 h-3" />
              RETRY
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!subscription.subscribed) {
    // Test users should never see this, but guard anyway
    if (subscription.is_test_user) return null;

    return (
      <div className="p-4 border border-severity-medium/30 bg-severity-medium/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-severity-medium mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-severity-medium">
              NO ACTIVE SUBSCRIPTION
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               An active subscription is required to authorize scans and generate reports.
             </p>
          </div>
           <Button size="sm" onClick={onUpgrade} className="gap-1">
             <Zap className="w-3 h-3" />
             ACTIVATE
           </Button>
        </div>
      </div>
    );
  }

  const usagePercent = subscription.scan_limit > 0 
    ? (subscription.scans_used / subscription.scan_limit) * 100 
    : 0;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = subscription.scans_remaining === 0;
  const isProduction = subscription.tier === 'production';
  const isTestUser = subscription.is_test_user;

  return (
    <div className="p-4 border border-border bg-background space-y-4">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTestUser ? (
            <FlaskConical className="w-4 h-4 text-primary" />
          ) : (
            <Crown className={`w-4 h-4 ${isProduction ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <span className="text-xs font-mono uppercase tracking-wider">
            {subscription.tier?.toUpperCase()} PLAN
          </span>
          {isTestUser && (
            <Badge variant="outline" className="text-[10px] border-primary text-primary">
              INTERNAL
            </Badge>
          )}
          {isProduction && !isTestUser && (
            <Badge variant="outline" className="text-[10px] border-primary text-primary">
              FULL ACCESS
            </Badge>
          )}
        </div>
        {/* Hide billing controls for test users */}
        {!isTestUser && (
          <div className="flex items-center gap-2">
            {!isProduction && (
              <Button variant="outline" size="sm" onClick={onUpgrade} className="gap-1 text-xs font-mono">
                 <ArrowUpRight className="w-3 h-3" />
                 UPGRADE TIER
               </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onManageBilling} className="gap-1 text-xs font-mono">
               <Settings2 className="w-3 h-3" />
               BILLING
             </Button>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">SCANS THIS PERIOD</span>
          <span className={`font-mono ${isAtLimit && !isTestUser ? 'text-severity-critical' : isNearLimit && !isTestUser ? 'text-severity-medium' : 'text-foreground'}`}>
            {subscription.scans_used} / {isTestUser ? '∞' : subscription.scan_limit}
          </span>
        </div>
        {!isTestUser && (
          <Progress 
            value={usagePercent} 
            className={`h-1.5 ${isAtLimit ? '[&>div]:bg-severity-critical' : isNearLimit ? '[&>div]:bg-severity-medium' : ''}`}
          />
        )}
        {!isTestUser && subscription.period_reset_date && (
          <p className="text-[10px] text-muted-foreground">
            Resets {format(new Date(subscription.period_reset_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Tier Features */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={subscription.allow_soak ? "default" : "secondary"} className="text-[10px]">
          {subscription.allow_soak ? '✓' : '✗'} Soak Tests
        </Badge>
        <Badge variant={subscription.allow_stress ? "default" : "secondary"} className="text-[10px]">
          {subscription.allow_stress ? '✓' : '✗'} Stress Tests
        </Badge>
        <Badge variant={subscription.priority_queue ? "default" : "secondary"} className="text-[10px]">
          {subscription.priority_queue ? '✓' : '✗'} Priority Queue
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {subscription.retention_days}d Retention
        </Badge>
      </div>

      {/* Warnings - never show limit warnings for test users */}
      {isAtLimit && !isTestUser && (
        <div className="p-2 bg-severity-critical/10 border border-severity-critical/30 text-xs">
          <span className="font-mono text-severity-critical">LIMIT REACHED</span>
           <span className="text-muted-foreground ml-2">
             Scan authorization blocked until period reset or tier upgrade.
           </span>
        </div>
      )}
    </div>
  );
}
