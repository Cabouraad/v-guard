 import { cn } from '@/lib/utils';
 
 interface InstrumentGaugeProps {
   label: string;
   value: number;
   unit: string;
   max: number;
   warningThreshold?: number;
   criticalThreshold?: number;
   size?: 'sm' | 'md';
 }
 
 export function InstrumentGauge({
   label,
   value,
   unit,
   max,
   warningThreshold,
   criticalThreshold,
   size = 'md',
 }: InstrumentGaugeProps) {
   const percentage = Math.min((value / max) * 100, 100);
   
   const getColor = () => {
     if (criticalThreshold && value >= criticalThreshold) return 'text-severity-critical';
     if (warningThreshold && value >= warningThreshold) return 'text-severity-medium';
     return 'text-primary';
   };
 
   const getBgColor = () => {
     if (criticalThreshold && value >= criticalThreshold) return 'bg-severity-critical';
     if (warningThreshold && value >= warningThreshold) return 'bg-severity-medium';
     return 'bg-primary';
   };
 
   const dimensions = size === 'sm' ? 'w-24 h-24' : 'w-32 h-32';
   const strokeWidth = size === 'sm' ? 3 : 4;
   const radius = size === 'sm' ? 38 : 50;
   const circumference = 2 * Math.PI * radius;
   const offset = circumference - (percentage / 100) * circumference;
 
   return (
     <div className="flex flex-col items-center">
       <div className={cn("relative", dimensions)}>
         {/* Background circle */}
         <svg className="w-full h-full -rotate-90">
           <circle
             cx="50%"
             cy="50%"
             r={radius}
             fill="none"
             stroke="hsl(217 33% 15%)"
             strokeWidth={strokeWidth}
           />
           {/* Progress arc */}
           <circle
             cx="50%"
             cy="50%"
             r={radius}
             fill="none"
             stroke="currentColor"
             strokeWidth={strokeWidth}
             strokeLinecap="round"
             strokeDasharray={circumference}
             strokeDashoffset={offset}
             className={cn("transition-all duration-500", getColor())}
           />
         </svg>
         
         {/* Center value */}
         <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className={cn("font-mono font-bold", getColor(), size === 'sm' ? 'text-lg' : 'text-2xl')}>
             {value}
           </span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
             {unit}
           </span>
         </div>
       </div>
       
       <span className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
         {label}
       </span>
     </div>
   );
 }