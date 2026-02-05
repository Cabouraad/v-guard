 import { Lock, Unlock, HelpCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from '@/components/ui/tooltip';
 import { useSafetyLock } from './SafetyLockContext';
 
 interface SafetyLockIndicatorProps {
   onUnlockClick: () => void;
   onWhyLockedClick: () => void;
 }
 
 export function SafetyLockIndicator({ onUnlockClick, onWhyLockedClick }: SafetyLockIndicatorProps) {
   const { state, lock } = useSafetyLock();
 
   if (state.isLocked) {
     return (
       <div className="flex items-center gap-2">
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Badge 
                 variant="outline" 
                 className="gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border-status-success/50 text-status-success bg-status-success/10 cursor-pointer hover:bg-status-success/20 transition-colors"
                 onClick={onUnlockClick}
               >
                 <Lock className="w-3 h-3" />
                 READ-ONLY
               </Badge>
             </TooltipTrigger>
             <TooltipContent side="bottom" className="font-mono text-xs">
               <p>Safe mode active. Click to authorize advanced tests.</p>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
         <button
           onClick={onWhyLockedClick}
           className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
         >
           Why locked?
         </button>
       </div>
     );
   }
 
   return (
     <div className="flex items-center gap-2">
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Badge 
               variant="outline" 
               className="gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border-severity-medium/50 text-severity-medium bg-severity-medium/10"
             >
               <Unlock className="w-3 h-3" />
               ADVANCED
               {state.approvedForProduction && (
                 <span className="ml-1 text-severity-critical">• PROD</span>
               )}
             </Badge>
           </TooltipTrigger>
           <TooltipContent side="bottom" className="font-mono text-xs max-w-xs">
             <p className="mb-1">Advanced modules enabled:</p>
             <ul className="list-disc list-inside text-muted-foreground">
               {state.enabledModules.soak && <li>Soak testing</li>}
               {state.enabledModules.stress && <li>Stress testing</li>}
               {state.enabledModules.authProbing && <li>Auth probing</li>}
               {state.enabledModules.injectionTests && <li>Injection tests</li>}
             </ul>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
       <Button
         variant="ghost"
         size="sm"
         onClick={lock}
         className="h-6 px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
       >
         REVERT TO SAFE
       </Button>
     </div>
   );
 }