import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/30 bg-primary/5',
    success: 'border-status-success/30 bg-status-success/5',
    warning: 'border-severity-medium/30 bg-severity-medium/5',
    danger: 'border-severity-critical/30 bg-severity-critical/5',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-muted',
    primary: 'text-primary bg-primary/20',
    success: 'text-status-success bg-status-success/20',
    warning: 'text-severity-medium bg-severity-medium/20',
    danger: 'text-severity-critical bg-severity-critical/20',
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl border bg-card transition-all hover:shadow-lg",
        variantStyles[variant],
        className
      )}
    >
      {Icon && (
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-lg",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-status-success" : "text-severity-critical"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
