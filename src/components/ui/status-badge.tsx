import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, Check, X, Clock, Pause } from 'lucide-react';
import type { ScanStatus, TaskStatus } from '@/types/database';

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono font-medium uppercase tracking-wider",
  {
    variants: {
      status: {
        pending: "status-pending",
        queued: "status-pending",
        running: "status-running",
        paused: "status-pending",
        completed: "status-success",
        failed: "status-error",
        cancelled: "status-error",
        canceled: "status-error",
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
  queued: Clock,
  running: Loader2,
  paused: Pause,
  completed: Check,
  failed: X,
  cancelled: X,
  canceled: X,
  skipped: Clock,
  queued_window: Clock,
};

const statusLabels: Record<string, string> = {
  pending: 'QUEUED',
  queued: 'QUEUED',
  running: 'RUNNING',
  paused: 'PAUSED',
  completed: 'COMPLETE',
  failed: 'FAILED',
  cancelled: 'HALTED',
  canceled: 'HALTED',
  skipped: 'SKIPPED',
  queued_window: 'QUEUED (WINDOW)',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const Icon = statusIcons[status] || Clock;

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      <Icon className={cn(
        "w-3 h-3",
        status === 'running' && "animate-spin"
      )} />
      {statusLabels[status] || status}
    </span>
  );
}