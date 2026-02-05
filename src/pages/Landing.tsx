 import { useState, useEffect } from 'react';
 import { Link } from 'react-router-dom';
 import { Shield, Terminal, Activity, Lock, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 // Simulated live metrics for hero
 function useSimulatedMetrics() {
   const [metrics, setMetrics] = useState({
     scansCompleted: 12847,
     findingsDetected: 3219,
     avgResponseMs: 47,
     uptime: 99.97,
   });
 
   useEffect(() => {
     const interval = setInterval(() => {
       setMetrics(prev => ({
         scansCompleted: prev.scansCompleted + Math.floor(Math.random() * 3),
         findingsDetected: prev.findingsDetected + (Math.random() > 0.7 ? 1 : 0),
         avgResponseMs: 45 + Math.floor(Math.random() * 8),
         uptime: 99.97,
       }));
     }, 2000);
     return () => clearInterval(interval);
   }, []);
 
   return metrics;
 }
 
 export default function Landing() {
   const metrics = useSimulatedMetrics();
   const [terminalLine, setTerminalLine] = useState(0);
 
   const terminalOutput = [
     '$ vibe-sec analyze --target https://app.example.com',
     '[00:00:01] Initializing passive reconnaissance...',
     '[00:00:03] TLS configuration: Grade A',
     '[00:00:05] Security headers: 7/9 implemented',
     '[00:00:08] CORS policy: Restrictive ✓',
     '[00:00:12] Load baseline: p95 = 142ms @ 10 RPS',
     '[00:00:18] Ramp test: Stable through 50 concurrent',
     '[00:00:24] Analysis complete. 2 findings. Report ready.',
   ];
 
   useEffect(() => {
     if (terminalLine < terminalOutput.length) {
       const timeout = setTimeout(() => {
         setTerminalLine(prev => prev + 1);
       }, 800);
       return () => clearTimeout(timeout);
     }
   }, [terminalLine, terminalOutput.length]);
 
   return (
     <div className="min-h-screen bg-background text-foreground">
       {/* Navigation */}
       <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
         <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Shield className="w-5 h-5 text-primary" />
             <span className="font-mono text-sm tracking-tight">VIBE_SEC</span>
           </div>
           <div className="flex items-center gap-6">
             <a href="#process" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">PROCESS</a>
             <a href="#guarantees" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">GUARANTEES</a>
             <a href="#specs" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">SPECS</a>
             <Link to="/projects/new">
               <Button variant="outline" size="sm" className="font-mono text-xs rounded-sm h-8 border-primary/50 hover:border-primary hover:bg-primary/10">
                 AUTHORIZE SCAN
               </Button>
             </Link>
           </div>
         </div>
       </nav>
 
       {/* Hero - Asymmetric Layout */}
       <section className="pt-24 pb-20 px-6">
         <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-12 gap-8 items-start">
             {/* Left: Headline & Metrics */}
             <div className="col-span-5 pt-12">
               <div className="mb-6">
                 <span className="inline-block px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono tracking-widest rounded-sm">
                   SECURITY + LOAD ANALYSIS
                 </span>
               </div>
               
               <h1 className="text-4xl font-mono font-light tracking-tight leading-tight mb-6">
                 Automated security posture assessment for{' '}
                 <span className="text-primary">vibe-coded</span> applications
               </h1>
               
               <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-md">
                 Deterministic analysis of TLS, headers, authentication flows, 
                 and load resilience. No exploitation. No data exfiltration. 
                 Evidence-backed findings with actionable remediation.
               </p>
 
               {/* Live Metrics Grid */}
               <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="p-4 border border-border/50 bg-card/30">
                   <div className="text-2xl font-mono text-foreground">{metrics.scansCompleted.toLocaleString()}</div>
                   <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">SCANS COMPLETED</div>
                 </div>
                 <div className="p-4 border border-border/50 bg-card/30">
                   <div className="text-2xl font-mono text-foreground">{metrics.findingsDetected.toLocaleString()}</div>
                   <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">FINDINGS DETECTED</div>
                 </div>
                 <div className="p-4 border border-border/50 bg-card/30">
                   <div className="text-2xl font-mono text-foreground">{metrics.avgResponseMs}ms</div>
                   <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">AVG RESPONSE</div>
                 </div>
                 <div className="p-4 border border-border/50 bg-card/30">
                   <div className="text-2xl font-mono text-foreground">{metrics.uptime}%</div>
                   <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">PLATFORM UPTIME</div>
                 </div>
               </div>
 
               <Link to="/projects/new">
                 <Button className="font-mono text-xs rounded-sm h-10 px-6 bg-primary hover:bg-primary/90">
                   AUTHORIZE SCAN
                   <ChevronRight className="w-4 h-4 ml-1" />
                 </Button>
               </Link>
             </div>
 
             {/* Right: Terminal Simulation */}
             <div className="col-span-7 pt-4">
               <div className="border border-border/50 bg-card/20 rounded-sm overflow-hidden">
                 <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/30">
                   <div className="w-2 h-2 rounded-full bg-severity-critical/60" />
                   <div className="w-2 h-2 rounded-full bg-severity-medium/60" />
                   <div className="w-2 h-2 rounded-full bg-status-success/60" />
                   <span className="text-[10px] font-mono text-muted-foreground ml-2">scan_output.log</span>
                 </div>
                 <div className="p-4 font-mono text-xs leading-relaxed min-h-[320px]">
                   {terminalOutput.slice(0, terminalLine).map((line, i) => (
                     <div 
                       key={i} 
                       className={`mb-1 ${
                         line.includes('✓') ? 'text-status-success' :
                         line.includes('complete') ? 'text-primary' :
                         line.startsWith('$') ? 'text-foreground' :
                         'text-muted-foreground'
                       }`}
                     >
                       {line}
                     </div>
                   ))}
                   {terminalLine < terminalOutput.length && (
                     <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Process Timeline - Linear Flow */}
       <section id="process" className="py-24 px-6 border-t border-border/30">
         <div className="max-w-7xl mx-auto">
           <div className="mb-16">
             <span className="text-[10px] font-mono text-muted-foreground tracking-widest">ANALYSIS SEQUENCE</span>
             <h2 className="text-2xl font-mono font-light mt-2">How the scan executes</h2>
           </div>
 
           <div className="relative">
             {/* Vertical line */}
             <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/50" />
 
             {/* Timeline items */}
             <div className="space-y-12">
               {[
                 {
                   phase: '01',
                   title: 'PASSIVE RECONNAISSANCE',
                   duration: '~5 seconds',
                   description: 'TLS certificate analysis, security header enumeration, technology fingerprinting. No traffic generated beyond standard HTTP.',
                   icon: Terminal,
                 },
                 {
                   phase: '02',
                   title: 'CONFIGURATION AUDIT',
                   duration: '~15 seconds',
                   description: 'CORS policy validation, cookie attribute inspection, CSP directive parsing. Read-only analysis of response characteristics.',
                   icon: Lock,
                 },
                 {
                   phase: '03',
                   title: 'BASELINE MEASUREMENT',
                   duration: '~30 seconds',
                   description: 'Response time profiling at minimal load. Establishes p50/p95/p99 latency metrics. Rate-limited to 10 RPS.',
                   icon: Activity,
                 },
                 {
                   phase: '04',
                   title: 'CONTROLLED RAMP',
                   duration: '~2 minutes',
                   description: 'Gradual concurrency increase with automatic backoff. Identifies breaking points without causing sustained degradation.',
                   icon: Zap,
                 },
                 {
                   phase: '05',
                   title: 'REPORT SYNTHESIS',
                   duration: '~10 seconds',
                   description: 'Finding aggregation, severity classification, remediation prompt generation. Executive summary with tested/not-tested matrix.',
                   icon: Shield,
                 },
               ].map((item, index) => (
                 <div key={index} className="relative pl-12">
                   <div className="absolute left-0 w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
                     <item.icon className="w-4 h-4 text-primary" />
                   </div>
                   <div className="flex items-baseline gap-4 mb-2">
                     <span className="text-[10px] font-mono text-primary">{item.phase}</span>
                     <h3 className="text-sm font-mono tracking-wide">{item.title}</h3>
                     <span className="text-[10px] font-mono text-muted-foreground">{item.duration}</span>
                   </div>
                   <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                     {item.description}
                   </p>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </section>
 
       {/* Safety Guarantees */}
       <section id="guarantees" className="py-24 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-12 gap-12">
             <div className="col-span-4">
               <span className="text-[10px] font-mono text-muted-foreground tracking-widest">OPERATIONAL CONSTRAINTS</span>
               <h2 className="text-2xl font-mono font-light mt-2 mb-6">What this tool will never do</h2>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Safety is non-negotiable. The scanner operates within strict boundaries 
                 that cannot be overridden. These constraints are enforced at the 
                 orchestration layer, not merely documented.
               </p>
             </div>
 
             <div className="col-span-8">
               <div className="grid grid-cols-2 gap-6">
                 {[
                   {
                     constraint: 'No payload injection',
                     detail: 'Will not submit SQL, XSS, or other attack payloads. Detection is inference-based only.',
                   },
                   {
                     constraint: 'No credential testing',
                     detail: 'Will not attempt password guessing, brute force, or credential stuffing.',
                   },
                   {
                     constraint: 'No data exfiltration',
                     detail: 'Response bodies are analyzed locally. No user data is transmitted or stored.',
                   },
                   {
                     constraint: 'No persistent state mutation',
                     detail: 'All requests are idempotent. No writes, deletes, or state changes executed.',
                   },
                   {
                     constraint: 'No denial of service',
                     detail: 'Automatic backoff when error rates exceed threshold. Hard RPS ceiling enforced.',
                   },
                   {
                     constraint: 'No third-party scanning',
                     detail: 'Targets must be explicitly authorized. Domain ownership verification required.',
                   },
                 ].map((item, index) => (
                   <div key={index} className="p-5 border border-border/50 bg-background/50">
                     <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-3 h-3 text-severity-medium" />
                       <span className="text-xs font-mono text-foreground">{item.constraint}</span>
                     </div>
                     <p className="text-xs text-muted-foreground leading-relaxed">
                       {item.detail}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Technical Specifications */}
       <section id="specs" className="py-24 px-6 border-t border-border/30">
         <div className="max-w-7xl mx-auto">
           <div className="mb-16">
             <span className="text-[10px] font-mono text-muted-foreground tracking-widest">TECHNICAL PARAMETERS</span>
             <h2 className="text-2xl font-mono font-light mt-2">Analysis specifications</h2>
           </div>
 
           <div className="grid grid-cols-3 gap-px bg-border/30">
             {[
               { label: 'TLS Versions', value: '1.2, 1.3', unit: 'supported' },
               { label: 'Max Concurrency', value: '100', unit: 'connections' },
               { label: 'Rate Limit', value: '50', unit: 'RPS ceiling' },
               { label: 'Timeout', value: '30', unit: 'seconds' },
               { label: 'Backoff Threshold', value: '5%', unit: 'error rate' },
               { label: 'Report Formats', value: 'JSON, HTML', unit: 'output' },
               { label: 'Latency Percentiles', value: 'p50, p95, p99', unit: 'tracked' },
               { label: 'Header Checks', value: '12', unit: 'security headers' },
               { label: 'Evidence Retention', value: '30', unit: 'days' },
             ].map((spec, index) => (
               <div key={index} className="p-6 bg-background">
                 <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">{spec.label}</div>
                 <div className="flex items-baseline gap-2">
                   <span className="text-xl font-mono text-foreground">{spec.value}</span>
                   <span className="text-[10px] font-mono text-muted-foreground">{spec.unit}</span>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Final CTA */}
       <section className="py-24 px-6 border-t border-border/30">
         <div className="max-w-3xl mx-auto text-center">
           <h2 className="text-2xl font-mono font-light mb-4">Ready to analyze your application</h2>
           <p className="text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
             Provide a URL. Authorize the scan. Receive a deterministic security 
             posture report with evidence-backed findings and remediation guidance.
           </p>
           <Link to="/projects/new">
             <Button className="font-mono text-xs rounded-sm h-12 px-8 bg-primary hover:bg-primary/90">
               AUTHORIZE ANALYSIS
               <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
           <p className="text-[10px] font-mono text-muted-foreground mt-6">
             No account required for initial scan. Results delivered in under 5 minutes.
           </p>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="py-8 px-6 border-t border-border/30">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Shield className="w-4 h-4 text-muted-foreground" />
             <span className="text-[10px] font-mono text-muted-foreground">VIBE_SEC v2.0</span>
           </div>
           <div className="text-[10px] font-mono text-muted-foreground">
             Deterministic security analysis for modern applications
           </div>
         </div>
       </footer>
     </div>
   );
 }