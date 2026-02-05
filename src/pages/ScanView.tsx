 import { useEffect, useState } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { Header } from '@/components/layout/Header';
 import { ScanProgressTimeline, createTimelineSteps, TimelineStep } from '@/components/scan/ScanProgressTimeline';
 import { Button } from '@/components/ui/button';
 import { StatusBadge } from '@/components/ui/status-badge';
 import { ScoreRing } from '@/components/ui/score-ring';
 import { 
   Pause, 
   Square, 
   RefreshCw,
   FileText,
   Clock,
   Terminal
 } from 'lucide-react';
 import type { ScanTask, ScanStatus } from '@/types/database';
 import { ScanSafetyBadge, useSafetyLock } from '@/components/safety';
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
   const { state: safetyState, getAuditString } = useSafetyLock();
 
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
   const timelineSteps = createTimelineSteps(
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
   );
 
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
                 <StatusBadge status={scanStatus} />
                 <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                   <Clock className="w-3.5 h-3.5" />
                   {formatTime(elapsedTime)}
                 </div>
               </div>
 
               <div className="flex items-center gap-2">
                 {scanStatus === 'running' && (
                   <>
                     <Button variant="outline" size="sm" className="gap-1.5 font-mono text-[10px]">
                       <Pause className="w-3 h-3" />
                       PAUSE
                     </Button>
                     <Button variant="destructive" size="sm" className="gap-1.5 font-mono text-[10px]">
                       <Square className="w-3 h-3" />
                       HALT
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
     </div>
   );
 }