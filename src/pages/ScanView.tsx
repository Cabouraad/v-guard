import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ScanProgress } from '@/components/scan/ScanProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { 
  Shield, 
  ExternalLink, 
  Pause, 
  Square, 
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react';
import type { ScanTask, ScanStatus } from '@/types/database';

// Simulated scan tasks for demo
const initialTasks: ScanTask[] = [
  { id: '1', scan_run_id: 'demo', task_type: 'fingerprint', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '2', scan_run_id: 'demo', task_type: 'tls_check', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '3', scan_run_id: 'demo', task_type: 'security_headers', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '4', scan_run_id: 'demo', task_type: 'cors_check', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '5', scan_run_id: 'demo', task_type: 'cookie_check', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '6', scan_run_id: 'demo', task_type: 'exposure_check', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '7', scan_run_id: 'demo', task_type: 'perf_baseline', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
  { id: '8', scan_run_id: 'demo', task_type: 'load_ramp_light', status: 'pending', retries: 0, max_retries: 3, output: {}, created_at: '' },
];

export default function ScanView() {
  const { scanId } = useParams();
  const [tasks, setTasks] = useState<ScanTask[]>(initialTasks);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('running');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scores, setScores] = useState({ security: 0, reliability: 0 });

  // Simulate scan progress
  useEffect(() => {
    if (scanStatus !== 'running') return;

    const interval = setInterval(() => {
      setTasks(prev => {
        const currentIndex = prev.findIndex(t => t.status === 'running');
        const nextPendingIndex = prev.findIndex(t => t.status === 'pending');

        if (currentIndex === -1 && nextPendingIndex === -1) {
          setScanStatus('completed');
          setScores({ security: 72, reliability: 85 });
          return prev;
        }

        return prev.map((task, i) => {
          if (i === currentIndex) {
            // Complete current task
            return { ...task, status: 'completed' as const };
          }
          if (i === nextPendingIndex && currentIndex === -1) {
            // Start next task
            return { ...task, status: 'running' as const };
          }
          if (i === nextPendingIndex + 1 && currentIndex !== -1) {
            // Already have a running task, skip
            return task;
          }
          return task;
        });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [scanStatus]);

  // Start first task
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTasks(prev => prev.map((t, i) => 
        i === 0 ? { ...t, status: 'running' as const } : t
      ));
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    if (scanStatus !== 'running') return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [scanStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Security Scan" 
        subtitle="my-saas-app • https://my-saas-app.lovable.app"
      />

      <div className="p-6 space-y-6">
        {/* Status Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <StatusBadge status={scanStatus} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTime(elapsedTime)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {scanStatus === 'running' && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1.5">
                      <Square className="w-3.5 h-3.5" />
                      Stop
                    </Button>
                  </>
                )}
                {scanStatus === 'completed' && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Rescan
                    </Button>
                    <Link to="/reports/demo">
                      <Button size="sm" className="gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        View Report
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Scan Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScanProgress tasks={tasks} />
              </CardContent>
            </Card>
          </div>

          {/* Scores (show when complete) */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                {scanStatus === 'completed' ? (
                  <ScoreRing score={scores.security} size="lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-muted animate-pulse flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Scanning...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reliability Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                {scanStatus === 'completed' ? (
                  <ScoreRing score={scores.reliability} size="lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-muted animate-pulse flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Pending...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
