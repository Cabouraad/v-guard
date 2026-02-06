import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ScanRun, ScanFinding, Project, ScanArtifact } from '@/types/database';
import { useOnboarding } from '@/hooks/useOnboarding';

function redactSecrets(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[=:]\s*["']?[A-Za-z0-9\-_.]+["']?/gi, 'api_key=[REDACTED]')
    .replace(/password[=:]\s*["']?[^\s"']+["']?/gi, 'password=[REDACTED]')
    .replace(/secret[=:]\s*["']?[A-Za-z0-9\-_.]+["']?/gi, 'secret=[REDACTED]')
    .replace(/Authorization:\s*[^\n]+/gi, 'Authorization: [REDACTED]');
}

export default function Evidence() {
  const { scanRunId } = useParams<{ scanRunId?: string }>();
  const navigate = useNavigate();
  const [selectedFinding, setSelectedFinding] = useState<ScanFinding | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const { completeStep } = useOnboarding();

  // Mark "Review Findings" step when visiting with a selected scan
  useEffect(() => {
    if (scanRunId) {
      completeStep('step_review_findings');
    }
  }, [scanRunId, completeStep]);

  // Fetch recent scan runs for selection
  const { data: scanRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['evidence-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_runs')
        .select(`*, project:projects(*)`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as (ScanRun & { project: Project })[];
    },
  });

  // Fetch findings for selected scan run
  const { data: findings, isLoading: findingsLoading } = useQuery({
    queryKey: ['evidence-findings', scanRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_findings')
        .select('*')
        .eq('scan_run_id', scanRunId!)
        .order('severity', { ascending: true });

      if (error) throw error;
      return data as ScanFinding[];
    },
    enabled: !!scanRunId,
  });

  // Fetch artifacts for selected scan run
  const { data: artifacts } = useQuery({
    queryKey: ['evidence-artifacts', scanRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_artifacts')
        .select('*')
        .eq('scan_run_id', scanRunId!);

      if (error) throw error;
      return data as ScanArtifact[];
    },
    enabled: !!scanRunId,
  });

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectScanRun = (id: string) => {
    navigate(`/dashboard/evidence/${id}`);
    setSelectedFinding(null);
  };

  const clearSelection = () => {
    navigate('/dashboard/evidence');
    setSelectedFinding(null);
  };

  const selectedRun = scanRuns?.find((r) => r.id === scanRunId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            {scanRunId && (
              <Button variant="ghost" size="icon" onClick={clearSelection}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="font-mono text-xl font-bold">EVIDENCE</h1>
          </div>

          {!scanRunId ? (
            <>
              {runsLoading ? (
                <div className="space-y-3 pt-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !scanRuns?.length ? (
                /* Empty State — no runs at all */
                <div className="flex flex-col items-center justify-center pt-24 text-center">
                  <div className="w-16 h-16 rounded-sm border border-dashed border-border flex items-center justify-center mb-6">
                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h2 className="font-mono text-sm text-foreground mb-2">
                    NO EVIDENCE AVAILABLE
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                    Evidence artifacts, findings, and redacted request logs will populate here 
                    after a scan probe completes against an authorized target.
                  </p>
                  <Link to="/dashboard/targets">
                    <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                      AUTHORIZE A TARGET
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Scan Run Selection */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      SELECT SCAN RUN TO INSPECT
                    </span>
                  </div>
                  <div className="divide-y divide-border border border-border rounded-sm">
                    {scanRuns.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => selectScanRun(run.id)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium truncate text-foreground">
                            {run.project?.name || 'Unknown Target'}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {run.started_at
                              ? format(new Date(run.started_at), 'MMM d, yyyy HH:mm')
                              : 'PENDING'}
                          </p>
                        </div>
                        <StatusBadge status={run.status} />
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Run Header */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedRun?.project?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedRun?.started_at &&
                          format(new Date(selectedRun.started_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedRun?.status || 'pending'} />
                      <Link to={`/dashboard/scan-log/${scanRunId}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Timeline
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Findings List */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-sm">
                    Findings ({findings?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {findingsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !findings?.length ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      No findings for this scan run.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {findings.map((finding) => {
                        const isExpanded = expandedFindings.has(finding.id);
                        return (
                          <Collapsible key={finding.id} open={isExpanded}>
                            <div
                              className={cn(
                                'border rounded-lg overflow-hidden',
                                finding.severity === 'critical' && 'border-l-4 border-l-severity-critical',
                                finding.severity === 'high' && 'border-l-4 border-l-severity-high',
                                finding.severity === 'medium' && 'border-l-4 border-l-severity-medium',
                                finding.severity === 'low' && 'border-l-4 border-l-severity-low',
                                finding.severity === 'info' && 'border-l-4 border-l-severity-info'
                              )}
                            >
                              <CollapsibleTrigger
                                onClick={() => toggleFinding(finding.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{finding.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {finding.category} • {finding.endpoint || 'N/A'}
                                  </p>
                                </div>
                                <SeverityBadge severity={finding.severity} />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFinding(finding);
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Details
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="px-3 pb-3 pt-0 space-y-2 border-t">
                                  <p className="text-sm mt-2">{finding.description}</p>
                                  {finding.evidence_redacted && (
                                    <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                      <pre>{redactSecrets(typeof finding.evidence_redacted === 'string' ? finding.evidence_redacted : JSON.stringify(finding.evidence_redacted, null, 2))}</pre>
                                    </div>
                                  )}
                                  {finding.fix_recommendation && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Recommendation:
                                      </p>
                                      <p className="text-sm">{finding.fix_recommendation}</p>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Evidence Panel (Sheet) */}
      <Sheet open={!!selectedFinding} onOpenChange={(open) => !open && setSelectedFinding(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm">
              {selectedFinding?.title}
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="evidence" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
              <TabsContent value="evidence" className="space-y-4">
                {selectedFinding && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Severity</p>
                      <SeverityBadge severity={selectedFinding.severity} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                      <p className="text-sm">{selectedFinding.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{selectedFinding.description}</p>
                    </div>
                    {selectedFinding.endpoint && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Endpoint</p>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {selectedFinding.endpoint}
                        </code>
                      </div>
                    )}
                    {selectedFinding.evidence_redacted && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Evidence (Redacted)
                        </p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {redactSecrets(typeof selectedFinding.evidence_redacted === 'string' ? selectedFinding.evidence_redacted : JSON.stringify(selectedFinding.evidence_redacted, null, 2))}
                        </pre>
                      </div>
                    )}
                    {selectedFinding.repro_steps?.length && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Reproduction Steps
                        </p>
                        <ol className="text-sm list-decimal list-inside space-y-1">
                          {selectedFinding.repro_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {selectedFinding.fix_recommendation && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Fix Recommendation
                        </p>
                        <p className="text-sm">{selectedFinding.fix_recommendation}</p>
                      </div>
                    )}
                    {selectedFinding.lovable_fix_prompt && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Lovable Fix Prompt
                        </p>
                        <pre className="text-xs bg-primary/10 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {selectedFinding.lovable_fix_prompt}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="artifacts" className="space-y-4">
                {artifacts?.length ? (
                  artifacts.map((artifact) => (
                    <div key={artifact.id} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{artifact.artifact_type}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {artifact.storage_path}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No artifacts available.</p>
                )}
              </TabsContent>
              <TabsContent value="logs" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Logs are not yet implemented for this view.
                </p>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
