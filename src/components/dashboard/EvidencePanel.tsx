 import { useState } from 'react';
 import { X, ChevronLeft, FileText, Terminal, Image as ImageIcon } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface EvidencePanelProps {
   isOpen: boolean;
   onClose: () => void;
 }
 
 type TabType = 'logs' | 'request' | 'screenshot';
 
 const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
   { id: 'logs', label: 'Logs', icon: Terminal },
   { id: 'request', label: 'Request', icon: FileText },
   { id: 'screenshot', label: 'Capture', icon: ImageIcon },
 ];
 
 const mockLogs = `[2026-02-05T14:23:01Z] GET /api/users/profile HTTP/1.1
 [2026-02-05T14:23:01Z] Response: 200 OK (45ms)
 [2026-02-05T14:23:01Z] Missing CSP header detected
 [2026-02-05T14:23:01Z] X-Frame-Options: not present
 [2026-02-05T14:23:02Z] CORS: Access-Control-Allow-Origin: *
 [2026-02-05T14:23:02Z] ⚠ Permissive CORS policy on auth endpoint
 [2026-02-05T14:23:03Z] Checking for exposed credentials...
 [2026-02-05T14:23:04Z] ⚠ Found: STRIPE_KEY in bundle
 [2026-02-05T14:23:04Z] Scan phase complete: security_headers`;
 
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
 
 export function EvidencePanel({ isOpen, onClose }: EvidencePanelProps) {
   const [activeTab, setActiveTab] = useState<TabType>('logs');
 
   return (
     <div className={cn(
       "fixed right-0 top-0 h-screen bg-background border-l border-border z-40 transition-all duration-300 flex flex-col",
       isOpen ? "w-96" : "w-0 overflow-hidden"
     )}>
       {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-border">
         <h3 className="font-mono text-sm text-foreground">EVIDENCE</h3>
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
       <div className="flex-1 overflow-auto p-4">
         {activeTab === 'logs' && (
           <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
             {mockLogs}
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
               <p className="text-xs">No capture available</p>
             </div>
           </div>
         )}
       </div>
 
       {/* Collapse trigger when closed */}
       {!isOpen && (
         <button
           onClick={onClose}
           className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full p-2 bg-muted border border-border rounded-l-sm text-muted-foreground hover:text-foreground transition-colors"
         >
           <ChevronLeft className="w-4 h-4" />
         </button>
       )}
     </div>
   );
 }