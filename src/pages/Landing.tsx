import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Fingerprint, ShieldCheck, Activity, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteNav, SiteFooter, ScanTranscript } from '@/components/marketing';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAuthorizeScan = () => {
    if (user) {
      navigate('/dashboard/targets/new');
    } else {
      navigate('/auth', { state: { from: '/dashboard/targets/new' } });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Headline */}
            <div className="lg:col-span-5 pt-8">
              <h1 className="text-3xl md:text-4xl font-mono font-light tracking-tight leading-tight mb-6">
                Security and Load Testing — Without Guesswork or Risk
              </h1>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Analyze how your application behaves under attack and under load, 
                using safety-first scans designed for modern, AI-built software.
              </p>
              
              <p className="text-[11px] font-mono text-muted-foreground/80 mb-4">
                Read-only by default. Production-safe. Evidence-backed.
              </p>

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed mb-10">
                Currently in public beta. Core scanning and safety controls are production-ready. Advanced automation and integrations are rolling out incrementally.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="font-mono text-[11px] rounded-sm h-10 px-6 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  onClick={handleAuthorizeScan}
                >
                  AUTHORIZE A SCAN
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Link to="/safety">
                  <Button variant="outline" className="font-mono text-[11px] rounded-sm h-10 px-6 border-border hover:bg-muted/30 w-full sm:w-auto">
                    VIEW SAFETY CONTROLS
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Scan Transcript */}
            <div className="lg:col-span-7">
              <ScanTranscript />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STATEMENT */}
      <section className="py-8 px-6 border-y border-border/30 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono text-foreground/90">
            This tool performs both security analysis and load testing, sequenced and gated to avoid harming production systems.
          </p>
        </div>
      </section>

      {/* WHAT IT DOES - 3 sections, not card grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">CAPABILITIES</span>
            <h2 className="text-2xl font-mono font-light mt-2">What It Does</h2>
          </div>

          <div className="space-y-16">
            {/* Section 1 */}
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 md:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-mono text-primary tracking-wider">01</span>
                </div>
                <h3 className="text-sm font-mono tracking-wide">SECURITY ANALYSIS</h3>
              </div>
              <div className="col-span-12 md:col-span-9">
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                  Identify configuration flaws, authentication weaknesses, and unsafe exposure — using non-destructive checks tailored to modern web apps.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 md:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-mono text-primary tracking-wider">02</span>
                </div>
                <h3 className="text-sm font-mono tracking-wide">LOAD TESTING</h3>
              </div>
              <div className="col-span-12 md:col-span-9">
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                  Measure how your application behaves as real traffic increases — from baseline performance to controlled load ramps and recovery behavior.
                </p>
              </div>
            </div>

            {/* Section 3 - The Difference */}
            <div className="grid grid-cols-12 gap-8 items-start border-t border-border/30 pt-16">
              <div className="col-span-12 md:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 border border-primary/50 bg-primary/10 flex items-center justify-center rounded-sm">
                    <span className="text-primary text-xs font-mono">≠</span>
                  </div>
                </div>
                <h3 className="text-sm font-mono tracking-wide text-primary">THE DIFFERENCE</h3>
              </div>
              <div className="col-span-12 md:col-span-9">
                <p className="text-foreground text-sm leading-relaxed max-w-2xl">
                  Security findings directly inform load tests, so you see where risk and failure intersect — not two disconnected reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY REASSURANCE */}
      <section className="py-8 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            Beta status does not affect scan safety. All scans are read-only by default, rate-limited, environment-aware, and explicitly authorized by the operator.
          </p>
        </div>
      </section>

      {/* SAFETY-FIRST BLOCK */}
      <section className="py-20 px-6 border-t border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-12 md:col-span-4">
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest">TRUST MODEL</span>
              <h2 className="text-2xl font-mono font-light mt-2 mb-6">Built for Production Reality</h2>
            </div>

            <div className="col-span-12 md:col-span-8">
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                This is not a blind penetration test or an unlimited stress tool.
                Every scan follows explicit guardrails:
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Read-only by default',
                  'Rate-limited requests',
                  'Environment-aware testing',
                  'User-defined exclusions',
                  'Immediate halt controls',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-foreground font-mono">
                You decide how far a scan goes — nothing runs implicitly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Timeline */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">EXECUTION SEQUENCE</span>
            <h2 className="text-2xl font-mono font-light mt-2">How It Works</h2>
          </div>

          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/50" />

            <div className="space-y-10">
              {[
                { step: '01', title: 'Fingerprints your app', icon: Fingerprint },
                { step: '02', title: 'Identifies security-sensitive surfaces', icon: ShieldCheck },
                { step: '03', title: 'Applies load testing to those same surfaces', icon: Activity },
                { step: '04', title: 'Reports correlated failure modes', icon: FileText },
              ].map((item) => (
                <div key={item.step} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-[10px] font-mono text-primary">{item.step}</span>
                    <span className="text-sm font-mono text-foreground">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Example callout */}
            <div className="mt-12 ml-12 p-4 border border-border/50 bg-muted/20 rounded-sm max-w-xl">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">EXAMPLE OUTPUT</span>
              <p className="text-sm text-foreground mt-2 font-mono">
                "This endpoint slows under load — and also lacks rate limiting."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLEAR SCOPE STATEMENT */}
      <section className="py-20 px-6 border-t border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">BOUNDARIES</span>
            <h2 className="text-2xl font-mono font-light mt-2">Clear Scope. No Surprises.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Included */}
            <div className="border border-border/50 bg-background/50">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                <span className="text-[11px] font-mono tracking-wider text-primary">WHAT'S INCLUDED</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  'Security configuration analysis',
                  'Authentication & session safety checks',
                  'Safe input handling probes',
                  'Performance baselines',
                  'Controlled load ramps',
                  'Evidence-backed reports',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded */}
            <div className="border border-border/50 bg-background/50">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                <span className="text-[11px] font-mono tracking-wider text-muted-foreground">WHAT'S INTENTIONALLY EXCLUDED</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  'Destructive testing by default',
                  'Financial transaction testing',
                  'Unlimited load generation',
                  'Blind fuzzing on production',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground font-mono">
            This keeps your systems safe — and your results trustworthy.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-mono font-light mb-4">Ready to Analyze Your Application</h2>
          <p className="text-sm text-muted-foreground mb-10">
            Provide a URL. Authorize the scan. Receive a deterministic security 
            posture report with evidence-backed findings and remediation guidance.
          </p>
          <Button 
            className="font-mono text-[11px] rounded-sm h-11 px-8 bg-primary hover:bg-primary/90"
            onClick={handleAuthorizeScan}
          >
            AUTHORIZE A SCAN
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
