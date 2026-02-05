import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScanProgressTimeline, createTimelineSteps } from '@/components/scan/ScanProgressTimeline';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle, FileText, Lock, Unlock, Globe, ExternalLink } from 'lucide-react';
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
        <Link to="/dashboard/scan-log" className="text-primary hover:underline text-sm">
          ← Back to Scan Log
        </Link>
      </div>
    );
  }

  // Create timeline steps from tasks
  const safetyLocked = !scanRun.allow_advanced_tests;
  const config = scanRun.config as { enable_soak?: boolean; enable_stress?: boolean } | null;
  const timelineSteps = createTimelineSteps(
    tasks || [],
    safetyLocked,
    { soak: config?.enable_soak, stress: config?.enable_stress }
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/scan-log">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-mono text-xl font-bold">
            {scanRun.project?.name || 'Scan Run'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {scanRun.project?.environment}
            </span>
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

      {/* Target Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-mono text-sm">{scanRun.project?.base_url}</p>
                <p className="text-xs text-muted-foreground">
                  Mode: {scanRun.mode}
                </p>
              </div>
            </div>
            {scanRun.project?.base_url && (
              <a
                href={scanRun.project.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open Target
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm">Execution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineSteps.length ? (
            <ScanProgressTimeline 
              steps={timelineSteps}
              onViewLogs={(step) => {
                // Navigate to evidence with filter
                window.location.href = `/dashboard/evidence/${scanRun.id}?task=${step.moduleKey}`;
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No tasks recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Scores (if completed) */}
      {scanRun.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm">Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Security
                </p>
                <p className="text-3xl font-mono font-bold text-primary">
                  {scanRun.security_score ?? '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Reliability
                </p>
                <p className="text-3xl font-mono font-bold text-primary">
                  {scanRun.reliability_score ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Evidence */}
      <Link to={`/dashboard/evidence/${scanRun.id}`}>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          View Evidence & Findings
        </Button>
      </Link>
    </div>
  );
}
