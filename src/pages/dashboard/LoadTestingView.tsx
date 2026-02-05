 import { useState } from 'react';
 import { LoadTestingChart } from '@/components/dashboard/LoadTestingChart';
 import { InstrumentGauge } from '@/components/dashboard/InstrumentGauge';
 import { Gauge, Play, Square, RotateCcw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 
 interface LoadMetric {
   label: string;
   value: string;
   status: 'normal' | 'warning' | 'critical';
 }
 
 const currentMetrics: LoadMetric[] = [
   { label: 'Peak RPS', value: '284', status: 'normal' },
   { label: 'Failure Point', value: 'c90', status: 'warning' },
   { label: 'Recovery Time', value: '45s', status: 'normal' },
   { label: 'Max Error Rate', value: '35%', status: 'critical' },
 ];
 
 const testPhases = [
   { id: 'baseline', label: 'Baseline', status: 'complete' },
   { id: 'ramp', label: 'Ramp', status: 'complete' },
   { id: 'stress', label: 'Stress', status: 'complete' },
   { id: 'recovery', label: 'Recovery', status: 'complete' },
 ];
 
 export default function LoadTestingView() {
   const [isRunning, setIsRunning] = useState(false);
 
   return (
     <div className="h-screen flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-6 py-4 border-b border-border">
         <div className="flex items-center gap-4">
           <Gauge className="w-5 h-5 text-primary" />
          <h1 className="font-mono text-lg text-foreground tracking-tight">LOAD PROBE</h1>
         </div>
         <div className="flex items-center gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={() => setIsRunning(!isRunning)}
             className="font-mono text-xs gap-2"
           >
             {isRunning ? (
               <>
                 <Square className="w-3 h-3" />
                HALT
               </>
             ) : (
               <>
                 <Play className="w-3 h-3" />
                EXECUTE
               </>
             )}
           </Button>
           <Button variant="ghost" size="sm" className="font-mono text-xs gap-2">
             <RotateCcw className="w-3 h-3" />
             RESET
           </Button>
         </div>
       </header>
 
       {/* Phase indicators */}
       <div className="px-6 py-3 border-b border-border">
         <div className="flex items-center gap-6">
           {testPhases.map((phase, index) => (
             <div key={phase.id} className="flex items-center gap-2">
               <span className={cn(
                 "w-2 h-2 rounded-sm",
                 phase.status === 'complete' ? "bg-status-success" :
                 phase.status === 'running' ? "bg-primary animate-pulse" :
                 "bg-muted"
               )} />
               <span className={cn(
                 "text-xs font-mono uppercase tracking-wider",
                 phase.status === 'complete' ? "text-foreground" : "text-muted-foreground"
               )}>
                 {phase.label}
               </span>
               {index < testPhases.length - 1 && (
                 <span className="text-muted-foreground/30 ml-4">—</span>
               )}
             </div>
           ))}
         </div>
       </div>
 
       {/* Main content */}
       <div className="flex-1 flex overflow-hidden">
         {/* Chart area */}
         <div className="flex-1 flex flex-col p-6">
           {/* Metrics bar */}
           <div className="flex items-center gap-8 mb-6">
             {currentMetrics.map(metric => (
               <div key={metric.label} className="text-center">
                 <div className={cn(
                   "text-xl font-mono font-bold",
                   metric.status === 'critical' ? "text-severity-critical" :
                   metric.status === 'warning' ? "text-severity-medium" :
                   "text-foreground"
                 )}>
                   {metric.value}
                 </div>
                 <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                   {metric.label}
                 </div>
               </div>
             ))}
           </div>
 
           {/* Chart */}
           <div className="flex-1 min-h-0">
             <LoadTestingChart />
           </div>
 
           {/* Legend */}
           <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
             <div className="flex items-center gap-2">
               <span className="w-3 h-0.5 bg-primary" />
              <span className="text-xs font-mono text-muted-foreground">THROUGHPUT</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3 h-0.5 bg-severity-medium" style={{ borderStyle: 'dashed' }} />
              <span className="text-xs font-mono text-muted-foreground">LATENCY P95</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-severity-critical/30 border border-severity-critical/50" />
              <span className="text-xs font-mono text-muted-foreground">FAILURE ZONE</span>
             </div>
           </div>
         </div>
 
         {/* Right panel - gauges */}
         <div className="w-64 border-l border-border p-6 flex flex-col gap-8">
           <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
            LIVE STATE
           </div>
           <InstrumentGauge
            label="RPS"
             value={156}
             unit="rps"
             max={300}
             warningThreshold={200}
             criticalThreshold={250}
           />
           <InstrumentGauge
            label="P95"
             value={187}
             unit="ms"
             max={500}
             warningThreshold={200}
             criticalThreshold={350}
           />
           <InstrumentGauge
            label="ERRORS"
             value={2}
             unit="%"
             max={50}
             warningThreshold={10}
             criticalThreshold={25}
           />
         </div>
       </div>
     </div>
   );
 }