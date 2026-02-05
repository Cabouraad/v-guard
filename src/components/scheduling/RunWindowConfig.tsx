 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
 import { Clock, Calendar, Globe } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useRunWindow, DAYS_OF_WEEK, type RunWindow } from './RunWindowContext';
 
 const TIMEZONES = [
   'UTC',
   'America/New_York',
   'America/Chicago',
   'America/Denver',
   'America/Los_Angeles',
   'Europe/London',
   'Europe/Paris',
   'Europe/Berlin',
   'Asia/Tokyo',
   'Asia/Shanghai',
   'Asia/Singapore',
   'Australia/Sydney',
 ];
 
 const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => 
   `${i.toString().padStart(2, '0')}:00`
 );
 
 interface RunWindowConfigProps {
   className?: string;
 }
 
 export function RunWindowConfig({ className }: RunWindowConfigProps) {
   const { window, setWindow, isWithinWindow, formatNextWindowOpen } = useRunWindow();
 
   const updateWindow = (updates: Partial<RunWindow>) => {
     setWindow({ ...window, ...updates });
   };
 
   const toggleDay = (day: number) => {
     const days = window.days.includes(day)
       ? window.days.filter(d => d !== day)
       : [...window.days, day].sort();
     updateWindow({ days });
   };
 
   const withinWindow = isWithinWindow();
 
   return (
     <div className={cn("space-y-6", className)}>
       {/* Enable/Disable */}
       <div className="flex items-center justify-between py-2">
         <div>
           <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
             AUTHORIZED WINDOW
           </Label>
           <p className="text-[10px] text-muted-foreground mt-0.5">
             Restrict scan execution to approved time slots
           </p>
         </div>
         <Switch
           checked={window.enabled}
           onCheckedChange={(enabled) => updateWindow({ enabled })}
         />
       </div>
 
       {window.enabled && (
         <>
           {/* Current Status */}
           <div className={cn(
             "p-3 border",
             withinWindow 
               ? "bg-status-success/10 border-status-success/30" 
               : "bg-severity-medium/10 border-severity-medium/30"
           )}>
             <div className="flex items-center gap-2">
               <Clock className={cn(
                 "w-4 h-4",
                 withinWindow ? "text-status-success" : "text-severity-medium"
               )} />
               <span className={cn(
                 "text-[10px] font-mono uppercase",
                 withinWindow ? "text-status-success" : "text-severity-medium"
               )}>
                 {withinWindow ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
               </span>
             </div>
             {!withinWindow && (
               <p className="text-[10px] font-mono text-muted-foreground mt-1 pl-6">
                 {formatNextWindowOpen()}
               </p>
             )}
           </div>
 
           {/* Timezone */}
           <div className="space-y-2">
             <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
               <Globe className="w-3 h-3" />
               TIMEZONE
             </Label>
             <Select
               value={window.timezone}
               onValueChange={(timezone) => updateWindow({ timezone })}
             >
               <SelectTrigger className="font-mono text-xs">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {TIMEZONES.map((tz) => (
                   <SelectItem key={tz} value={tz}>
                     <span className="font-mono text-xs">{tz}</span>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Days of Week */}
           <div className="space-y-2">
             <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
               <Calendar className="w-3 h-3" />
               AUTHORIZED DAYS
             </Label>
             <div className="flex gap-1">
               {DAYS_OF_WEEK.map((day, index) => (
                 <button
                   key={day}
                   type="button"
                   onClick={() => toggleDay(index)}
                   className={cn(
                     "flex-1 py-2 text-[10px] font-mono uppercase border transition-colors",
                     window.days.includes(index)
                       ? "bg-primary text-primary-foreground border-primary"
                       : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
                   )}
                 >
                   {day}
                 </button>
               ))}
             </div>
           </div>
 
           {/* Time Range */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 WINDOW OPEN
               </Label>
               <Select
                 value={window.startTime}
                 onValueChange={(startTime) => updateWindow({ startTime })}
               >
                 <SelectTrigger className="font-mono text-xs">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {TIME_OPTIONS.map((time) => (
                     <SelectItem key={time} value={time}>
                       <span className="font-mono text-xs">{time}</span>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 WINDOW CLOSE
               </Label>
               <Select
                 value={window.endTime}
                 onValueChange={(endTime) => updateWindow({ endTime })}
               >
                 <SelectTrigger className="font-mono text-xs">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {TIME_OPTIONS.map((time) => (
                     <SelectItem key={time} value={time}>
                       <span className="font-mono text-xs">{time}</span>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           {/* Summary */}
           <div className="p-3 bg-muted/30 border border-border">
             <div className="text-[10px] font-mono text-muted-foreground mb-1">
               AUTHORIZED WINDOW SUMMARY
             </div>
             <div className="text-xs font-mono text-foreground">
               {window.days.map(d => DAYS_OF_WEEK[d]).join(', ')} • {window.startTime}–{window.endTime} {window.timezone}
             </div>
           </div>
         </>
       )}
     </div>
   );
 }