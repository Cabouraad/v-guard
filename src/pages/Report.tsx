 import { Header } from '@/components/layout/Header';
 import { ScanSafetyBadge, useSafetyLock } from '@/components/safety';
 import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreRing } from '@/components/ui/score-ring';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { FindingCard } from '@/components/findings/FindingCard';
import { 
  Shield, 
  Activity, 
  Download, 
  Share2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { ScanFinding, SeverityLevel } from '@/types/database';

// Demo findings
const findings: ScanFinding[] = [
  {
    id: '1',
    scan_run_id: 'demo',
    category: 'headers',
    severity: 'critical',
    confidence: 'high',
    title: 'Missing Content Security Policy (CSP)',
    description: 'The application does not implement a Content Security Policy header, leaving it vulnerable to XSS attacks and data injection.',
    affected_targets: ['/'],
    evidence_redacted: 'Response headers:\nX-Frame-Options: SAMEORIGIN\nX-Content-Type-Options: nosniff\n// No CSP header found',
    repro_steps: [
      'Open browser developer tools',
      'Navigate to the application',
      'Check Network tab for response headers',
      'Observe missing Content-Security-Policy header'
    ],
    fix_recommendation: 'Add a strict Content-Security-Policy header to all responses. Start with a restrictive policy and gradually relax it as needed.',
    lovable_fix_prompt: 'Add a Content-Security-Policy header to my application. Use a strict default policy that only allows resources from the same origin, and allows inline scripts that are necessary for React to work. Configure this in my edge function or server responses.',
    endpoint: '/',
    created_at: '',
  },
  {
    id: '2',
    scan_run_id: 'demo',
    category: 'exposure',
    severity: 'high',
    confidence: 'high',
    title: 'Exposed API Keys in Client Bundle',
    description: 'Private API keys are visible in the client-side JavaScript bundle, potentially allowing unauthorized access to backend services.',
    affected_targets: ['/assets/index.js'],
    evidence_redacted: 'Found in bundle:\nconst OPENAI_KEY = "sk-****redacted****"\nconst STRIPE_SECRET = "sk_live_****redacted****"',
    repro_steps: [
      'Open browser developer tools',
      'Go to Sources tab',
      'Search for "sk-" or "api_key" in bundled JavaScript',
      'Observe exposed credentials'
    ],
    fix_recommendation: 'Move all secret API keys to server-side code (edge functions). Use environment variables and never import secrets in client-side code.',
    lovable_fix_prompt: 'Move my API keys from client-side code to edge functions. Create a secure edge function that handles the API calls server-side and update my frontend to call this edge function instead of directly using the API keys.',
    endpoint: '/assets/index.js',
    created_at: '',
  },
  {
    id: '3',
    scan_run_id: 'demo',
    category: 'cors',
    severity: 'high',
    confidence: 'medium',
    title: 'Overly Permissive CORS Configuration',
    description: 'The API allows requests from any origin (*), which could enable cross-site request forgery attacks.',
    affected_targets: ['/api/*'],
    evidence_redacted: 'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE',
    fix_recommendation: 'Restrict CORS to specific trusted origins. Use a whitelist of allowed domains instead of the wildcard.',
    lovable_fix_prompt: 'Update my edge function CORS configuration to only allow requests from my specific frontend domain instead of using the wildcard (*). Add proper origin validation.',
    endpoint: '/api/*',
    created_at: '',
  },
  {
    id: '4',
    scan_run_id: 'demo',
    category: 'headers',
    severity: 'medium',
    confidence: 'high',
    title: 'Missing X-Frame-Options Header',
    description: 'The application may be vulnerable to clickjacking attacks as X-Frame-Options is not set.',
    affected_targets: ['/'],
    fix_recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN header to prevent the page from being embedded in iframes.',
    lovable_fix_prompt: 'Add X-Frame-Options header set to DENY to all my application responses to prevent clickjacking attacks.',
    endpoint: '/',
    created_at: '',
  },
  {
    id: '5',
    scan_run_id: 'demo',
    category: 'cookies',
    severity: 'medium',
    confidence: 'high',
    title: 'Session Cookie Missing Secure Flag',
    description: 'The session cookie is not marked as Secure, allowing it to be transmitted over unencrypted connections.',
    affected_targets: ['/'],
    fix_recommendation: 'Set the Secure flag on all session cookies to ensure they are only sent over HTTPS.',
    endpoint: '/',
    created_at: '',
  },
  {
    id: '6',
    scan_run_id: 'demo',
    category: 'performance',
    severity: 'low',
    confidence: 'medium',
    title: 'Slow Time to First Byte (TTFB)',
    description: 'The initial server response takes longer than recommended (>500ms), which may impact user experience.',
    affected_targets: ['/'],
    fix_recommendation: 'Optimize server-side rendering, enable caching, or consider using a CDN to reduce TTFB.',
    endpoint: '/',
    created_at: '',
  },
];

// Demo performance data
const performanceData = [
  { time: '0s', latency: 120, rps: 0 },
  { time: '10s', latency: 135, rps: 5 },
  { time: '20s', latency: 142, rps: 8 },
  { time: '30s', latency: 156, rps: 10 },
  { time: '40s', latency: 189, rps: 10 },
  { time: '50s', latency: 201, rps: 10 },
  { time: '60s', latency: 178, rps: 10 },
  { time: '70s', latency: 165, rps: 8 },
  { time: '80s', latency: 145, rps: 5 },
  { time: '90s', latency: 130, rps: 0 },
];

 export default function Report() {
   const { state: safetyState, getAuditString } = useSafetyLock();
   const auditString = getAuditString();
 
  const severityCounts: Record<string, number> = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
    not_tested: findings.filter(f => f.severity === 'not_tested').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Security Report" 
        subtitle="my-saas-app • Completed Jan 15, 2024"
      />

      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

         {/* Executive Summary */}
         <Card>
           <CardHeader>
             <div className="flex items-center justify-between">
               <CardTitle>Executive Summary</CardTitle>
               <ScanSafetyBadge 
                 isLocked={safetyState.isLocked}
                 approvedForProduction={safetyState.approvedForProduction}
                 enabledModules={safetyState.enabledModules}
               />
             </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <ScoreRing score={72} label="Security Score" size="lg" />
              </div>
              <div className="flex flex-col items-center">
                <ScoreRing score={85} label="Reliability Score" size="lg" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-severity-medium/10 border border-severity-medium/30">
                  <AlertTriangle className="w-5 h-5 text-severity-medium" />
                  <span className="font-medium text-severity-medium">Needs Work</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Production Readiness</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Findings Summary</h4>
                <div className="space-y-2">
                  {(['critical', 'high', 'medium', 'low'] as SeverityLevel[]).map((sev) => (
                    <div key={sev} className="flex items-center justify-between">
                      <SeverityBadge severity={sev} size="sm" />
                      <span className="font-mono font-bold">{severityCounts[sev]}</span>
                    </div>
                  ))}
               </div>
               
               {/* Audit Note */}
               <div className="col-span-full mt-4 pt-4 border-t border-border">
                 <div className="flex items-center gap-2">
                   <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                     Audit Record:
                   </span>
                   <Badge variant="outline" className="font-mono text-[10px]">
                     {auditString}
                   </Badge>
                 </div>
               </div>
             </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="findings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="findings" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Findings ({findings.length})
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="tested" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              What Was Tested
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="space-y-4">
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Load Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">p50 Latency</p>
                    <p className="text-2xl font-mono font-bold">156ms</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">p95 Latency</p>
                    <p className="text-2xl font-mono font-bold">245ms</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">p99 Latency</p>
                    <p className="text-2xl font-mono font-bold">312ms</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-mono font-bold text-status-success">0.2%</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="latency" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)"
                        name="Latency (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tested">
            <Card>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-4">
                      <CheckCircle2 className="w-5 h-5 text-status-success" />
                      Tested
                    </h3>
                    <ul className="space-y-2">
                      {[
                        'TLS/SSL configuration',
                        'Security headers presence',
                        'CORS configuration',
                        'Cookie security flags',
                        'Client bundle exposure',
                        'Baseline performance',
                        'Light load ramp (10 RPS)',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-status-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-4">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      Not Tested
                    </h3>
                    <ul className="space-y-2">
                      {[
                        { item: 'Authentication flows', reason: 'No credentials provided' },
                        { item: 'GraphQL introspection', reason: 'No endpoint specified' },
                        { item: 'Stress/soak tests', reason: 'Production environment' },
                        { item: 'IDOR vulnerabilities', reason: 'Requires authenticated mode' },
                      ].map(({ item, reason }) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span>{item}</span>
                            <p className="text-xs text-muted-foreground">{reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}