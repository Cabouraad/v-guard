import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Clock,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ScanStatus } from '@/types/database';

// Demo data
const scans = [
  {
    id: '1',
    projectName: 'my-saas-app',
    url: 'https://my-saas-app.lovable.app',
    status: 'completed' as ScanStatus,
    mode: 'url_only',
    securityScore: 72,
    reliabilityScore: 85,
    findingsCount: 9,
    duration: '2m 34s',
    startedAt: '2024-01-15 14:30',
  },
  {
    id: '2',
    projectName: 'portfolio-site',
    url: 'https://portfolio.vercel.app',
    status: 'running' as ScanStatus,
    mode: 'url_only',
    securityScore: null,
    reliabilityScore: null,
    findingsCount: 3,
    duration: '1m 12s',
    startedAt: '2024-01-15 16:45',
  },
  {
    id: '3',
    projectName: 'ecommerce-store',
    url: 'https://store.replit.app',
    status: 'completed' as ScanStatus,
    mode: 'authenticated',
    securityScore: 89,
    reliabilityScore: 92,
    findingsCount: 3,
    duration: '4m 18s',
    startedAt: '2024-01-14 10:15',
  },
  {
    id: '4',
    projectName: 'my-saas-app',
    url: 'https://my-saas-app.lovable.app',
    status: 'failed' as ScanStatus,
    mode: 'url_only',
    securityScore: null,
    reliabilityScore: null,
    findingsCount: 0,
    duration: '0m 45s',
    startedAt: '2024-01-13 09:00',
    error: 'Connection timeout',
  },
];

export default function Scans() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Scan History" 
        subtitle="View all security scan runs"
      />

      <div className="p-6">
        <div className="space-y-4">
          {scans.map((scan) => (
            <Card 
              key={scan.id}
              className="hover:shadow-md transition-all duration-200"
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-6">
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{scan.projectName}</h3>
                      <StatusBadge status={scan.status} />
                      <Badge variant="outline" className="text-xs">
                        {scan.mode.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        {scan.url}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Started</p>
                      <p className="font-medium">{scan.startedAt}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Duration</p>
                      <p className="font-mono">{scan.duration}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Findings</p>
                      <p className="font-mono font-bold">{scan.findingsCount}</p>
                    </div>
                  </div>

                  {/* Scores */}
                  {scan.securityScore !== null && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Security</p>
                        <p className={`font-mono font-bold text-xl ${
                          scan.securityScore >= 80 ? 'text-status-success' :
                          scan.securityScore >= 60 ? 'text-severity-medium' :
                          'text-severity-critical'
                        }`}>
                          {scan.securityScore}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Reliability</p>
                        <p className={`font-mono font-bold text-xl ${
                          scan.reliabilityScore! >= 80 ? 'text-status-success' :
                          scan.reliabilityScore! >= 60 ? 'text-severity-medium' :
                          'text-severity-critical'
                        }`}>
                          {scan.reliabilityScore}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    {scan.status === 'completed' && (
                      <Link to={`/reports/${scan.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          View Report
                        </Button>
                      </Link>
                    )}
                    {scan.status === 'running' && (
                      <Link to={`/scans/${scan.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          View Progress
                        </Button>
                      </Link>
                    )}
                    {scan.status === 'failed' && (
                      <Button variant="outline" size="sm" disabled className="gap-1.5">
                        {scan.error}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
