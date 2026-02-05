 import { useState } from 'react';
 import { useEvidencePanel } from '@/components/evidence';
 import { 
   Circle, 
   Loader2, 
   CheckCircle2, 
   XCircle, 
   SkipForward,
   Clock,
   ChevronRight,
   FileText,
   ShieldOff
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Button } from '@/components/ui/button';
 import type { TaskStatus } from '@/types/database';
 
 export interface TimelineStep {
   id: string;
   moduleKey: string;
   label: string;
   description: string;
   status: TaskStatus;
   startedAt?: string;
   endedAt?: string;
   errorMessage?: string;
   errorDetail?: string;
   isAdvanced?: boolean;
  skippedReason?: 'safety_lock' | 'not_configured' | 'guardrail' | 'dependency_failed' | 'operator_halt' | 'window_closed';
  haltedBy?: string;
  haltedAt?: string;
  queuedUntil?: string;
 }
 
 interface ScanProgressTimelineProps {
   steps: TimelineStep[];
   onStepClick?: (step: TimelineStep) => void;
   onViewLogs?: (step: TimelineStep) => void;
   className?: string;
 }
 
 const statusIcons: Record<TaskStatus, typeof Circle> = {
   pending: Circle,
   queued: Circle,
   running: Loader2,
   completed: CheckCircle2,
   failed: XCircle,
   skipped: SkipForward,
   canceled: XCircle,
 };
 
 const statusColors: Record<TaskStatus, string> = {
   pending: 'text-muted-foreground',
   queued: 'text-muted-foreground',
   running: 'text-primary',
   completed: 'text-status-success',
   failed: 'text-severity-critical',
   skipped: 'text-muted-foreground',
   canceled: 'text-muted-foreground',
 };
 
 const statusLineColors: Record<TaskStatus, string> = {
   pending: 'bg-border',
   queued: 'bg-border',
   running: 'bg-primary/50',
   completed: 'bg-status-success/50',
   failed: 'bg-severity-critical/50',
   skipped: 'bg-border',
   canceled: 'bg-border',
 };
 
 function formatTime(isoString?: string): string {
   if (!isoString) return '—';
   const date = new Date(isoString);
   return date.toLocaleTimeString('en-US', { 
     hour: '2-digit', 
     minute: '2-digit', 
     second: '2-digit',
     hour12: false 
   });
 }
 
 function formatDuration(start?: string, end?: string): string {
   if (!start) return '';
   const startDate = new Date(start);
   const endDate = end ? new Date(end) : new Date();
   const diffMs = endDate.getTime() - startDate.getTime();
   const seconds = Math.floor(diffMs / 1000);
   if (seconds < 60) return `${seconds}s`;
   const minutes = Math.floor(seconds / 60);
   const remainingSeconds = seconds % 60;
   return `${minutes}m ${remainingSeconds}s`;
 }
 
 function getSkipLabel(reason?: string): string {
   switch (reason) {
     case 'safety_lock':
       return 'Skipped (Safety Lock)';
     case 'not_configured':
       return 'Skipped (Not Configured)';
     case 'guardrail':
       return 'Skipped (Guardrail)';
     case 'dependency_failed':
       return 'Skipped (Dependency Failed)';
    case 'operator_halt':
      return 'Halted by Operator';
    case 'window_closed':
      return 'Queued (Window Closed)';
     default:
       return 'Skipped';
   }
 }
 
 export function ScanProgressTimeline({ 
   steps, 
   onStepClick, 
   onViewLogs,
   className 
 }: ScanProgressTimelineProps) {
   const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
   const { openPanel } = useEvidencePanel();
 
   const handleStepClick = (step: TimelineStep) => {
     setSelectedStepId(step.id === selectedStepId ? null : step.id);
     // Open evidence panel filtered to this module
     openPanel({
       tab: 'logs',
       filter: { moduleKey: step.moduleKey, taskType: step.moduleKey }
     });
     onStepClick?.(step);
   };
 
   return (
     <div className={cn("relative", className)}>
       {steps.map((step, index) => {
         const Icon = statusIcons[step.status];
         const isLast = index === steps.length - 1;
         const isSelected = selectedStepId === step.id;
         const isRunning = step.status === 'running';
         const isFailed = step.status === 'failed';
         const isSkipped = step.status === 'skipped';
         const isCompleted = step.status === 'completed';
 
         return (
           <div key={step.id} className="relative">
             {/* Timeline connector line */}
             {!isLast && (
               <div 
                 className={cn(
                   "absolute left-[11px] top-[28px] w-[2px] h-[calc(100%-4px)]",
                   statusLineColors[step.status]
                 )}
               />
             )}
 
             {/* Step content */}
             <button
               onClick={() => handleStepClick(step)}
               className={cn(
                 "w-full text-left flex items-start gap-3 py-3 px-2 -mx-2 rounded-sm transition-all",
                 "hover:bg-muted/30",
                 isSelected && "bg-muted/50",
                 isRunning && "bg-primary/5",
                 isFailed && "bg-severity-critical/5"
               )}
             >
               {/* Status icon */}
               <div className="relative flex-shrink-0 mt-0.5">
                 <Icon 
                   className={cn(
                     "w-6 h-6",
                     statusColors[step.status],
                     isRunning && "animate-spin"
                   )} 
                 />
                 {isRunning && (
                   <div className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                 )}
               </div>
 
               {/* Step details */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2">
                   <h4 className={cn(
                     "font-mono text-xs font-medium uppercase tracking-wider",
                     isSkipped && "text-muted-foreground",
                     isFailed && "text-severity-critical",
                     isRunning && "text-primary"
                   )}>
                     {step.label}
                   </h4>
 
                   {/* Timing info */}
                   <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                     {step.startedAt && (
                       <span className="flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {formatTime(step.startedAt)}
                       </span>
                     )}
                     {(step.startedAt && (step.endedAt || isRunning)) && (
                       <span className="text-foreground/70">
                         ({formatDuration(step.startedAt, step.endedAt)})
                       </span>
                     )}
                   </div>
                 </div>
 
                 {/* Description */}
                 <p className={cn(
                   "text-xs text-muted-foreground mt-0.5",
                   isSkipped && "opacity-60"
                 )}>
                   {step.description}
                 </p>
 
                 {/* Skip reason */}
                  {(isSkipped || step.status === 'canceled') && (
                   <div className="flex items-center gap-1.5 mt-1.5">
                      {step.skippedReason === 'safety_lock' ? (
                        <ShieldOff className="w-3 h-3 text-severity-medium" />
                      ) : step.skippedReason === 'operator_halt' ? (
                        <XCircle className="w-3 h-3 text-severity-medium" />
                     ) : step.skippedReason === 'window_closed' ? (
                       <Clock className="w-3 h-3 text-severity-medium" />
                      ) : null}
                     <span className="text-[10px] font-mono text-severity-medium">
                       {getSkipLabel(step.skippedReason)}
                     </span>
                      {step.haltedBy && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          — {step.haltedBy}
                        </span>
                      )}
                     {step.queuedUntil && (
                       <span className="text-[10px] font-mono text-muted-foreground">
                         — Opens {step.queuedUntil}
                       </span>
                     )}
                   </div>
                 )}
 
                 {/* Error message */}
                 {isFailed && step.errorMessage && (
                   <div className="mt-2 p-2 rounded-sm bg-severity-critical/10 border border-severity-critical/20">
                     <p className="text-[10px] font-mono text-severity-critical leading-relaxed">
                       {step.errorMessage}
                     </p>
                     {step.errorDetail && (
                       <p className="text-[10px] font-mono text-muted-foreground mt-1 leading-relaxed">
                         {step.errorDetail}
                       </p>
                     )}
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-6 px-2 mt-2 text-[10px] font-mono text-severity-critical hover:text-severity-critical hover:bg-severity-critical/10"
                       onClick={(e) => {
                         e.stopPropagation();
                         onViewLogs?.(step);
                       }}
                     >
                       <FileText className="w-3 h-3 mr-1" />
                       VIEW LOGS
                     </Button>
                   </div>
                 )}
 
                 {/* Advanced module indicator */}
                 {step.isAdvanced && !isSkipped && (
                   <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-mono uppercase tracking-wider text-severity-medium">
                     ● ADVANCED MODULE
                   </span>
                 )}
               </div>
 
               {/* Expand indicator */}
               <ChevronRight 
                 className={cn(
                   "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 mt-1",
                   isSelected && "rotate-90"
                 )} 
               />
             </button>
           </div>
         );
       })}
     </div>
   );
 }
 
 // Helper to create timeline steps from scan tasks and safety lock state
 export function createTimelineSteps(
   tasks: Array<{
     id: string;
     task_type: string;
     status: TaskStatus;
     started_at?: string;
     ended_at?: string;
     error_message?: string;
     error_detail?: string;
   }>,
   safetyLocked: boolean = true,
   enabledModules: { soak?: boolean; stress?: boolean } = {}
 ): TimelineStep[] {
   const moduleDefinitions: Array<{
     key: string;
     label: string;
     description: string;
     taskTypes: string[];
     isAdvanced?: boolean;
     requiresModule?: 'soak' | 'stress';
   }> = [
     {
       key: 'fingerprint',
       label: 'Fingerprint',
       description: 'DNS validation, TLS cert, tech stack detection',
       taskTypes: ['fingerprint'],
     },
     {
       key: 'security_safe',
       label: 'Security Safe Checks',
       description: 'Headers, CORS, cookies, exposure detection',
       taskTypes: ['security_headers', 'tls_check', 'cors_check', 'cookie_check', 'exposure_check'],
     },
     {
       key: 'perf_baseline',
       label: 'Performance Baseline',
       description: 'Single-request latency sampling, TTFB measurement',
       taskTypes: ['perf_baseline'],
     },
     {
       key: 'load_ramp',
       label: 'Load Ramp',
       description: safetyLocked ? 'Light load test (5 RPS max)' : 'Progressive load ramping',
       taskTypes: ['load_ramp_light', 'load_ramp_full'],
     },
     {
       key: 'soak',
       label: 'Soak Test',
       description: 'Extended duration load for memory/resource leaks',
       taskTypes: ['soak_test'],
       isAdvanced: true,
       requiresModule: 'soak',
     },
     {
       key: 'stress',
       label: 'Stress & Recovery',
       description: 'Push beyond limits, observe recovery behavior',
       taskTypes: ['stress_test'],
       isAdvanced: true,
       requiresModule: 'stress',
     },
     {
       key: 'report',
       label: 'Report Compile',
       description: 'Aggregate findings, generate scores, build report',
       taskTypes: ['report_compile'],
     },
   ];
 
   return moduleDefinitions.map((def) => {
     const matchingTasks = tasks.filter(t => def.taskTypes.includes(t.task_type));
     
     // Determine aggregate status
     let status: TaskStatus = 'pending';
     let startedAt: string | undefined;
     let endedAt: string | undefined;
     let errorMessage: string | undefined;
     let errorDetail: string | undefined;
     let skippedReason: TimelineStep['skippedReason'];
 
     if (matchingTasks.length > 0) {
       // Check if any task is running
       const runningTask = matchingTasks.find(t => t.status === 'running');
       if (runningTask) {
         status = 'running';
         startedAt = runningTask.started_at;
       }
       // Check if any task failed
       else if (matchingTasks.some(t => t.status === 'failed')) {
         const failedTask = matchingTasks.find(t => t.status === 'failed')!;
         status = 'failed';
         startedAt = failedTask.started_at;
         endedAt = failedTask.ended_at;
         errorMessage = failedTask.error_message;
         errorDetail = failedTask.error_detail;
       }
       // Check if all tasks completed
       else if (matchingTasks.every(t => t.status === 'completed')) {
         status = 'completed';
         startedAt = matchingTasks[0]?.started_at;
         endedAt = matchingTasks[matchingTasks.length - 1]?.ended_at;
       }
       // Check if all tasks skipped
       else if (matchingTasks.every(t => t.status === 'skipped')) {
         status = 'skipped';
         skippedReason = 'guardrail';
       }
       // Some pending/queued
       else {
         const completedCount = matchingTasks.filter(t => t.status === 'completed').length;
         if (completedCount > 0) {
           status = 'running'; // partially complete
           startedAt = matchingTasks.find(t => t.started_at)?.started_at;
         } else {
           status = 'queued';
         }
       }
     } else {
       // No matching tasks found
       if (def.isAdvanced) {
         status = 'skipped';
         if (safetyLocked) {
           skippedReason = 'safety_lock';
         } else if (def.requiresModule && !enabledModules[def.requiresModule]) {
           skippedReason = 'not_configured';
         }
       } else {
         status = 'pending';
       }
     }
 
     return {
       id: def.key,
       moduleKey: def.key,
       label: def.label,
       description: def.description,
       status,
       startedAt,
       endedAt,
       errorMessage,
       errorDetail,
       isAdvanced: def.isAdvanced,
       skippedReason,
     };
   });
 }