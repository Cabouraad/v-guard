import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Activity, Lock, Unlock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { ScanRun, Project } from '@/types/database';

export default function ScanLog() {
  const { data: scanRuns, isLoading } = useQuery({
    queryKey: ['scan-runs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_runs')
        .select(`
          *,
          project:projects(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as (ScanRun & { project: Project })[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Scan Log" 
        subtitle="Chronological record of all scan executions"
      />

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">
              {isLoading ? '—' : `${scanRuns?.length ?? 0} RUNS RECORDED`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !scanRuns?.length ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-sm border border-dashed border-border flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h2 className="font-mono text-sm text-foreground mb-2">
                NO SCAN RUNS RECORDED
              </h2>
              <p className="font-mono text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                Scan execution history will appear here once a probe has been queued against 
                an authorized target. Each run logs status, duration, and safety mode.
              </p>
              <Link to="/dashboard/targets">
                <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                  <Plus className="w-4 h-4" />
                  AUTHORIZE A TARGET
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scanRuns.map((run) => (
                <Link
                  key={run.id}
                  to={`/dashboard/scan-log/${run.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium truncate text-foreground">
                        {run.project?.name || 'Unknown Target'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {run.project?.environment}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {run.allow_advanced_tests ? (
                          <>
                            <Unlock className="w-3 h-3 text-severity-medium" />
                            ADVANCED
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-primary" />
                            READ-ONLY
                          </>
                        )}
                      </span>
                      <span className="text-border">•</span>
                      <span>
                        {run.started_at
                          ? format(new Date(run.started_at), 'MMM d, yyyy HH:mm')
                          : 'PENDING'}
                      </span>
                      {run.ended_at && (
                        <>
                          <span>→</span>
                          <span>{format(new Date(run.ended_at), 'HH:mm')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={run.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
