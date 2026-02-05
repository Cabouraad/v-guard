 import { useState } from 'react';
 import { cn } from '@/lib/utils';
 import type { SeverityLevel } from '@/types/database';
 
 interface ScanPoint {
   id: string;
   date: string;
   projectName: string;
   highestSeverity: SeverityLevel;
   findingsCount: number;
   securityScore: number;
 }
 
 // Demo data
 const scanHistory: ScanPoint[] = [
   { id: '1', date: '2026-02-05', projectName: 'api-gateway', highestSeverity: 'medium', findingsCount: 4, securityScore: 78 },
   { id: '2', date: '2026-02-04', projectName: 'web-app', highestSeverity: 'critical', findingsCount: 8, securityScore: 52 },
   { id: '3', date: '2026-02-03', projectName: 'api-gateway', highestSeverity: 'low', findingsCount: 2, securityScore: 91 },
   { id: '4', date: '2026-02-02', projectName: 'auth-service', highestSeverity: 'high', findingsCount: 5, securityScore: 65 },
   { id: '5', date: '2026-02-01', projectName: 'web-app', highestSeverity: 'info', findingsCount: 1, securityScore: 95 },
   { id: '6', date: '2026-01-31', projectName: 'api-gateway', highestSeverity: 'medium', findingsCount: 3, securityScore: 82 },
   { id: '7', date: '2026-01-30', projectName: 'auth-service', highestSeverity: 'low', findingsCount: 2, securityScore: 88 },
 ];
 
 const severityColors: Record<SeverityLevel, string> = {
   critical: 'bg-severity-critical',
   high: 'bg-severity-high',
   medium: 'bg-severity-medium',
   low: 'bg-severity-low',
   info: 'bg-severity-info',
   not_tested: 'bg-muted-foreground',
 };
 
 const severityGlow: Record<SeverityLevel, string> = {
   critical: 'shadow-[0_0_8px_hsl(var(--severity-critical)/0.5)]',
   high: 'shadow-[0_0_8px_hsl(var(--severity-high)/0.5)]',
   medium: '',
   low: '',
   info: '',
   not_tested: '',
 };
 
 interface RiskTimelineProps {
   onSelectScan?: (scanId: string) => void;
   selectedScanId?: string | null;
 }
 
 export function RiskTimeline({ onSelectScan, selectedScanId }: RiskTimelineProps) {
   const [hoveredId, setHoveredId] = useState<string | null>(null);
 
   return (
     <div className="relative py-6">
       {/* Timeline axis */}
       <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
       
       {/* Date labels */}
       <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4 px-2">
         <span>7d ago</span>
         <span>today</span>
       </div>
 
       {/* Scan points */}
       <div className="relative flex items-center justify-between px-2 h-12">
         {[...scanHistory].reverse().map((scan, index) => {
           const isHovered = hoveredId === scan.id;
           const isSelected = selectedScanId === scan.id;
           
           return (
             <div 
               key={scan.id}
               className="relative group"
               onMouseEnter={() => setHoveredId(scan.id)}
               onMouseLeave={() => setHoveredId(null)}
             >
               {/* Scan point */}
               <button
                 onClick={() => onSelectScan?.(scan.id)}
                 className={cn(
                   "relative w-3 h-3 rounded-sm transition-all duration-200",
                   severityColors[scan.highestSeverity],
                   severityGlow[scan.highestSeverity],
                   isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                   isHovered && "scale-150"
                 )}
               />
 
               {/* Tooltip */}
               {isHovered && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10 pointer-events-none">
                   <div className="bg-popover border border-border rounded-sm p-2 shadow-lg min-w-[140px]">
                     <div className="font-mono text-xs text-foreground">{scan.projectName}</div>
                     <div className="text-[10px] text-muted-foreground mt-1">{scan.date}</div>
                     <div className="flex items-center gap-2 mt-2">
                       <span className={cn("w-2 h-2 rounded-sm", severityColors[scan.highestSeverity])} />
                       <span className="text-[10px] text-muted-foreground">
                         {scan.findingsCount} findings
                       </span>
                     </div>
                     <div className="text-xs font-mono mt-1">
                       Score: <span className={cn(
                         scan.securityScore >= 80 ? "text-status-success" :
                         scan.securityScore >= 60 ? "text-severity-medium" :
                         "text-severity-critical"
                       )}>{scan.securityScore}</span>
                     </div>
                   </div>
                   {/* Arrow */}
                   <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
                 </div>
               )}
             </div>
           );
         })}
       </div>
     </div>
   );
 }