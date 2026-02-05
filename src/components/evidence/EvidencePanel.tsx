 import { useEffect, useRef } from 'react';
 import { X, Copy, Check, FileText, Terminal, Image as ImageIcon, Archive, Clock, Hash } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useEvidencePanel, EvidenceTabType } from './EvidencePanelContext';
 import { useState } from 'react';
 import { toast } from 'sonner';
 
 // Demo evidence data keyed by finding/module
 const evidenceData: Record<string, {
   correlationId: string;
   timestamp: string;
   request: string;
   response: string;
   redactedFields: string[];
 }> = {
   '1': {
     correlationId: 'corr-csp-001',
     timestamp: '2024-01-15T14:23:04.123Z',
     request: `GET / HTTP/1.1
 Host: app.example.com
 User-Agent: SentinelProbe/1.0
 X-Correlation-ID: corr-csp-001
 Accept: text/html`,
     response: `HTTP/1.1 200 OK
 Content-Type: text/html
 X-Powered-By: Express
 
 [RESPONSE BODY REDACTED]`,
     redactedFields: ['Set-Cookie', 'Authorization'],
   },
   '2': {
     correlationId: 'corr-apikey-002',
     timestamp: '2024-01-15T14:23:06.456Z',
     request: `GET /static/js/main.bundle.js HTTP/1.1
 Host: app.example.com
 User-Agent: SentinelProbe/1.0
 X-Correlation-ID: corr-apikey-002`,
     response: `HTTP/1.1 200 OK
 Content-Type: application/javascript
 
 ...
 const STRIPE_KEY = "sk_test_[REDACTED]";
 const API_SECRET = "[REDACTED]";
 ...`,
     redactedFields: ['STRIPE_KEY', 'API_SECRET', 'DATABASE_URL'],
   },
   fingerprint: {
     correlationId: 'corr-fp-001',
     timestamp: '2024-01-15T14:23:01.000Z',
     request: `DNS LOOKUP: app.example.com
 TLS HANDSHAKE: 192.168.1.100:443`,
     response: `DNS: 192.168.1.100 (TTL: 300)
 TLS: 1.3 (TLS_AES_256_GCM_SHA384)
 Certificate: CN=*.example.com, Valid until 2025-03-15
 Server: cloudflare
 Technologies: React, Vite, Tailwind CSS`,
     redactedFields: [],
   },
   security_safe: {
     correlationId: 'corr-sec-001',
     timestamp: '2024-01-15T14:23:03.000Z',
     request: `GET /api/users/profile HTTP/1.1
 Host: app.example.com
 Origin: https://malicious-site.com
 X-Correlation-ID: corr-sec-001`,
     response: `HTTP/1.1 200 OK
 Access-Control-Allow-Origin: *
 Access-Control-Allow-Credentials: true
 X-Powered-By: Express
 
 {"id":"[REDACTED]","email":"[REDACTED]","role":"admin"}`,
     redactedFields: ['id', 'email', 'session_token'],
   },
 };
 
 // Demo artifacts data
 const artifactsData: Record<string, Array<{
   id: string;
   type: 'har' | 'screenshot' | 'trace' | 'pcap';
   name: string;
   size: string;
   timestamp: string;
 }>> = {
   default: [
     { id: 'har-001', type: 'har', name: 'full-scan.har', size: '2.4 MB', timestamp: '14:25:00' },
     { id: 'ss-001', type: 'screenshot', name: 'homepage-render.png', size: '156 KB', timestamp: '14:23:02' },
     { id: 'trace-001', type: 'trace', name: 'perf-baseline.trace', size: '890 KB', timestamp: '14:23:15' },
   ],
   fingerprint: [
     { id: 'har-fp', type: 'har', name: 'fingerprint.har', size: '45 KB', timestamp: '14:23:02' },
     { id: 'ss-fp', type: 'screenshot', name: 'initial-render.png', size: '89 KB', timestamp: '14:23:02' },
   ],
   security_safe: [
     { id: 'har-sec', type: 'har', name: 'security-checks.har', size: '178 KB', timestamp: '14:23:06' },
     { id: 'pcap-sec', type: 'pcap', name: 'tls-handshake.pcap', size: '12 KB', timestamp: '14:23:03' },
   ],
 };
 
 // Demo logs data
 const logsData: Record<string, string> = {
   default: `[14:23:00] Scan orchestrator initialized
 [14:23:00] Target: app.example.com
 [14:23:00] Mode: READ-ONLY (Safety Lock enabled)
 [14:23:01] Starting fingerprint module...`,
   fingerprint: `[14:23:01] [corr-fp-001] DNS lookup: app.example.com
 [14:23:01] [corr-fp-001] Resolved: 192.168.1.100
 [14:23:01] [corr-fp-001] TLS handshake initiated
 [14:23:01] [corr-fp-001] TLS 1.3 negotiated
 [14:23:01] [corr-fp-001] Certificate valid: CN=*.example.com
 [14:23:01] [corr-fp-001] Server header: cloudflare
 [14:23:02] [corr-fp-001] Tech detection: React (18.x), Vite, Tailwind
 [14:23:02] [corr-fp-001] Source maps detected: /assets/*.js.map
 [14:23:02] [corr-fp-001] Fingerprint phase complete`,
   security_safe: `[14:23:03] [corr-sec-001] Starting security safe checks
 [14:23:03] [corr-sec-001] GET /api/users/profile
 [14:23:03] [corr-sec-001] Response: 200 OK (45ms)
 [14:23:03] [corr-sec-001] ⚠ Missing CSP header
 [14:23:03] [corr-sec-001] ⚠ X-Frame-Options: not present
 [14:23:04] [corr-sec-001] CORS: Access-Control-Allow-Origin: *
 [14:23:04] [corr-sec-001] ⚠ Permissive CORS on auth endpoint
 [14:23:05] [corr-sec-001] Cookie: session_id missing Secure flag
 [14:23:05] [corr-sec-001] ⚠ Found: STRIPE_KEY in bundle
 [14:23:06] [corr-sec-001] Security safe checks complete`,
   perf_baseline: `[14:23:10] [corr-perf-001] Baseline sampling started
 [14:23:10] [corr-perf-001] Request 1: 142ms (cold)
 [14:23:11] [corr-perf-001] Request 2: 89ms
 [14:23:12] [corr-perf-001] Request 3: 76ms
 [14:23:13] [corr-perf-001] Request 4: 81ms
 [14:23:14] [corr-perf-001] Request 5: 78ms
 [14:23:14] [corr-perf-001] Baseline: p50=81ms p95=142ms
 [14:23:14] [corr-perf-001] TTFB: 45ms average
 [14:23:14] [corr-perf-001] Baseline phase complete`,
   load_ramp: `[14:23:20] [corr-load-001] Load ramp started (light mode)
 [14:23:20] [corr-load-001] Ramp: 1 RPS → target 5 RPS
 [14:23:25] [corr-load-001] Step 1: 1 RPS, p50=85ms, errors=0%
 [14:23:30] [corr-load-001] Step 2: 2 RPS, p50=88ms, errors=0%
 [14:23:35] [corr-load-001] Step 3: 3 RPS, p50=92ms, errors=0%
 [14:23:40] [corr-load-001] Step 4: 4 RPS, p50=105ms, errors=0%
 [14:23:45] [corr-load-001] Step 5: 5 RPS, p50=118ms, errors=0.2%
 [14:23:50] [corr-load-001] Cooldown: returning to baseline
 [14:23:55] [corr-load-001] Load ramp complete`,
   report: `[14:24:00] [corr-rpt-001] Aggregating findings...
 [14:24:01] [corr-rpt-001] Security findings: 6 total
 [14:24:01] [corr-rpt-001] - Critical: 1, High: 2, Medium: 2, Low: 1
 [14:24:02] [corr-rpt-001] Computing scores...
 [14:24:02] [corr-rpt-001] Security Score: 72/100
 [14:24:02] [corr-rpt-001] Reliability Score: 85/100
 [14:24:03] [corr-rpt-001] Generating report model...
 [14:24:03] [corr-rpt-001] Report compile complete`,
 };
 
 const artifactIcons: Record<string, typeof FileText> = {
   har: Archive,
   screenshot: ImageIcon,
   trace: Terminal,
   pcap: FileText,
 };
 
 export function EvidencePanel() {
   const { isOpen, activeTab, filter, closePanel, setActiveTab } = useEvidencePanel();
   const [copied, setCopied] = useState(false);
   const panelRef = useRef<HTMLDivElement>(null);
 
   // Get filter key for data lookup
   const filterKey = filter.findingId || filter.moduleKey || 'default';
   const evidence = evidenceData[filterKey] || evidenceData['security_safe'];
   const artifacts = artifactsData[filterKey] || artifactsData['default'];
   const logs = logsData[filterKey] || logsData['default'];
 
   // Get filter label
   const getFilterLabel = () => {
     if (filter.findingId) return `Finding: ${filter.findingId}`;
     if (filter.moduleKey) return filter.moduleKey.toUpperCase().replace('_', ' ');
     if (filter.taskType) return filter.taskType.toUpperCase().replace('_', ' ');
     return null;
   };
 
   const copyEvidence = () => {
     const evidenceText = `# Evidence Export
 Correlation ID: ${evidence.correlationId}
 Timestamp: ${evidence.timestamp}
 Redacted Fields: ${evidence.redactedFields.join(', ') || 'None'}
 
 ## Request
 ${evidence.request}
 
 ## Response
 ${evidence.response}
 `;
     navigator.clipboard.writeText(evidenceText);
     setCopied(true);
     toast.success('Redacted evidence copied to clipboard');
     setTimeout(() => setCopied(false), 2000);
   };
 
   const formatTimestamp = (iso: string) => {
     const date = new Date(iso);
     return date.toLocaleTimeString('en-US', { 
       hour: '2-digit', 
       minute: '2-digit', 
       second: '2-digit',
       hour12: false 
     });
   };
 
   return (
     <div
       ref={panelRef}
       className={cn(
         "fixed right-0 top-0 h-screen bg-background border-l border-border z-40 transition-all duration-300 flex flex-col",
         isOpen ? "w-[30%] min-w-[360px]" : "w-0 overflow-hidden"
       )}
     >
       {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
         <div>
           <h3 className="font-mono text-xs text-foreground uppercase tracking-wider">EVIDENCE INSPECTOR</h3>
           {getFilterLabel() && (
             <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
               Filter: {getFilterLabel()}
             </p>
           )}
         </div>
         <button
           onClick={closePanel}
           className="p-1 text-muted-foreground hover:text-foreground transition-colors"
         >
           <X className="w-4 h-4" />
         </button>
       </div>
 
       {/* Tabs */}
       <Tabs 
         value={activeTab} 
         onValueChange={(v) => setActiveTab(v as EvidenceTabType)}
         className="flex-1 flex flex-col overflow-hidden"
       >
         <TabsList className="w-full h-10 rounded-none border-b border-border bg-transparent p-0">
           <TabsTrigger 
             value="evidence" 
             className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-mono text-xs uppercase"
           >
             <FileText className="w-3.5 h-3.5 mr-1.5" />
             Evidence
           </TabsTrigger>
           <TabsTrigger 
             value="artifacts" 
             className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-mono text-xs uppercase"
           >
             <Archive className="w-3.5 h-3.5 mr-1.5" />
             Artifacts
           </TabsTrigger>
           <TabsTrigger 
             value="logs" 
             className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-mono text-xs uppercase"
           >
             <Terminal className="w-3.5 h-3.5 mr-1.5" />
             Logs
           </TabsTrigger>
         </TabsList>
 
         {/* Evidence Tab */}
         <TabsContent value="evidence" className="flex-1 overflow-hidden m-0 mt-0">
           <ScrollArea className="h-full">
             <div className="p-4 space-y-4">
               {/* Correlation header */}
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <Hash className="w-3 h-3 text-muted-foreground" />
                     <span className="font-mono text-[10px] text-muted-foreground">CORRELATION ID</span>
                   </div>
                   <code className="text-xs font-mono text-foreground">{evidence.correlationId}</code>
                 </div>
                 <div className="text-right space-y-1">
                   <div className="flex items-center gap-2 justify-end">
                     <Clock className="w-3 h-3 text-muted-foreground" />
                     <span className="font-mono text-[10px] text-muted-foreground">TIMESTAMP</span>
                   </div>
                   <span className="text-xs font-mono text-foreground">{formatTimestamp(evidence.timestamp)}</span>
                 </div>
               </div>
 
               {/* Redacted fields notice */}
               {evidence.redactedFields.length > 0 && (
                 <div className="p-2 rounded-sm bg-severity-medium/10 border border-severity-medium/20">
                   <p className="text-[10px] font-mono text-severity-medium">
                     REDACTED: {evidence.redactedFields.join(', ')}
                   </p>
                 </div>
               )}
 
               {/* Request */}
               <div>
                 <div className="flex items-center justify-between mb-2">
                   <h4 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">REQUEST</h4>
                 </div>
                 <pre className="text-[11px] font-mono text-foreground/90 bg-muted/50 p-3 rounded-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                   {evidence.request}
                 </pre>
               </div>
 
               {/* Response */}
               <div>
                 <h4 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">RESPONSE</h4>
                 <pre className="text-[11px] font-mono text-foreground/90 bg-muted/50 p-3 rounded-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                   {evidence.response}
                 </pre>
               </div>
 
               {/* Copy button */}
               <Button
                 variant="outline"
                 size="sm"
                 onClick={copyEvidence}
                 className="w-full h-8 font-mono text-[10px] uppercase"
               >
                 {copied ? (
                   <>
                     <Check className="w-3 h-3 mr-1.5" />
                     Copied
                   </>
                 ) : (
                   <>
                     <Copy className="w-3 h-3 mr-1.5" />
                     Copy Redacted Evidence
                   </>
                 )}
               </Button>
             </div>
           </ScrollArea>
         </TabsContent>
 
         {/* Artifacts Tab */}
         <TabsContent value="artifacts" className="flex-1 overflow-hidden m-0 mt-0">
           <ScrollArea className="h-full">
             <div className="p-4 space-y-2">
               {artifacts.map((artifact) => {
                 const Icon = artifactIcons[artifact.type] || FileText;
                 return (
                   <button
                     key={artifact.id}
                     className="w-full flex items-center gap-3 p-3 rounded-sm bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                   >
                     <div className="p-2 rounded-sm bg-muted">
                       <Icon className="w-4 h-4 text-muted-foreground" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-mono text-xs text-foreground truncate">{artifact.name}</p>
                       <p className="font-mono text-[10px] text-muted-foreground">
                         {artifact.type.toUpperCase()} • {artifact.size}
                       </p>
                     </div>
                     <span className="font-mono text-[10px] text-muted-foreground">
                       {artifact.timestamp}
                     </span>
                   </button>
                 );
               })}
 
               {artifacts.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <Archive className="w-8 h-8 text-muted-foreground/50 mb-2" />
                   <p className="font-mono text-xs text-muted-foreground">NO ARTIFACTS RECORDED</p>
                 </div>
               )}
             </div>
           </ScrollArea>
         </TabsContent>
 
         {/* Logs Tab */}
         <TabsContent value="logs" className="flex-1 overflow-hidden m-0 mt-0">
           <ScrollArea className="h-full">
             <div className="p-4">
               <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                 {logs}
               </pre>
             </div>
           </ScrollArea>
         </TabsContent>
       </Tabs>
     </div>
   );
 }