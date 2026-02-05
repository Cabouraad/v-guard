 import { Shield, AlertTriangle, Gauge, Lock, FileCheck } from 'lucide-react';
 import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
 } from '@/components/ui/sheet';
 import { Separator } from '@/components/ui/separator';
 
 interface WhyLockedPanelProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function WhyLockedPanel({ open, onOpenChange }: WhyLockedPanelProps) {
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
         <SheetHeader>
           <SheetTitle className="flex items-center gap-2 font-mono text-sm">
             <Shield className="w-5 h-5 text-primary" />
             SAFETY LOCK EXPLAINED
           </SheetTitle>
           <SheetDescription className="font-mono text-xs">
             Understanding the guardrails that protect your targets
           </SheetDescription>
         </SheetHeader>
 
         <div className="mt-6 space-y-6">
           {/* Default Behavior */}
           <div className="space-y-3">
             <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
               Default Behavior (READ-ONLY)
             </h3>
             <div className="p-4 rounded-sm border border-status-success/30 bg-status-success/5">
               <div className="flex items-start gap-3">
                 <Lock className="w-5 h-5 text-status-success mt-0.5" />
                 <div>
                   <p className="font-mono text-xs text-status-success mb-2">
                     SAFE MODE ACTIVE
                   </p>
                   <ul className="text-xs text-muted-foreground space-y-1.5">
                     <li>• Read-only external probes only</li>
                     <li>• No authentication credential testing</li>
                     <li>• No mutation or state changes</li>
                     <li>• Light load sampling (max 5 RPS)</li>
                     <li>• DO_NOT_TEST routes always honored</li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>
 
           <Separator />
 
           {/* Circuit Breaker */}
           <div className="space-y-3">
             <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
               Automatic Circuit Breaker
             </h3>
             <div className="p-4 rounded-sm border border-border bg-card">
               <div className="flex items-start gap-3">
                 <Gauge className="w-5 h-5 text-primary mt-0.5" />
                 <div>
                   <p className="font-mono text-xs mb-2">
                     SCAN HALTS AUTOMATICALLY IF:
                   </p>
                   <ul className="text-xs text-muted-foreground space-y-1.5">
                     <li>• Error rate exceeds 25%</li>
                     <li>• Timeout rate exceeds 15%</li>
                     <li>• 10 consecutive failures occur</li>
                     <li>• P95 latency exceeds 30 seconds</li>
                   </ul>
                   <p className="text-xs text-muted-foreground mt-3">
                     This ensures the scanner remains non-destructive and responsive 
                     to target degradation.
                   </p>
                 </div>
               </div>
             </div>
           </div>
 
           <Separator />
 
           {/* What ADVANCED Unlocks */}
           <div className="space-y-3">
             <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
               Advanced Mode Unlocks
             </h3>
             <div className="p-4 rounded-sm border border-severity-medium/30 bg-severity-medium/5">
               <div className="flex items-start gap-3">
                 <AlertTriangle className="w-5 h-5 text-severity-medium mt-0.5" />
                 <div>
                   <p className="font-mono text-xs text-severity-medium mb-2">
                     REQUIRES EXPLICIT AUTHORIZATION
                   </p>
                   <ul className="text-xs text-muted-foreground space-y-1.5">
                     <li>• <span className="text-foreground">Soak Testing</span> — Extended duration load</li>
                     <li>• <span className="text-foreground">Stress Testing</span> — Push beyond limits</li>
                     <li>• <span className="text-foreground">Auth Probing</span> — Session/credential tests</li>
                     <li>• <span className="text-foreground">Injection Tests</span> — SQL/XSS/Command injection</li>
                   </ul>
                   <p className="text-xs text-muted-foreground mt-3">
                     Each module must be individually enabled. Production environments 
                     require additional confirmation.
                   </p>
                 </div>
               </div>
             </div>
           </div>
 
           <Separator />
 
           {/* Audit Trail */}
           <div className="space-y-3">
             <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
               Audit Trail
             </h3>
             <div className="p-4 rounded-sm border border-border bg-card">
               <div className="flex items-start gap-3">
                 <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                 <div>
                   <p className="font-mono text-xs mb-2">
                     EVERY SCAN RECORDS:
                   </p>
                   <ul className="text-xs text-muted-foreground space-y-1.5">
                     <li>• Lock state at scan start</li>
                     <li>• Which modules were authorized</li>
                     <li>• Production approval status</li>
                     <li>• Environment classification</li>
                   </ul>
                   <p className="text-xs text-muted-foreground mt-3">
                     Reports include: "Safety Lock: READ-ONLY" or 
                     "Safety Lock: ADVANCED (SOAK, STRESS, PROD-APPROVED)"
                   </p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
 }