import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/stat-card';
import { ScoreRing } from '@/components/ui/score-ring';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  ArrowRight,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SeverityLevel, ScanStatus } from '@/types/database';

// Demo data for MVP
const recentScans = [
  {
    id: '1',
    projectName: 'my-saas-app',
    url: 'https://my-saas-app.lovable.app',
    status: 'completed' as ScanStatus,
    securityScore: 72,
    findings: { critical: 1, high: 3, medium: 5 },
    completedAt: '2 hours ago',
  },
  {
    id: '2',
    projectName: 'portfolio-site',
    url: 'https://portfolio.vercel.app',
    status: 'running' as ScanStatus,
    securityScore: null,
    findings: { critical: 0, high: 1, medium: 2 },
    completedAt: null,
  },
  {
    id: '3',
    projectName: 'ecommerce-store',
    url: 'https://store.replit.app',
    status: 'completed' as ScanStatus,
    securityScore: 89,
    findings: { critical: 0, high: 0, medium: 3 },
    completedAt: '1 day ago',
  },
];

const topFindings = [
  {
    severity: 'critical' as SeverityLevel,
    title: 'Missing Content Security Policy',
    project: 'my-saas-app',
  },
  {
    severity: 'high' as SeverityLevel,
    title: 'Exposed API keys in client bundle',
    project: 'my-saas-app',
  },
  {
    severity: 'high' as SeverityLevel,
    title: 'CORS allows any origin',
    project: 'my-saas-app',
  },
  {
    severity: 'medium' as SeverityLevel,
    title: 'Missing X-Frame-Options header',
    project: 'ecommerce-store',
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Dashboard" 
        subtitle="Monitor your application security posture"
      />

      <div className="p-6 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Projects"
            value="3"
            subtitle="Active monitoring"
            icon={Target}
            variant="primary"
          />
          <StatCard
            title="Total Scans"
            value="12"
            subtitle="This month"
            icon={Activity}
            trend={{ value: 20, isPositive: true }}
          />
          <StatCard
            title="Critical Issues"
            value="1"
            subtitle="Requires immediate action"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Avg. Response Time"
            value="245ms"
            subtitle="p95 latency"
            icon={Zap}
            variant="success"
          />
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Cards */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-4">
                <ScoreRing score={72} label="Security Score" size="lg" />
                <div className="h-24 w-px bg-border" />
                <ScoreRing score={85} label="Reliability Score" size="lg" />
                <div className="h-24 w-px bg-border" />
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-severity-medium/10 border border-severity-medium/30">
                    <span className="w-2 h-2 rounded-full bg-severity-medium" />
                    <span className="text-sm font-medium text-severity-medium">
                      Needs Work
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Production Readiness
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Findings by Severity</h4>
                </div>
                <div className="flex items-center gap-6">
                  {[
                    { severity: 'critical', count: 1 },
                    { severity: 'high', count: 4 },
                    { severity: 'medium', count: 10 },
                    { severity: 'low', count: 8 },
                    { severity: 'info', count: 15 },
                  ].map(({ severity, count }) => (
                    <div key={severity} className="flex items-center gap-2">
                      <SeverityBadge severity={severity as SeverityLevel} />
                      <span className="font-mono font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/projects/new" className="block">
                <Button className="w-full justify-between" variant="default">
                  New Security Scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button className="w-full justify-between" variant="secondary">
                  View All Reports
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/scans" className="block">
                <Button className="w-full justify-between" variant="outline">
                  Scan History
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans & Top Findings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Scans */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Scans
              </CardTitle>
              <Link to="/scans">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentScans.map((scan) => (
                <div 
                  key={scan.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {scan.projectName}
                      </h4>
                      <StatusBadge status={scan.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {scan.url}
                    </p>
                  </div>
                  
                  {scan.securityScore !== null && (
                    <div className="text-right">
                      <span className={`font-mono font-bold ${
                        scan.securityScore >= 80 ? 'text-status-success' :
                        scan.securityScore >= 60 ? 'text-severity-medium' :
                        'text-severity-critical'
                      }`}>
                        {scan.securityScore}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {scan.completedAt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Findings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-severity-high" />
                Top Findings
              </CardTitle>
              <Link to="/reports">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {topFindings.map((finding, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <SeverityBadge severity={finding.severity} showIcon />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{finding.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {finding.project}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
