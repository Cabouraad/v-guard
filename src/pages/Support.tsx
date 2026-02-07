import { SiteNav, SiteFooter } from '@/components/marketing';
import { Shield, Lock, Unlock, ShieldOff, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const sections = [
  {
    id: 'authorization',
    icon: Shield,
    title: 'HOW AUTHORIZATION WORKS',
    paragraphs: [
      'No scan runs without explicit operator authorization. You define the target URL, environment class, rate limits, and exclusion patterns before any request is sent.',
      'Each scan is bound to the parameters you set. The system enforces a maximum request rate, honors all DO_NOT_TEST route patterns, and will not exceed the concurrency ceiling defined by your subscription tier.',
      'Authorization is per-scan, not per-account. Completing one scan does not pre-authorize subsequent scans against the same or different targets.',
    ],
  },
  {
    id: 'safety-mode',
    icon: Lock,
    title: 'WHAT SAFETY MODE GUARANTEES',
    paragraphs: [
      'All scans start in READ-ONLY mode. In this state, the scanner performs only passive, non-destructive operations: DNS resolution, TLS certificate inspection, HTTP header analysis, CORS configuration checks, cookie flag validation, and static exposure detection.',
      'Load testing in READ-ONLY mode is limited to light baseline sampling at a maximum of 5 requests per second. No authentication credentials are tested. No mutations or state changes are performed against the target.',
      'An automatic circuit breaker halts any scan if error rates exceed 25%, timeout rates exceed 15%, 10 consecutive failures occur, or p95 latency exceeds 30 seconds.',
    ],
  },
  {
    id: 'advanced-mode',
    icon: Unlock,
    title: 'WHAT ADVANCED MODE ALLOWS (AND REQUIRES)',
    paragraphs: [
      'ADVANCED mode unlocks four additional modules: Soak Testing (extended-duration load), Stress Testing (capacity beyond rated limits), Auth Probing (session and credential analysis), and Injection Tests (SQL, XSS, command injection vectors).',
      'Each module must be individually selected. Enabling ADVANCED mode requires: selecting a target environment class, acknowledging operational risk, and choosing specific modules. Production environments require a separate explicit approval checkbox.',
      'ADVANCED mode is restricted to the Production subscription tier ($199/month). The safety lock state and all enabled modules are recorded in the scan audit trail and included in the final report.',
    ],
  },
  {
    id: 'consent',
    icon: ShieldOff,
    title: 'WHAT V-GUARD WILL NEVER DO WITHOUT CONSENT',
    paragraphs: [
      'V-Guard will never send requests to endpoints listed in your DO_NOT_TEST patterns. It will never exceed your configured rate limit. It will never perform destructive operations while Safety Lock is in READ-ONLY mode.',
      'No data is shared with third parties. Scan results, evidence artifacts, and logs are accessible only to the authenticated account that initiated the scan. Sensitive values detected in scan evidence (API keys, tokens, credentials) are redacted before storage and display.',
      'V-Guard does not modify, write to, or delete anything on your target systems. Even in ADVANCED mode, injection tests use detection techniques — they identify vulnerability indicators without exploiting them.',
    ],
  },
  {
    id: 'retention',
    icon: Trash2,
    title: 'ARTIFACT RETENTION & DELETION',
    paragraphs: [
      'Scan artifacts (HAR captures, screenshots, trace files, performance recordings) and findings are retained according to your subscription tier: 30 days for Standard, 180 days for Production.',
      'After the retention period, artifacts are permanently deleted. Scan metadata (timestamps, scores, status) is retained indefinitely for audit trail continuity.',
      'You may request early deletion of all scan data associated with your account by contacting support at feedback@vibesec.dev. Deletion requests are processed within 72 hours and are irreversible.',
    ],
  },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              REFERENCE
            </span>
            <h1 className="text-2xl font-mono font-light mt-2 mb-4">
              Operational Reference
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Factual documentation of how V-Guard operates, what it guarantees,
              and what it will never do without explicit authorization.
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-4 border border-border rounded-sm bg-card/30">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-3">
              CONTENTS
            </p>
            <ol className="space-y-1.5">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <span className="text-primary/60 w-4">{String(i + 1).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-border bg-card flex items-center justify-center rounded-sm">
                    <section.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-primary/60 tracking-wider">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-sm font-mono tracking-wide">
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 pl-11">
                  {section.paragraphs.map((p, j) => (
                    <p
                      key={j}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>

                {i < sections.length - 1 && <Separator className="mt-12" />}
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 p-4 border border-border rounded-sm bg-card/30">
            <p className="text-xs font-mono text-muted-foreground">
              Questions or deletion requests:{' '}
              <a
                href="mailto:feedback@vibesec.dev"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                feedback@vibesec.dev
              </a>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}