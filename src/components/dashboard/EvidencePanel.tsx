 import { useState } from 'react';
 import { X, FileText, Terminal, Image as ImageIcon } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface EvidencePanelProps {
   isOpen?: boolean;
   onClose: () => void;
   filterModule?: string;
 }
 
 type TabType = 'logs' | 'request' | 'screenshot';
 
 const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
  { id: 'logs', label: 'LOG', icon: Terminal },
  { id: 'request', label: 'REQ/RES', icon: FileText },
  { id: 'screenshot', label: 'CAPTURE', icon: ImageIcon },
 ];
 
 const moduleLogs: Record<string, string> = {
   fingerprint: `[14:23:01] DNS lookup: app.example.com → 192.168.1.100
 [14:23:01] TLS handshake: TLS 1.3, valid certificate
 [14:23:01] Server: cloudflare
 [14:23:01] Tech detected: React, Vite, Tailwind CSS
 [14:23:02] Source maps: exposed at /assets/*.js.map
 [14:23:02] Fingerprint phase complete`,
   security_safe: `[14:23:03] GET /api/users/profile HTTP/1.1
 [14:23:03] Response: 200 OK (45ms)
 [14:23:03] ⚠ Missing CSP header
 [14:23:03] ⚠ X-Frame-Options: not present
 [14:23:04] CORS: Access-Control-Allow-Origin: *
 [14:23:04] ⚠ Permissive CORS on auth endpoint
 [14:23:05] Cookie: session_id missing Secure flag
 [14:23:05] ⚠ Found: STRIPE_KEY in bundle
 [14:23:06] Security safe checks complete`,
   perf_baseline: `[14:23:10] Baseline sampling started
 [14:23:10] Request 1: 142ms (cold)
 [14:23:11] Request 2: 89ms
 [14:23:12] Request 3: 76ms
 [14:23:13] Request 4: 81ms
 [14:23:14] Request 5: 78ms
 [14:23:14] Baseline: p50=81ms p95=142ms
 [14:23:14] TTFB: 45ms average
 [14:23:14] Baseline phase complete`,
   load_ramp: `[14:23:20] Load ramp started (light mode)
 [14:23:20] Ramp: 1 RPS → target 5 RPS
 [14:23:25] Step 1: 1 RPS, p50=85ms, errors=0%
 [14:23:30] Step 2: 2 RPS, p50=88ms, errors=0%
 [14:23:35] Step 3: 3 RPS, p50=92ms, errors=0%
 [14:23:40] Step 4: 4 RPS, p50=105ms, errors=0%
 [14:23:45] Step 5: 5 RPS, p50=118ms, errors=0.2%
 [14:23:50] Cooldown: returning to baseline
 [14:23:55] Load ramp complete`,
   report: `[14:24:00] Aggregating findings...
 [14:24:01] Security findings: 6 total
 [14:24:01] - Critical: 1, High: 2, Medium: 2, Low: 1
 [14:24:02] Computing scores...
 [14:24:02] Security Score: 72/100
 [14:24:02] Reliability Score: 85/100
 [14:24:03] Generating report model...
 [14:24:03] Report compile complete`,
 };
 
 const defaultLogs = `[14:23:01] Waiting for module selection...
 [14:23:01] Click a timeline step to view logs`;
 
 const mockRequest = `GET /api/users/profile HTTP/1.1
 Host: app.example.com
 Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 Accept: application/json
 Origin: https://malicious-site.com
 
 ---
 
 HTTP/1.1 200 OK
 Content-Type: application/json
 Access-Control-Allow-Origin: *
 Access-Control-Allow-Credentials: true
 
 {
   "id": "usr_123",
   "email": "user@example.com",
   "role": "admin"
 }`;
 
 export function EvidencePanel({ isOpen = true, onClose, filterModule }: EvidencePanelProps) {
   const [activeTab, setActiveTab] = useState<TabType>('logs');
 
   return (
     <div className={cn(
       "fixed right-0 top-0 h-screen bg-background border-l border-border z-40 transition-all duration-300 flex flex-col",
       isOpen ? "w-96" : "w-0 overflow-hidden"
     )}>
 {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
         <div>
           <h3 className="font-mono text-xs text-foreground uppercase tracking-wider">EVIDENCE</h3>
           {filterModule && (
             <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
               Module: {filterModule.toUpperCase().replace('_', ' ')}
             </p>
           )}
         </div>
         <button
           onClick={onClose}
           className="p-1 text-muted-foreground hover:text-foreground transition-colors"
         >
           <X className="w-4 h-4" />
         </button>
       </div>
 
       {/* Tabs */}
       <div className="flex border-b border-border">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono transition-colors",
               activeTab === tab.id 
                 ? "text-foreground border-b-2 border-primary bg-muted/30" 
                 : "text-muted-foreground hover:text-foreground"
             )}
           >
             <tab.icon className="w-3 h-3" />
             {tab.label}
           </button>
         ))}
       </div>
 
 {/* Content */}
       <div className="flex-1 overflow-auto p-4 bg-background">
         {activeTab === 'logs' && (
           <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
             {filterModule 
               ? (moduleLogs[filterModule] || moduleLogs['security_safe'] || defaultLogs)
               : defaultLogs
             }
           </pre>
         )}
         {activeTab === 'request' && (
           <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
             {mockRequest}
           </pre>
         )}
         {activeTab === 'screenshot' && (
           <div className="flex items-center justify-center h-full text-muted-foreground">
             <div className="text-center">
               <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono">NO CAPTURE RECORDED</p>
             </div>
           </div>
         )}
       </div>
 
 </div>
   );
 }