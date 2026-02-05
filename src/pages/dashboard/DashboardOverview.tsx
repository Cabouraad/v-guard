 import { useState } from 'react';
 import { useEvidencePanel } from '@/components/evidence';
 import { RiskTimeline } from '@/components/dashboard/RiskTimeline';
 import { FindingsPanel } from '@/components/dashboard/FindingsPanel';
 import { InstrumentGauge } from '@/components/dashboard/InstrumentGauge';
 import { Shield, Activity, AlertTriangle, Clock } from 'lucide-react';
 
 export default function DashboardOverview() {
   const [selectedScanId, setSelectedScanId] = useState<string | null>('2');
   const { openPanel } = useEvidencePanel();
 
   const handleSelectFinding = (_findingId: string) => {
     // Panel is opened by FindingsPanel via context
   };
 
   return (
     <div className="h-screen flex flex-col">
       {/* Header bar */}
       <header className="flex items-center justify-between px-6 py-4 border-b border-border">
         <div className="flex items-center gap-4">
           <h1 className="font-mono text-lg text-foreground tracking-tight">RISK CONTROL</h1>
           <span className="text-xs font-mono text-muted-foreground">|</span>
          <span className="text-xs font-mono text-muted-foreground">3 TARGETS ACTIVE</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">SYSTEM NOMINAL</span>
         </div>
       </header>
 
       {/* Main content */}
       <div className="flex-1 flex overflow-hidden">
         {/* Primary content area */}
         <div className="flex-1 flex flex-col overflow-hidden">
           {/* Status gauges */}
           <section className="px-6 py-4 border-b border-border">
             <div className="flex items-center gap-8">
               <InstrumentGauge
                 label="Security Score"
                 value={72}
                 unit="pts"
                 max={100}
                 warningThreshold={70}
                 criticalThreshold={50}
                 size="md"
               />
               <InstrumentGauge
                 label="Reliability"
                 value={85}
                 unit="pts"
                 max={100}
                 warningThreshold={70}
                 criticalThreshold={50}
                 size="md"
               />
               <InstrumentGauge
                label="P95"
                 value={245}
                 unit="ms"
                 max={1000}
                 warningThreshold={300}
                 criticalThreshold={500}
                 size="md"
               />
               <InstrumentGauge
                label="Errors"
                 value={2.4}
                 unit="%"
                 max={100}
                 warningThreshold={5}
                 criticalThreshold={10}
                 size="md"
               />
               
               {/* Quick stats */}
               <div className="flex-1 flex items-center justify-end gap-6">
                 <div className="text-right">
                   <div className="text-2xl font-mono font-bold text-foreground">12</div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">RUNS</div>
                 </div>
                 <div className="text-right">
                   <div className="text-2xl font-mono font-bold text-severity-critical">1</div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">CRITICAL</div>
                 </div>
                 <div className="text-right">
                   <div className="text-2xl font-mono font-bold text-severity-high">4</div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">HIGH</div>
                 </div>
               </div>
             </div>
           </section>
 
           {/* Risk Timeline */}
           <section className="px-6 py-2 border-b border-border">
             <div className="flex items-center gap-3 mb-2">
               <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">SCAN LOG</span>
             </div>
             <RiskTimeline 
               selectedScanId={selectedScanId}
               onSelectScan={setSelectedScanId}
             />
           </section>
 
           {/* Findings list */}
           <section className="flex-1 overflow-hidden">
             <FindingsPanel onSelectFinding={handleSelectFinding} />
           </section>
         </div>
       </div>
     </div>
   );
 }