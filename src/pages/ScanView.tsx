import { useEffect, useState, useCallback } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { Header } from '@/components/layout/Header';
 import { ScanProgressTimeline, createTimelineSteps, TimelineStep } from '@/components/scan/ScanProgressTimeline';
import { HaltScanDialog } from '@/components/scan/HaltScanDialog';
 import { Button } from '@/components/ui/button';
 import { StatusBadge } from '@/components/ui/status-badge';
 import { ScoreRing } from '@/components/ui/score-ring';
 import { 
   Pause, 
  OctagonX, 
   RefreshCw,
   FileText,
   Clock,
   Terminal
 } from 'lucide-react';
import type { ScanTask, ScanStatus } from '@/types/database';
  import { ScanSafetyBadge, useSafetyLock } from '@/components/safety';
import { useRunWindow, WindowStatusBadge } from '@/components/scheduling';
import { useHaltScan } from '@/hooks/useHaltScan';
  import { cn } from '@/lib/utils';
 
 // Simulated scan tasks for demo with timestamps
 const createInitialTasks = (): ScanTask[] => {
   const now = new Date();
   return [
     { id: '1', scan_run_id: 'demo', task_type: 'fingerprint', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '2', scan_run_id: 'demo', task_type: 'tls_check', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '3', scan_run_id: 'demo', task_type: 'security_headers', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '4', scan_run_id: 'demo', task_type: 'cors_check', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '5', scan_run_id: 'demo', task_type: 'cookie_check', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '6', scan_run_id: 'demo', task_type: 'exposure_check', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '7', scan_run_id: 'demo', task_type: 'perf_baseline', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '8', scan_run_id: 'demo', task_type: 'load_ramp_light', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
     { id: '9', scan_run_id: 'demo', task_type: 'report_compile', status: 'pending', retries: 0, max_retries: 3, attempt_count: 0, max_attempts: 3, output: {}, created_at: now.toISOString() },
   ];
 };
 
 export default function ScanView() {
   const { scanId } = useParams();
   const [tasks, setTasks] = useState<ScanTask[]>(createInitialTasks);
   const [scanStatus, setScanStatus] = useState<ScanStatus>('running');
   const [elapsedTime, setElapsedTime] = useState(0);
   const [scores, setScores] = useState({ security: 0, reliability: 0 });
  const { halt: haltScanBackend, isHalting } = useHaltScan();
  const { state: safetyState, getAuditString } = useSafetyLock();
  const { window: runWindow, isWithinWindow, formatNextWindowOpen } = useRunWindow();
  const [haltDialogOpen, setHaltDialogOpen] = useState(false);
  const [haltInfo, setHaltInfo] = useState<{
    reason?: string;
    haltedAt?: string;
    haltedBy?: string;
    stageWhenHalted?: string;
  } | null>(null);

  // Check if scan should be queued due to window
  const isQueuedForWindow = runWindow.enabled && !isWithinWindow() && scanStatus === 'running';

  // Get current running stage
  const getCurrentStage = useCallback(() => {
    const runningTask = tasks.find(t => t.status === 'running');
    if (runningTask) {
      const stageMap: Record<string, string> = {
        'fingerprint': 'Fingerprint',
        'tls_check': 'Security Safe Checks',
        'security_headers': 'Security Safe Checks',
        'cors_check': 'Security Safe Checks',
        'cookie_check': 'Security Safe Checks',
        'exposure_check': 'Security Safe Checks',
        'perf_baseline': 'Performance Baseline',
        'load_ramp_light': 'Load Ramp',
        'load_ramp_full': 'Load Ramp',
        'soak_test': 'Soak Test',
        'stress_test': 'Stress & Recovery',
        'report_compile': 'Report Compile',
      };
      return stageMap[runningTask.task_type] || runningTask.task_type;
    }
    return 'Initializing';
  }, [tasks]);

  // Handle halt scan
  const handleHaltScan = useCallback(async (reason: string) => {
    const currentStage = getCurrentStage();
    
    // Call backend halt endpoint
    const audit = await haltScanBackend(scanId || 'demo', reason);
    
    if (!audit) return; // Hook already showed error toast
    
    setHaltInfo({
      reason: audit.reason,
      haltedAt: audit.halted_at,
      haltedBy: audit.halted_by,
      stageWhenHalted: audit.stage_when_halted,
    });
    
    // Update local task state to reflect halt
    setTasks(prev => prev.map(task => {
      if (task.status === 'running') {
        return {
          ...task,
          status: 'canceled' as const,
          ended_at: audit.halted_at,
          error_message: 'Halted by operator',
          error_detail: `Operator initiated safety halt. Reason: ${audit.reason}. Stage: ${audit.stage_when_halted}.`,
        };
      } else if (task.status === 'pending' || task.status === 'queued') {
        return {
          ...task,
          status: 'canceled' as const,
          error_message: 'Halted by operator',
          error_detail: `Scan halted before this task could run. Reason: ${audit.reason}`,
        };
      }
      return task;
    }));
    
    setScanStatus('canceled');
    setHaltDialogOpen(false);
  }, [getCurrentStage, haltScanBackend, scanId]);
 
   // Simulate scan progress with timestamps
   useEffect(() => {
     if (scanStatus !== 'running') return;
 
     const interval = setInterval(() => {
       setTasks(prev => {
         const currentIndex = prev.findIndex(t => t.status === 'running');
         const nextPendingIndex = prev.findIndex(t => t.status === 'pending');
         const now = new Date().toISOString();
 
         if (currentIndex === -1 && nextPendingIndex === -1) {
           setScanStatus('completed');
           setScores({ security: 72, reliability: 85 });
           return prev;
         }
 
         return prev.map((task, i) => {
           if (i === currentIndex) {
             return { ...task, status: 'completed' as const, ended_at: now };
           }
           if (i === nextPendingIndex && currentIndex === -1) {
             return { ...task, status: 'running' as const, started_at: now };
           }
           return task;
         });
       });
     }, 1800);
 
     return () => clearInterval(interval);
   }, [scanStatus]);
 
   // Start first task
   useEffect(() => {
     const timeout = setTimeout(() => {
       setTasks(prev => prev.map((t, i) => 
         i === 0 ? { ...t, status: 'running' as const, started_at: new Date().toISOString() } : t
       ));
     }, 500);
     return () => clearTimeout(timeout);
   }, []);
 
   // Elapsed time counter
   useEffect(() => {
     if (scanStatus !== 'running') return;
     const interval = setInterval(() => {
       setElapsedTime(prev => prev + 1);
     }, 1000);
     return () => clearInterval(interval);
   }, [scanStatus]);
 
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };
 
   // Create timeline steps from tasks
  const timelineSteps: TimelineStep[] = createTimelineSteps(
     tasks.map(t => ({
       id: t.id,
       task_type: t.task_type,
       status: t.status,
       started_at: t.started_at,
       ended_at: t.ended_at,
       error_message: t.error_message,
       error_detail: t.error_detail,
     })),
     safetyState.isLocked,
     safetyState.enabledModules
  ).map(step => {
    // Add halt info to canceled steps
    if (haltInfo && (step.status === 'canceled' || (scanStatus === 'canceled' && step.status === 'pending'))) {
      return {
        ...step,
        status: 'canceled' as const,
        skippedReason: 'operator_halt' as const,
        haltedBy: haltInfo.haltedBy,
        haltedAt: haltInfo.haltedAt,
      };
    }
    return step;
  });
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header 
         title="Security Scan" 
         subtitle="my-saas-app • https://my-saas-app.lovable.app"
       />
 
       <div className="flex flex-1 overflow-hidden">
         {/* Main Content */}
         <div className={cn(
           "flex-1 overflow-auto transition-all duration-300"
         )}>
           <div className="p-6 space-y-6">
             {/* Status Bar */}
             <div className="flex items-center justify-between py-3 px-4 bg-card/50 border border-border rounded-sm">
               <div className="flex items-center gap-4">
                 <ScanSafetyBadge 
                   isLocked={safetyState.isLocked}
                   approvedForProduction={safetyState.approvedForProduction}
                   enabledModules={safetyState.enabledModules}
                   size="md"
                 />
                {isQueuedForWindow ? (
                  <WindowStatusBadge />
                ) : (
                  <StatusBadge status={scanStatus} />
                )}
                 <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                   <Clock className="w-3.5 h-3.5" />
                  {isQueuedForWindow ? (
                    <span className="text-severity-medium">{formatNextWindowOpen()}</span>
                  ) : (
                    formatTime(elapsedTime)
                  )}
                 </div>
               </div>
 
               <div className="flex items-center gap-2">
                {scanStatus === 'running' && !isQueuedForWindow && (
                   <>
                     <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px]">
                       <Pause className="w-3 h-3" />
                       PAUSE
                     </Button>
                     <Button 
                       variant="destructive" 
                       size="sm" 
                       className="gap-1.5 font-mono text-[10px] bg-severity-critical hover:bg-severity-critical/90"
                       onClick={() => setHaltDialogOpen(true)}
                       disabled={isHalting}
                     >
                       <OctagonX className="w-3 h-3" />
                       {isHalting ? 'HALTING…' : 'HALT (SAFETY)'}
                      </Button>
                   </>
                 )}
                {isQueuedForWindow && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px]">
                      <RefreshCw className="w-3 h-3" />
                      FORCE START
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1.5 font-mono text-[10px] text-severity-critical"
                      onClick={() => setHaltDialogOpen(true)}
                    >
                      <OctagonX className="w-3 h-3" />
                      CANCEL
                    </Button>
                  </div>
                )}
              {scanStatus === 'canceled' && haltInfo && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-severity-critical/10 border border-severity-critical/20 rounded-sm">
                    <OctagonX className="w-3.5 h-3.5 text-severity-critical" />
                    <span className="text-[10px] font-mono text-severity-critical">
                      HALTED BY OPERATOR
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px]">
                    <RefreshCw className="w-3 h-3" />
                    RESCAN
                  </Button>
                </>
              )}
                 {scanStatus === 'completed' && (
                   <>
                     <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px]">
                       <RefreshCw className="w-3 h-3" />
                       RESCAN
                     </Button>
                     <Link to="/reports/demo">
                       <Button size="sm" className="gap-1.5 font-mono text-[10px]">
                         <FileText className="w-3 h-3" />
                         VIEW REPORT
                       </Button>
                     </Link>
                   </>
                 )}
               </div>
             </div>
 
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               {/* Timeline */}
               <div className="lg:col-span-3">
                 <div className="mb-4 flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-primary" />
                   <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                     Scan Progress Timeline
                   </h2>
                 </div>
                 <ScanProgressTimeline
                   steps={timelineSteps}
                 />
               </div>
 
               {/* Scores */}
               <div className="space-y-4">
                 <div className="p-4 border border-border rounded-sm bg-card/30">
                   <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                     Security Score
                   </h3>
                   <div className="flex justify-center">
                     {scanStatus === 'completed' ? (
                       <ScoreRing score={scores.security} size="lg" />
                     ) : (
                       <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center">
                         <span className="text-muted-foreground text-[10px] font-mono">PENDING</span>
                       </div>
                     )}
                   </div>
                 </div>
 
                 <div className="p-4 border border-border rounded-sm bg-card/30">
                   <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                     Reliability Score
                   </h3>
                   <div className="flex justify-center">
                     {scanStatus === 'completed' ? (
                       <ScoreRing score={scores.reliability} size="lg" />
                     ) : (
                       <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center">
                         <span className="text-muted-foreground text-[10px] font-mono">PENDING</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
 
       </div>

      {/* Halt Scan Dialog */}
      <HaltScanDialog
        open={haltDialogOpen}
        onOpenChange={setHaltDialogOpen}
        onConfirm={handleHaltScan}
        currentStage={getCurrentStage()}
        scanId={scanId || 'demo'}
      />
     </div>
   );
 }