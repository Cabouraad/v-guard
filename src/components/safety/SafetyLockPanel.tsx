 import { useState } from 'react';
 import { Shield, AlertTriangle, Lock } from 'lucide-react';
 import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
 } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Separator } from '@/components/ui/separator';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { useSafetyLock, AdvancedModules } from './SafetyLockContext';
 import type { EnvironmentType } from '@/types/database';
 
 interface SafetyLockPanelProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function SafetyLockPanel({ open, onOpenChange }: SafetyLockPanelProps) {
   const { unlock } = useSafetyLock();
   
   const [environment, setEnvironment] = useState<EnvironmentType | ''>('');
   const [riskAcknowledged, setRiskAcknowledged] = useState(false);
   const [approvedForProduction, setApprovedForProduction] = useState(false);
   const [modules, setModules] = useState<AdvancedModules>({
     soak: false,
     stress: false,
     authProbing: false,
     injectionTests: false,
   });
 
   const isProd = environment === 'production' || environment === 'prod';
   const hasSelectedModule = Object.values(modules).some(Boolean);
   const canUnlock = environment && riskAcknowledged && hasSelectedModule && (!isProd || approvedForProduction);
 
   const handleUnlock = () => {
     if (!environment) return;
     
     unlock({
       environment: environment as EnvironmentType,
       allowAdvancedTests: true,
       approvedForProduction: isProd && approvedForProduction,
       enabledModules: modules,
       riskAcknowledged,
     });
     
     // Reset form
     setEnvironment('');
     setRiskAcknowledged(false);
     setApprovedForProduction(false);
     setModules({ soak: false, stress: false, authProbing: false, injectionTests: false });
     onOpenChange(false);
   };
 
   const handleCancel = () => {
     setEnvironment('');
     setRiskAcknowledged(false);
     setApprovedForProduction(false);
     setModules({ soak: false, stress: false, authProbing: false, injectionTests: false });
     onOpenChange(false);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
         <SheetHeader>
           <SheetTitle className="flex items-center gap-2 font-mono text-sm">
             <Shield className="w-5 h-5 text-severity-medium" />
             AUTHORIZE ADVANCED TESTING
           </SheetTitle>
           <SheetDescription className="font-mono text-xs">
             Advanced modules perform destructive or high-load operations. 
             Explicit authorization required.
           </SheetDescription>
         </SheetHeader>
 
         <div className="mt-6 space-y-6">
           {/* Environment Selection */}
           <div className="space-y-3">
             <Label className="font-mono text-xs uppercase tracking-wider">
               Target Environment
             </Label>
             <Select value={environment} onValueChange={(val) => setEnvironment(val as EnvironmentType)}>
               <SelectTrigger className="font-mono text-xs">
                 <SelectValue placeholder="Select environment class" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="development">
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-status-success" />
                     DEV — Full access permitted
                   </div>
                 </SelectItem>
                 <SelectItem value="staging">
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-severity-medium" />
                     STAGING — Standard restrictions
                   </div>
                 </SelectItem>
                 <SelectItem value="production">
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-severity-critical" />
                     PROD — Requires explicit approval
                   </div>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <Separator />
 
           {/* Module Selection */}
           <div className="space-y-3">
             <Label className="font-mono text-xs uppercase tracking-wider">
               Authorized Modules
             </Label>
             <div className="space-y-3">
               {[
                 { key: 'soak', label: 'SOAK TESTING', desc: 'Extended duration load testing' },
                 { key: 'stress', label: 'STRESS TESTING', desc: 'Push beyond normal limits' },
                 { key: 'authProbing', label: 'AUTH PROBING', desc: 'Session and credential testing' },
                 { key: 'injectionTests', label: 'INJECTION TESTS', desc: 'SQL/XSS/Command injection' },
               ].map((module) => (
                 <div 
                   key={module.key}
                   className="flex items-start gap-3 p-3 rounded-sm border border-border hover:border-primary/30 transition-colors"
                 >
                   <Checkbox
                     id={module.key}
                     checked={modules[module.key as keyof AdvancedModules]}
                     onCheckedChange={(checked) => 
                       setModules(prev => ({ ...prev, [module.key]: !!checked }))
                     }
                     className="mt-0.5"
                   />
                   <div className="flex-1">
                     <Label 
                       htmlFor={module.key} 
                       className="font-mono text-xs cursor-pointer"
                     >
                       {module.label}
                     </Label>
                     <p className="text-xs text-muted-foreground mt-0.5">
                       {module.desc}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
 
           <Separator />
 
           {/* Risk Acknowledgment */}
           <div className="space-y-3">
             <div className="flex items-start gap-3 p-3 rounded-sm bg-severity-medium/10 border border-severity-medium/30">
               <Checkbox
                 id="risk-acknowledged"
                 checked={riskAcknowledged}
                 onCheckedChange={(checked) => setRiskAcknowledged(!!checked)}
                 className="mt-0.5"
               />
               <div className="flex-1">
                 <Label 
                   htmlFor="risk-acknowledged" 
                   className="font-mono text-xs cursor-pointer text-severity-medium"
                 >
                   I UNDERSTAND THE RISKS
                 </Label>
                 <p className="text-xs text-muted-foreground mt-1">
                   Advanced modules may cause service degradation, trigger alerts, 
                   or expose vulnerabilities. I accept responsibility for this scan.
                 </p>
               </div>
             </div>
           </div>
 
           {/* Production Warning */}
           {isProd && (
             <div className="space-y-3">
               <div className="flex items-start gap-3 p-4 rounded-sm bg-severity-critical/10 border border-severity-critical/30">
                 <AlertTriangle className="w-5 h-5 text-severity-critical mt-0.5" />
                 <div className="flex-1">
                   <p className="font-mono text-xs text-severity-critical mb-2">
                     PRODUCTION ENVIRONMENT — ELEVATED RISK
                   </p>
                   <p className="text-xs text-muted-foreground mb-3">
                     Running advanced tests on production may impact real users. 
                     Circuit breaker will halt if thresholds exceeded, but damage may occur.
                   </p>
                   <div className="flex items-start gap-2">
                     <Checkbox
                       id="approved-for-production"
                       checked={approvedForProduction}
                       onCheckedChange={(checked) => setApprovedForProduction(!!checked)}
                     />
                     <Label 
                       htmlFor="approved-for-production" 
                       className="font-mono text-[10px] cursor-pointer text-severity-critical"
                     >
                       APPROVED FOR PRODUCTION — I have authorization to run these tests
                     </Label>
                   </div>
                 </div>
               </div>
             </div>
           )}
 
           {/* Actions */}
           <div className="flex gap-3 pt-4">
             <Button 
               variant="outline" 
               onClick={handleCancel}
               className="flex-1 font-mono text-xs"
             >
               ABORT
             </Button>
             <Button 
               onClick={handleUnlock}
               disabled={!canUnlock}
               className="flex-1 gap-2 font-mono text-xs bg-severity-medium hover:bg-severity-medium/90 text-background"
             >
               <Lock className="w-3 h-3" />
               AUTHORIZE
             </Button>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
 }