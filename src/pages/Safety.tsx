 import { Link } from 'react-router-dom';
 import { 
   ChevronRight, 
   Lock, 
   Unlock, 
   Server, 
   Gauge, 
   ShieldOff, 
   OctagonX, 
   FileSearch 
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { SiteNav, SiteFooter } from '@/components/marketing';
 
 export default function Safety() {
   return (
     <div className="min-h-screen bg-background text-foreground">
       <SiteNav />
 
       {/* Hero */}
       <section className="pt-24 pb-16 px-6">
         <div className="max-w-4xl mx-auto">
           <span className="text-[10px] font-mono text-muted-foreground tracking-widest">OPERATIONAL GUARDRAILS</span>
           <h1 className="text-3xl md:text-4xl font-mono font-light tracking-tight leading-tight mt-3 mb-6">
             Safety Controls
           </h1>
           <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
             Every scan operates within explicit boundaries. These are not suggestions — 
             they are enforced constraints in the execution layer. You maintain full control 
             over what runs and when it stops.
           </p>
         </div>
       </section>
 
       {/* Safety Lock */}
       <section className="py-16 px-6 border-t border-border/30">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
               <Lock className="w-4 h-4 text-primary" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">SAFETY LOCK</h2>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* READ-ONLY Mode */}
             <div className="border border-primary/50 bg-primary/5 p-5">
               <div className="flex items-center gap-2 mb-3">
                 <Lock className="w-4 h-4 text-primary" />
                 <span className="text-sm font-mono text-primary">READ-ONLY (DEFAULT)</span>
               </div>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 All requests are idempotent GET operations. No form submissions, 
                 no state mutations, no writes. Safe for production by design.
               </p>
             </div>
 
             {/* ADVANCED Mode */}
             <div className="border border-border/50 bg-card/30 p-5">
               <div className="flex items-center gap-2 mb-3">
                 <Unlock className="w-4 h-4 text-muted-foreground" />
                 <span className="text-sm font-mono text-muted-foreground">ADVANCED (EXPLICIT)</span>
               </div>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Enables deeper probes requiring POST/PUT. Only available with explicit 
                 operator approval and environment gating. Never runs implicitly.
               </p>
             </div>
           </div>
         </div>
       </section>
 
       {/* Environment Gating */}
       <section className="py-16 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
               <Server className="w-4 h-4 text-primary" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">ENVIRONMENT GATING</h2>
           </div>
 
           <div className="space-y-4">
             <div className="flex items-start gap-4 p-4 border border-border/30 bg-background/50">
               <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded-sm">STAGING</span>
               <div>
                 <p className="text-sm text-foreground mb-1">Recommended for full analysis</p>
                 <p className="text-xs text-muted-foreground">All scan types available. Load ramps, soak tests, and recovery probes execute without restriction.</p>
               </div>
             </div>
 
             <div className="flex items-start gap-4 p-4 border border-border/30 bg-background/50">
               <span className="text-[10px] font-mono text-status-warning bg-status-warning/10 px-2 py-1 rounded-sm">PRODUCTION</span>
               <div>
                 <p className="text-sm text-foreground mb-1">Requires explicit approval</p>
                 <p className="text-xs text-muted-foreground">Read-only fingerprinting and safe security checks by default. Load testing requires operator sign-off and uses conservative limits.</p>
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Rate Limits + Circuit Breaker */}
       <section className="py-16 px-6 border-t border-border/30">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
               <Gauge className="w-4 h-4 text-primary" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">RATE LIMITS + CIRCUIT BREAKER</h2>
           </div>
 
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             {[
               { label: 'Global Max RPS', value: '50' },
               { label: 'Default Concurrency', value: '3' },
               { label: 'Error Threshold', value: '5%' },
               { label: 'Timeout Threshold', value: '10%' },
             ].map((item, i) => (
               <div key={i} className="p-4 border border-border/50 bg-card/30">
                 <div className="text-xl font-mono text-foreground">{item.value}</div>
                 <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">{item.label}</div>
               </div>
             ))}
           </div>
 
           <p className="text-sm text-muted-foreground leading-relaxed">
             When error or timeout rates exceed thresholds, the circuit breaker triggers an automatic halt. 
             No manual intervention required — the scan stops safely before causing degradation.
           </p>
         </div>
       </section>
 
       {/* DO_NOT_TEST Routes */}
       <section className="py-16 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
               <ShieldOff className="w-4 h-4 text-primary" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">DO_NOT_TEST ROUTES</h2>
           </div>
 
           <div className="border border-border/50 bg-background/50 p-4 font-mono text-xs mb-4">
             <div className="text-muted-foreground mb-2"># Example exclusions</div>
             <div className="text-foreground">/api/billing/*</div>
             <div className="text-foreground">/api/admin/*</div>
             <div className="text-foreground">/webhooks/*</div>
             <div className="text-foreground">/internal/*</div>
           </div>
 
           <p className="text-sm text-muted-foreground leading-relaxed">
             Define endpoints that should never be touched. These are absolute exclusions — 
             the orchestrator enforces them regardless of scan mode or operator permissions.
           </p>
         </div>
       </section>
 
       {/* Kill Switch */}
       <section className="py-16 px-6 border-t border-border/30">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-destructive/50 bg-destructive/10 flex items-center justify-center rounded-sm">
               <OctagonX className="w-4 h-4 text-destructive" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">HALT SCAN (KILL SWITCH)</h2>
           </div>
 
           <p className="text-sm text-muted-foreground leading-relaxed mb-4">
             At any point during execution, the operator can trigger an immediate halt. 
             The system stops at the next safe checkpoint:
           </p>
 
           <div className="space-y-2 mb-6">
             {[
               'In-flight requests complete (no orphaned connections)',
               'Current task marked as canceled',
               'Remaining queue cleared',
               'Audit log entry written with halt reason, timestamp, and stage',
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className="w-1 h-1 bg-destructive rounded-full" />
                 <span className="text-sm text-foreground">{item}</span>
               </div>
             ))}
           </div>
 
           <p className="text-sm text-foreground font-mono">
             Halts are permanent — the scan cannot be resumed, only restarted.
           </p>
         </div>
       </section>
 
       {/* Evidence & Audit Trail */}
       <section className="py-16 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
               <FileSearch className="w-4 h-4 text-primary" />
             </div>
             <h2 className="text-lg font-mono tracking-wide">EVIDENCE & AUDIT TRAIL</h2>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <h3 className="text-sm font-mono text-foreground mb-3">Correlation IDs</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Every request carries a unique trace ID. Findings link directly to 
                 the evidence that produced them — no ambiguity about what was tested.
               </p>
             </div>
             <div>
               <h3 className="text-sm font-mono text-foreground mb-3">Redacted Artifacts</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Response bodies are analyzed locally. Sensitive data is redacted before 
                 storage. Artifacts include headers, timing, and status — not payloads.
               </p>
             </div>
           </div>
         </div>
       </section>
 
       {/* CTA */}
       <section className="py-20 px-6 border-t border-border/30">
         <div className="max-w-2xl mx-auto text-center">
           <h2 className="text-2xl font-mono font-light mb-4">Ready to Run a Safe Scan</h2>
           <p className="text-sm text-muted-foreground mb-10">
             All safety controls are enabled by default. You choose what to unlock.
           </p>
           <Link to="/projects/new">
             <Button className="font-mono text-[11px] rounded-sm h-11 px-8 bg-primary hover:bg-primary/90">
               AUTHORIZE A SCAN
               <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
         </div>
       </section>
 
       <SiteFooter />
     </div>
   );
 }