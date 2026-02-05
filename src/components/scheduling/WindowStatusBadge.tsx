 import { Clock, CalendarClock } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useRunWindow } from './RunWindowContext';
 
 interface WindowStatusBadgeProps {
   className?: string;
   showNextOpen?: boolean;
 }
 
 export function WindowStatusBadge({ className, showNextOpen = true }: WindowStatusBadgeProps) {
   const { window, isWithinWindow, formatNextWindowOpen } = useRunWindow();
 
   if (!window.enabled) return null;
 
   const withinWindow = isWithinWindow();
 
   if (withinWindow) {
     return (
       <div className={cn(
         "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider",
         "bg-status-success/10 border border-status-success/30 text-status-success",
         className
       )}>
         <Clock className="w-3 h-3" />
         WINDOW OPEN
       </div>
     );
   }
 
   return (
     <div className={cn(
       "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono",
       "bg-severity-medium/10 border border-severity-medium/30",
       className
     )}>
       <CalendarClock className="w-3 h-3 text-severity-medium" />
       <div className="flex flex-col">
         <span className="uppercase tracking-wider text-severity-medium">
           QUEUED (WINDOW)
         </span>
         {showNextOpen && (
           <span className="text-muted-foreground normal-case">
             {formatNextWindowOpen()}
           </span>
         )}
       </div>
     </div>
   );
 }