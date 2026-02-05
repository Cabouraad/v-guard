 import { useState, useEffect } from 'react';
 import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
 
 interface TranscriptStep {
   id: string;
   label: string;
   status: 'queued' | 'running' | 'completed';
   duration?: string;
 }
 
 const initialSteps: TranscriptStep[] = [
   { id: 'fingerprint', label: 'Fingerprint', status: 'queued' },
   { id: 'security', label: 'Security Safe Checks', status: 'queued' },
   { id: 'baseline', label: 'Performance Baseline', status: 'queued' },
   { id: 'ramp', label: 'Load Ramp', status: 'queued' },
   { id: 'report', label: 'Report Compile', status: 'queued' },
 ];
 
 export function ScanTranscript() {
   const [steps, setSteps] = useState<TranscriptStep[]>(initialSteps);
   const [currentStep, setCurrentStep] = useState(0);
 
   useEffect(() => {
     const interval = setInterval(() => {
       setSteps((prev) => {
         const newSteps = [...prev];
         
         // Complete current running step
         const runningIdx = newSteps.findIndex(s => s.status === 'running');
         if (runningIdx !== -1) {
           newSteps[runningIdx] = {
             ...newSteps[runningIdx],
             status: 'completed',
             duration: `${(Math.random() * 3 + 1).toFixed(1)}s`
           };
         }
         
         // Start next queued step
         const nextQueued = newSteps.findIndex(s => s.status === 'queued');
         if (nextQueued !== -1) {
           newSteps[nextQueued] = { ...newSteps[nextQueued], status: 'running' };
         }
         
         return newSteps;
       });
       
       setCurrentStep(prev => {
         if (prev >= initialSteps.length) {
           // Reset after completion
           setSteps(initialSteps);
           return 0;
         }
         return prev + 1;
       });
     }, 1800);
 
     // Start first step
     setTimeout(() => {
       setSteps(prev => {
         const newSteps = [...prev];
         newSteps[0] = { ...newSteps[0], status: 'running' };
         return newSteps;
       });
     }, 500);
 
     return () => clearInterval(interval);
   }, []);
 
   const getStatusIcon = (status: TranscriptStep['status']) => {
     switch (status) {
       case 'completed':
         return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
       case 'running':
         return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
       default:
         return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />;
     }
   };
 
   const getStatusLabel = (status: TranscriptStep['status']) => {
     switch (status) {
       case 'completed':
         return 'DONE';
       case 'running':
         return 'EXEC';
       default:
         return 'WAIT';
     }
   };
 
   return (
     <div className="border border-border/50 bg-card/20 rounded-sm overflow-hidden">
       {/* Terminal header */}
       <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/40">
         <div className="w-2 h-2 rounded-full bg-destructive/60" />
         <div className="w-2 h-2 rounded-full bg-status-warning/60" />
         <div className="w-2 h-2 rounded-full bg-status-success/60" />
         <span className="text-[10px] font-mono text-muted-foreground ml-2">scan_transcript.log</span>
       </div>
       
       {/* Content */}
       <div className="p-4 font-mono text-xs space-y-1">
         <div className="text-muted-foreground mb-3">
           $ vibe-sec analyze --target https://app.example.com
         </div>
         
         <div className="border border-border/30 bg-background/50">
           <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
             <span className="text-[10px] text-muted-foreground tracking-wider">EXECUTION SEQUENCE</span>
           </div>
           
           <div className="divide-y divide-border/20">
             {steps.map((step, index) => (
               <div 
                 key={step.id}
                 className={`px-3 py-2 flex items-center justify-between transition-colors ${
                   step.status === 'running' ? 'bg-primary/5' : ''
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] text-muted-foreground w-4">{String(index + 1).padStart(2, '0')}</span>
                   {getStatusIcon(step.status)}
                   <span className={step.status === 'queued' ? 'text-muted-foreground' : 'text-foreground'}>
                     {step.label}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-4">
                   {step.duration && (
                     <span className="text-[10px] text-muted-foreground">{step.duration}</span>
                   )}
                   <span className={`text-[10px] tracking-wider ${
                     step.status === 'completed' ? 'text-primary' :
                     step.status === 'running' ? 'text-status-warning' :
                     'text-muted-foreground/50'
                   }`}>
                     {getStatusLabel(step.status)}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
         
         <div className="pt-3 text-muted-foreground">
           <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse mr-1" />
           awaiting sequence completion...
         </div>
       </div>
     </div>
   );
 }