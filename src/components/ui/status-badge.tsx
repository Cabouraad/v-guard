import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, Check, X, Clock, Pause } from 'lucide-react';
import type { ScanStatus, TaskStatus } from '@/types/database';

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      status: {
        pending: "status-pending",
        running: "status-running",
        paused: "status-pending",
        completed: "status-success",
        failed: "status-error",
        cancelled: "status-error",
        skipped: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: ScanStatus | TaskStatus;
  className?: string;
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  running: Loader2,
  paused: Pause,
  completed: Check,
  failed: X,
  cancelled: X,
  skipped: Clock,
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const Icon = statusIcons[status];

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      <Icon className={cn(
        "w-3 h-3",
        status === 'running' && "animate-spin"
      )} />
      {statusLabels[status]}
    </span>
  );
}
