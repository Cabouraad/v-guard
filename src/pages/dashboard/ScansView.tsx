 import { useState } from 'react';
 import { RiskTimeline } from '@/components/dashboard/RiskTimeline';
 import { FindingsPanel } from '@/components/dashboard/FindingsPanel';
 import { EvidencePanel } from '@/components/dashboard/EvidencePanel';
 import { Activity, Plus } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Link } from 'react-router-dom';
 import { cn } from '@/lib/utils';
 import type { ScanStatus, SeverityLevel } from '@/types/database';
 
 interface ScanEntry {
   id: string;
   projectName: string;
   url: string;
   status: ScanStatus;
   startedAt: string;
   duration: string;
   highestSeverity: SeverityLevel;
   findingsCount: number;
 }
 
 const recentScans: ScanEntry[] = [
   { id: '1', projectName: 'web-app', url: 'https://app.example.com', status: 'completed', startedAt: '2h ago', duration: '4m 23s', highestSeverity: 'critical', findingsCount: 8 },
   { id: '2', projectName: 'api-gateway', url: 'https://api.example.com', status: 'running', startedAt: '12m ago', duration: '-', highestSeverity: 'info', findingsCount: 2 },
   { id: '3', projectName: 'auth-service', url: 'https://auth.example.com', status: 'completed', startedAt: '1d ago', duration: '3m 45s', highestSeverity: 'high', findingsCount: 5 },
   { id: '4', projectName: 'web-app', url: 'https://app.example.com', status: 'completed', startedAt: '2d ago', duration: '5m 12s', highestSeverity: 'medium', findingsCount: 4 },
   { id: '5', projectName: 'api-gateway', url: 'https://api.example.com', status: 'failed', startedAt: '3d ago', duration: '1m 02s', highestSeverity: 'info', findingsCount: 0 },
 ];
 
 const severityColors: Record<SeverityLevel, string> = {
   critical: 'bg-severity-critical',
   high: 'bg-severity-high',
   medium: 'bg-severity-medium',
   low: 'bg-severity-low',
   info: 'bg-severity-info',
   not_tested: 'bg-muted-foreground',
 };
 
 const statusColors: Record<ScanStatus, string> = {
   completed: 'text-status-success',
   running: 'text-primary',
   pending: 'text-muted-foreground',
   queued: 'text-muted-foreground',
   failed: 'text-severity-critical',
   cancelled: 'text-muted-foreground',
   canceled: 'text-muted-foreground',
   paused: 'text-severity-medium',
 };
 
 export default function ScansView() {
   const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
   const [evidenceOpen, setEvidenceOpen] = useState(false);
 
   return (
     <div className="h-screen flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-6 py-4 border-b border-border">
         <div className="flex items-center gap-4">
           <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-mono text-lg text-foreground tracking-tight">SCAN LOG</h1>
         </div>
         <Link to="/projects/new">
           <Button variant="default" size="sm" className="font-mono text-xs gap-2">
             <Plus className="w-3 h-3" />
            QUEUE SCAN
           </Button>
         </Link>
       </header>
 
       {/* Risk Timeline */}
       <section className="px-6 py-4 border-b border-border">
         <RiskTimeline 
           selectedScanId={selectedScanId}
           onSelectScan={setSelectedScanId}
         />
       </section>
 
       {/* Scans list */}
       <div className="flex-1 overflow-auto">
         <table className="w-full">
           <thead className="sticky top-0 bg-background border-b border-border">
             <tr className="text-left">
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">SEV</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">TARGET</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ENDPOINT</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">STATE</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">QUEUED</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ELAPSED</th>
              <th className="px-6 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider text-right">ISSUES</th>
             </tr>
           </thead>
           <tbody>
             {recentScans.map(scan => (
               <tr 
                 key={scan.id}
                 onClick={() => {
                   setSelectedScanId(scan.id);
                   setEvidenceOpen(true);
                 }}
                 className={cn(
                   "border-b border-border cursor-pointer transition-colors",
                   selectedScanId === scan.id ? "bg-muted/50" : "hover:bg-muted/20"
                 )}
               >
                 <td className="px-6 py-4">
                   <span className={cn("w-3 h-3 rounded-sm inline-block", severityColors[scan.highestSeverity])} />
                 </td>
                 <td className="px-6 py-4 text-sm font-medium text-foreground">{scan.projectName}</td>
                 <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{scan.url}</td>
                 <td className="px-6 py-4">
                   <span className={cn("text-xs font-mono uppercase", statusColors[scan.status])}>
                     {scan.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />}
                     {scan.status}
                   </span>
                 </td>
                 <td className="px-6 py-4 text-xs text-muted-foreground">{scan.startedAt}</td>
                 <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{scan.duration}</td>
                 <td className="px-6 py-4 text-xs font-mono text-foreground text-right">{scan.findingsCount}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
 
       {/* Evidence panel */}
       <EvidencePanel 
         isOpen={evidenceOpen}
         onClose={() => setEvidenceOpen(false)}
       />
     </div>
   );
 }