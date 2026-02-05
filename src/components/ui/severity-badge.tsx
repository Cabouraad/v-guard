import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { SeverityLevel } from '@/types/database';

const severityBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono font-medium border transition-colors uppercase tracking-wider",
  {
    variants: {
      severity: {
        critical: "severity-critical",
        high: "severity-high",
        medium: "severity-medium",
        low: "severity-low",
        info: "severity-info",
        not_tested: "bg-muted text-muted-foreground border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      }
    },
    defaultVariants: {
      severity: "info",
      size: "default",
    },
  }
);

interface SeverityBadgeProps extends VariantProps<typeof severityBadgeVariants> {
  severity: SeverityLevel;
  showIcon?: boolean;
  className?: string;
}

export function SeverityBadge({ severity, size, showIcon = true, className }: SeverityBadgeProps) {
  const labels: Record<SeverityLevel, string> = {
    critical: 'CRIT',
    high: 'HIGH',
    medium: 'MED',
    low: 'LOW',
    info: 'INFO',
    not_tested: 'UNTESTED',
  };

  return (
    <span className={cn(severityBadgeVariants({ severity, size }), className)}>
      {showIcon && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-sm",
          severity === 'critical' && "bg-severity-critical animate-pulse",
          severity === 'high' && "bg-severity-high",
          severity === 'medium' && "bg-severity-medium",
          severity === 'low' && "bg-severity-low",
          severity === 'info' && "bg-severity-info",
          severity === 'not_tested' && "bg-muted-foreground",
        )} />
      )}
      {labels[severity]}
    </span>
  );
}