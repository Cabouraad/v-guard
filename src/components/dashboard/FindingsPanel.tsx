 import { useState } from 'react';
 import { ChevronDown, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { SeverityLevel } from '@/types/database';
 
 interface Finding {
   id: string;
   severity: SeverityLevel;
   title: string;
   description: string;
   endpoint?: string;
   impact?: string;
   reproSteps?: string[];
   fixPrompt?: string;
 }
 
 // Demo findings
 const demoFindings: Finding[] = [
   {
     id: '1',
     severity: 'critical',
     title: 'Missing Content Security Policy',
     description: 'No CSP header detected. Application is vulnerable to XSS attacks through inline script injection.',
     endpoint: 'https://app.example.com/*',
     impact: 'Attackers can inject malicious scripts that execute in user context, leading to session hijacking or data theft.',
     reproSteps: ['Navigate to any page', 'Inspect response headers', 'Observe missing Content-Security-Policy header'],
     fixPrompt: 'Add Content-Security-Policy header with strict-dynamic and nonce-based script allowlisting.',
   },
   {
     id: '2',
     severity: 'high',
     title: 'Exposed API Keys in Client Bundle',
     description: 'Private API credentials detected in JavaScript bundle. Secrets accessible via browser dev tools.',
     endpoint: '/static/js/main.bundle.js',
     impact: 'API keys can be extracted and used for unauthorized access to backend services.',
     reproSteps: ['Open browser dev tools', 'Navigate to Sources > main.bundle.js', 'Search for "API_KEY" or "SECRET"'],
     fixPrompt: 'Move sensitive credentials to server-side environment variables. Use backend proxy for API calls.',
   },
   {
     id: '3',
     severity: 'high',
     title: 'CORS Allows Any Origin',
     description: 'Access-Control-Allow-Origin set to * on authenticated endpoints.',
     endpoint: '/api/user/*',
     impact: 'Cross-origin requests from malicious sites can access authenticated user data.',
   },
   {
     id: '4',
     severity: 'medium',
     title: 'Missing X-Frame-Options Header',
     description: 'Application can be embedded in iframes, enabling clickjacking attacks.',
     endpoint: '/*',
   },
   {
     id: '5',
     severity: 'low',
     title: 'Server Version Disclosure',
     description: 'Server header reveals nginx/1.21.0 version information.',
     endpoint: '/*',
   },
 ];
 
 const severityBorderColors: Record<SeverityLevel, string> = {
   critical: 'border-l-severity-critical',
   high: 'border-l-severity-high',
   medium: 'border-l-severity-medium',
   low: 'border-l-severity-low',
   info: 'border-l-severity-info',
   not_tested: 'border-l-muted-foreground',
 };
 
 interface FindingRowProps {
   finding: Finding;
   isExpanded: boolean;
   onToggle: () => void;
   onSelect: () => void;
 }
 
 function FindingRow({ finding, isExpanded, onToggle, onSelect }: FindingRowProps) {
   const [copied, setCopied] = useState(false);
 
   const copyFixPrompt = () => {
     if (finding.fixPrompt) {
       navigator.clipboard.writeText(finding.fixPrompt);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     }
   };
 
   return (
     <div className={cn(
       "border-l-2 border-b border-border bg-background transition-colors",
       severityBorderColors[finding.severity],
       isExpanded && "bg-muted/30"
     )}>
       {/* Row header */}
       <button
         onClick={onToggle}
         className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
       >
         <span className="text-muted-foreground">
           {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
         </span>
         <span className={cn(
           "uppercase text-[10px] font-mono font-bold tracking-wider w-16",
           finding.severity === 'critical' && "text-severity-critical",
           finding.severity === 'high' && "text-severity-high",
           finding.severity === 'medium' && "text-severity-medium",
           finding.severity === 'low' && "text-severity-low",
           finding.severity === 'info' && "text-severity-info"
         )}>
           {finding.severity}
         </span>
         <span className="flex-1 text-sm font-medium text-foreground truncate">
           {finding.title}
         </span>
         <button
           onClick={(e) => {
             e.stopPropagation();
             onSelect();
           }}
           className="p-1 text-muted-foreground hover:text-foreground transition-colors"
         >
           <ExternalLink className="w-4 h-4" />
         </button>
       </button>
 
       {/* Expanded content */}
       {isExpanded && (
         <div className="px-4 pb-4 pl-12 space-y-3 animate-fade-in">
           <p className="text-sm text-muted-foreground">{finding.description}</p>
           
           {finding.endpoint && (
             <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground">TARGET</span>
               <code className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded-sm">
                 {finding.endpoint}
               </code>
             </div>
           )}
 
           {finding.impact && (
             <div>
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">IMPACT</span>
               <p className="text-sm text-foreground/80">{finding.impact}</p>
             </div>
           )}
 
           {finding.reproSteps && (
             <div>
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">REPRO STEPS</span>
               <ol className="list-decimal list-inside text-sm text-foreground/80 space-y-1">
                 {finding.reproSteps.map((step, i) => (
                   <li key={i}>{step}</li>
                 ))}
               </ol>
             </div>
           )}
 
           {finding.fixPrompt && (
             <div className="border-t border-border pt-3 mt-3">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] uppercase tracking-wider text-primary">REMEDIATION PROMPT</span>
                 <button
                   onClick={copyFixPrompt}
                   className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                 >
                   {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                   {copied ? 'COPIED' : 'EXPORT'}
                 </button>
               </div>
               <code className="block text-xs font-mono text-foreground/90 bg-muted/50 p-2 rounded-sm">
                 {finding.fixPrompt}
               </code>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }
 
 interface FindingsPanelProps {
   onSelectFinding?: (findingId: string) => void;
 }
 
 export function FindingsPanel({ onSelectFinding }: FindingsPanelProps) {
   const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
 
   const toggleExpanded = (id: string) => {
     setExpandedIds(prev => {
       const next = new Set(prev);
       if (next.has(id)) {
         next.delete(id);
       } else {
         next.add(id);
       }
       return next;
     });
   };
 
   return (
     <div className="flex flex-col h-full">
       {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-border">
         <h2 className="font-mono text-sm text-foreground">FINDINGS</h2>
         <span className="text-xs font-mono text-muted-foreground">
           {demoFindings.length} issues
         </span>
       </div>
 
       {/* Findings list */}
       <div className="flex-1 overflow-auto">
         {demoFindings.map(finding => (
           <FindingRow
             key={finding.id}
             finding={finding}
             isExpanded={expandedIds.has(finding.id)}
             onToggle={() => toggleExpanded(finding.id)}
             onSelect={() => onSelectFinding?.(finding.id)}
           />
         ))}
       </div>
     </div>
   );
 }