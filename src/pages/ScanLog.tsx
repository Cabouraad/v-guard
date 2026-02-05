import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Lock, Unlock } from 'lucide-react';
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="font-mono text-xl font-bold">SCAN LOG</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm">Recent Scan Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !scanRuns?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No scan runs yet. Create a project and run a scan to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {scanRuns.map((run) => (
                <Link
                  key={run.id}
                  to={`/dashboard/scan-log/${run.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {run.project?.name || 'Unknown Project'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {run.project?.environment}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {run.allow_advanced_tests ? (
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
                      <span>•</span>
                      <span>
                        {run.started_at
                          ? format(new Date(run.started_at), 'MMM d, yyyy HH:mm')
                          : 'Not started'}
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
        </CardContent>
      </Card>
    </div>
  );
}
