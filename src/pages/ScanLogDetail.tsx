import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScanProgress } from '@/components/scan/ScanProgress';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle, FileText, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import type { ScanRun, ScanTask, Project } from '@/types/database';

export default function ScanLogDetail() {
  const { scanRunId } = useParams<{ scanRunId: string }>();

  const { data: scanRun, isLoading: runLoading } = useQuery({
    queryKey: ['scan-run', scanRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_runs')
        .select(`*, project:projects(*)`)
        .eq('id', scanRunId!)
        .single();

      if (error) throw error;
      return data as ScanRun & { project: Project };
    },
    enabled: !!scanRunId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['scan-tasks', scanRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_tasks')
        .select('*')
        .eq('scan_run_id', scanRunId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ScanTask[];
    },
    enabled: !!scanRunId,
  });

  if (runLoading || tasksLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!scanRun) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Scan run not found.</p>
        <Link to="/scan-log" className="text-primary hover:underline text-sm">
          ← Back to Scan Log
        </Link>
      </div>
    );
  }

  const failedTasks = tasks?.filter((t) => t.status === 'failed') || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/scan-log">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-mono text-xl font-bold">
            {scanRun.project?.name || 'Scan Run'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{scanRun.project?.environment}</span>
            <span className="flex items-center gap-1">
              {scanRun.allow_advanced_tests ? (
                <>
                  <Unlock className="w-3 h-3 text-amber-500" />
                  ADVANCED
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-primary" />
                  READ-ONLY
                </>
              )}
            </span>
            {scanRun.started_at && (
              <span>
                Started {format(new Date(scanRun.started_at), 'MMM d, yyyy HH:mm')}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={scanRun.status} />
      </div>

      {/* Error Summary */}
      {scanRun.error_summary && (
        <Card className="border-severity-critical/30 bg-severity-critical/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-sm flex items-center gap-2 text-severity-critical">
              <AlertTriangle className="w-4 h-4" />
              Error Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{scanRun.error_summary}</p>
            {scanRun.error_message && (
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {scanRun.error_message}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm">Task Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks?.length ? (
            <ScanProgress tasks={tasks} />
          ) : (
            <p className="text-muted-foreground text-sm">No tasks recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Failed Tasks Detail */}
      {failedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm text-severity-critical">
              Failed Tasks ({failedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {failedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded border border-severity-critical/20 bg-severity-critical/5"
              >
                <p className="font-medium text-sm">{task.task_type}</p>
                {task.error_message && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.error_message}
                  </p>
                )}
                {task.error_detail && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                    {task.error_detail}
                  </pre>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Link to Evidence */}
      <Link to={`/evidence?scanRunId=${scanRun.id}`}>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          View Evidence & Findings
        </Button>
      </Link>
    </div>
  );
}
