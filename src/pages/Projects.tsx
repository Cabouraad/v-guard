 import { useState } from 'react';
 import { Header } from '@/components/layout/Header';
 import { Button } from '@/components/ui/button';
 import { 
   Plus, 
   Globe, 
   ExternalLink,
   Trash2,
   Play,
   ChevronRight,
   ChevronDown,
   Settings2
 } from 'lucide-react';
 import { Link } from 'react-router-dom';
 import { cn } from '@/lib/utils';
 import type { EnvironmentType } from '@/types/database';
 
 // Demo data
 const projects = [
   {
     id: '1',
     name: 'my-saas-app',
     baseUrl: 'https://my-saas-app.lovable.app',
     environment: 'production' as EnvironmentType,
     lastScanAt: '2 hours ago',
     totalScans: 5,
     lastScore: 72,
     findings: { critical: 0, high: 2, medium: 3 },
     maxRps: 10,
   },
   {
     id: '2',
     name: 'portfolio-site',
     baseUrl: 'https://portfolio.vercel.app',
     environment: 'production' as EnvironmentType,
     lastScanAt: 'In progress',
     totalScans: 3,
     lastScore: null,
     findings: { critical: 0, high: 0, medium: 0 },
     maxRps: 15,
   },
   {
     id: '3',
     name: 'ecommerce-store',
     baseUrl: 'https://store.replit.app',
     environment: 'staging' as EnvironmentType,
     lastScanAt: '1 day ago',
     totalScans: 8,
     lastScore: 89,
     findings: { critical: 0, high: 1, medium: 2 },
     maxRps: 50,
   },
 ];
 
 const environmentColors: Record<EnvironmentType, string> = {
   production: 'text-severity-critical',
   staging: 'text-severity-medium',
   development: 'text-status-success',
   prod: 'text-severity-critical',
   dev: 'text-status-success',
 };
 
 const environmentLabels: Record<EnvironmentType, string> = {
   production: 'PROD',
   staging: 'STG',
   development: 'DEV',
   prod: 'PROD',
   dev: 'DEV',
 };
 
 export default function Projects() {
   const [expandedId, setExpandedId] = useState<string | null>(null);
 
   const toggleExpanded = (id: string) => {
     setExpandedId(expandedId === id ? null : id);
   };
 
   return (
     <div className="min-h-screen bg-background">
       <Header 
         title="Targets" 
         subtitle="Authorized scan targets and their current status"
       />
 
       <div className="flex flex-col h-[calc(100vh-80px)]">
         {/* Header bar */}
         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
           <div className="flex items-center gap-4">
             <Globe className="w-5 h-5 text-primary" />
             <span className="font-mono text-xs text-muted-foreground">
               {projects.length} TARGETS REGISTERED
             </span>
           </div>
            <Link to="/dashboard/targets/new">
              <Button size="sm" className="gap-2 font-mono text-xs">
                <Plus className="w-4 h-4" />
                AUTHORIZE TARGET
              </Button>
            </Link>
         </div>
 
         {/* Table */}
         <div className="flex-1 overflow-auto">
           <table className="w-full">
             <thead className="sticky top-0 bg-background border-b border-border z-10">
               <tr className="text-left">
                 <th className="w-8 px-4 py-3"></th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ENV</th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">TARGET</th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ENDPOINT</th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">LAST SCAN</th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider text-center">RUNS</th>
                 <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider text-right">SCORE</th>
                 <th className="w-24 px-4 py-3"></th>
               </tr>
             </thead>
             <tbody>
               {projects.map((project) => {
                 const isExpanded = expandedId === project.id;
                 return (
                   <TargetRow 
                     key={project.id}
                     project={project}
                     isExpanded={isExpanded}
                     onToggle={() => toggleExpanded(project.id)}
                   />
                 );
               })}
             </tbody>
           </table>
         </div>
 
         {/* Footer with add action */}
          <div className="px-6 py-4 border-t border-border">
            <Link to="/dashboard/targets/new">
              <button className="w-full py-3 border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
                AUTHORIZE NEW TARGET
              </button>
            </Link>
         </div>
       </div>
     </div>
   );
 }
 
 interface TargetRowProps {
   project: typeof projects[0];
   isExpanded: boolean;
   onToggle: () => void;
 }
 
 function TargetRow({ project, isExpanded, onToggle }: TargetRowProps) {
   return (
     <>
       <tr 
         onClick={onToggle}
         className={cn(
           "border-b border-border cursor-pointer transition-colors",
           isExpanded ? "bg-muted/30" : "hover:bg-muted/10"
         )}
       >
         <td className="px-4 py-4">
           {isExpanded ? (
             <ChevronDown className="w-4 h-4 text-muted-foreground" />
           ) : (
             <ChevronRight className="w-4 h-4 text-muted-foreground" />
           )}
         </td>
         <td className="px-4 py-4">
           <span className={cn(
             "text-[10px] font-mono font-bold uppercase",
             environmentColors[project.environment]
           )}>
             {environmentLabels[project.environment]}
           </span>
         </td>
         <td className="px-4 py-4">
           <span className="text-sm font-mono font-medium text-foreground">
             {project.name}
           </span>
         </td>
         <td className="px-4 py-4">
           <span className="text-xs font-mono text-muted-foreground">
             {project.baseUrl}
           </span>
         </td>
         <td className="px-4 py-4">
           <span className="text-xs font-mono text-muted-foreground">
             {project.lastScanAt}
           </span>
         </td>
         <td className="px-4 py-4 text-center">
           <span className="text-xs font-mono text-muted-foreground">
             {project.totalScans}
           </span>
         </td>
         <td className="px-4 py-4 text-right">
           {project.lastScore !== null ? (
             <span className={cn(
               "text-lg font-mono font-bold",
               project.lastScore >= 80 ? 'text-status-success' :
               project.lastScore >= 60 ? 'text-severity-medium' :
               'text-severity-critical'
             )}>
               {project.lastScore}
             </span>
           ) : (
             <span className="text-xs font-mono text-muted-foreground">—</span>
           )}
         </td>
         <td className="px-4 py-4">
           <div className="flex items-center justify-end gap-1">
              <Link to={`/dashboard/scans/${project.id}`} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Play className="w-3.5 h-3.5" />
               </Button>
             </Link>
           </div>
         </td>
       </tr>
       
       {/* Expanded row content */}
       {isExpanded && (
         <tr className="bg-muted/20 border-b border-border">
           <td colSpan={8} className="px-4 py-4">
             <div className="pl-8 grid grid-cols-4 gap-6">
               {/* Quick stats */}
               <div className="space-y-3">
                 <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                   FINDINGS SUMMARY
                 </h4>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-sm bg-severity-critical" />
                     <span className="text-xs font-mono text-foreground">{project.findings.critical}</span>
                     <span className="text-[10px] font-mono text-muted-foreground">CRIT</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-sm bg-severity-high" />
                     <span className="text-xs font-mono text-foreground">{project.findings.high}</span>
                     <span className="text-[10px] font-mono text-muted-foreground">HIGH</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-sm bg-severity-medium" />
                     <span className="text-xs font-mono text-foreground">{project.findings.medium}</span>
                     <span className="text-[10px] font-mono text-muted-foreground">MED</span>
                   </div>
                 </div>
               </div>
 
               {/* Configuration */}
               <div className="space-y-3">
                 <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                   RATE LIMIT
                 </h4>
                 <div className="text-xs font-mono text-foreground">
                   {project.maxRps} RPS
                 </div>
               </div>
 
               {/* External link */}
               <div className="space-y-3">
                 <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                   EXTERNAL
                 </h4>
                 <a 
                   href={project.baseUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                   onClick={(e) => e.stopPropagation()}
                 >
                   Open Target
                   <ExternalLink className="w-3 h-3" />
                 </a>
               </div>
 
               {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <Link to={`/dashboard/scans/${project.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="gap-1.5 font-mono text-[10px]">
                      <Play className="w-3 h-3" />
                     QUEUE SCAN
                   </Button>
                 </Link>
                 <Button size="sm" variant="ghost" className="gap-1.5 font-mono text-[10px]">
                   <Settings2 className="w-3 h-3" />
                   CONFIGURE
                 </Button>
                 <Button size="sm" variant="ghost" className="text-severity-critical hover:text-severity-critical font-mono text-[10px]">
                   <Trash2 className="w-3 h-3" />
                 </Button>
               </div>
             </div>
           </td>
         </tr>
       )}
     </>
   );
 }