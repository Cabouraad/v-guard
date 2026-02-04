import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import type { ScanTask, TaskProgress } from '@/types/database';
import { CheckCircle2, Circle, Loader2, XCircle, SkipForward } from 'lucide-react';

interface ScanProgressProps {
  tasks: ScanTask[];
  className?: string;
}

const taskLabels: Record<string, string> = {
  fingerprint: 'Fingerprinting',
  security_headers: 'Security Headers',
  tls_check: 'TLS/SSL Analysis',
  cors_check: 'CORS Configuration',
  cookie_check: 'Cookie Security',
  endpoint_discovery: 'Endpoint Discovery',
  injection_safe: 'Safe Injection Tests',
  graphql_introspection: 'GraphQL Introspection',
  exposure_check: 'Exposure Detection',
  perf_baseline: 'Performance Baseline',
  load_ramp_light: 'Light Load Test',
  load_ramp_full: 'Full Load Test',
  soak_test: 'Soak Test',
  stress_test: 'Stress Test',
};

const taskIcons = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
};

export function ScanProgress({ tasks, className }: ScanProgressProps) {
  const progress: TaskProgress = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  const progressPercent = tasks.length > 0 
    ? ((progress.completed + progress.failed) / progress.total) * 100 
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-mono font-medium">
            {progress.completed + progress.failed}/{progress.total} tasks
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = taskIcons[task.status];
          const label = taskLabels[task.task_type] || task.task_type;

          return (
            <div 
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                task.status === 'running' && "bg-primary/5 border-primary/30",
                task.status === 'completed' && "bg-status-success/5 border-status-success/20",
                task.status === 'failed' && "bg-severity-critical/5 border-severity-critical/20",
                task.status === 'pending' && "bg-muted/50 border-border",
                task.status === 'skipped' && "bg-muted/30 border-border opacity-60",
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                task.status === 'running' && "text-primary animate-spin",
                task.status === 'completed' && "text-status-success",
                task.status === 'failed' && "text-severity-critical",
                task.status === 'pending' && "text-muted-foreground",
                task.status === 'skipped' && "text-muted-foreground",
              )} />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                {task.error_message && (
                  <p className="text-xs text-severity-critical mt-0.5 truncate">
                    {task.error_message}
                  </p>
                )}
              </div>

              <StatusBadge status={task.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
