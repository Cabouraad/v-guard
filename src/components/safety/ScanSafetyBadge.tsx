 import { Lock, Unlock } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from '@/components/ui/tooltip';
 
 interface ScanSafetyBadgeProps {
   isLocked: boolean;
   approvedForProduction?: boolean;
   enabledModules?: {
     soak?: boolean;
     stress?: boolean;
     authProbing?: boolean;
     injectionTests?: boolean;
   };
   size?: 'sm' | 'md';
 }
 
 export function ScanSafetyBadge({ 
   isLocked, 
   approvedForProduction = false,
   enabledModules = {},
   size = 'md' 
 }: ScanSafetyBadgeProps) {
   const enabledList = Object.entries(enabledModules)
     .filter(([, enabled]) => enabled)
     .map(([name]) => name.toUpperCase());
 
   if (isLocked) {
     return (
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Badge 
               variant="outline" 
               className={`gap-1 font-mono uppercase tracking-wider border-status-success/50 text-status-success bg-status-success/10 ${
                 size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
               }`}
             >
               <Lock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
               READ-ONLY
             </Badge>
           </TooltipTrigger>
           <TooltipContent side="bottom" className="font-mono text-xs">
             <p>Safe mode active. Only passive probes executed.</p>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     );
   }
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <Badge 
             variant="outline" 
             className={`gap-1 font-mono uppercase tracking-wider border-severity-medium/50 text-severity-medium bg-severity-medium/10 ${
               size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
             }`}
           >
             <Unlock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
             ADVANCED
             {approvedForProduction && (
               <span className="text-severity-critical">• PROD</span>
             )}
           </Badge>
         </TooltipTrigger>
         <TooltipContent side="bottom" className="font-mono text-xs max-w-xs">
           <p className="mb-1">Advanced modules enabled:</p>
           {enabledList.length > 0 ? (
             <ul className="list-disc list-inside text-muted-foreground">
               {enabledList.map(mod => <li key={mod}>{mod}</li>)}
             </ul>
           ) : (
             <p className="text-muted-foreground">No specific modules listed</p>
           )}
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }