import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Settings, Save, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface UserConfig {
  maxRps: number;
  maxConcurrency: number;
  doNotTestPatterns: string;
}

const DEFAULT_CONFIG: UserConfig = {
  maxRps: 10,
  maxConcurrency: 2,
  doNotTestPatterns: '/admin/*\n/internal/*\n*.pdf',
};

export default function Config() {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved config from localStorage (per-user config)
  useEffect(() => {
    const saved = localStorage.getItem('vibesec_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch entitlements
  const { data: entitlements, isLoading: entLoading } = useQuery({
    queryKey: ['user-entitlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch usage
  const { data: usage } = useQuery({
    queryKey: ['monthly-usage'],
    queryFn: async () => {
      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_monthly')
        .select('scan_runs_created')
        .eq('period_start', periodStart.toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.scan_runs_created || 0;
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('vibesec_config', JSON.stringify(config));
      toast.success('Configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const scanLimit = entitlements?.scan_limit_per_month || 0;
  const scansRemaining = Math.max(0, scanLimit - (usage || 0));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="font-mono text-xl font-bold">CONFIG</h1>
      </div>

      {/* Safety Lock Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Safety Lock
          </CardTitle>
          <CardDescription>
            Default safety mode for new scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
              <Shield className="w-3 h-3" />
              READ-ONLY (Default)
            </Badge>
            <span className="text-sm text-muted-foreground">
              Advanced tests require explicit unlock per scan
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Default Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm">Default Settings</CardTitle>
          <CardDescription>
            Configure defaults for new projects and scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRps">Max RPS</Label>
              <Input
                id="maxRps"
                type="number"
                min={1}
                max={100}
                value={config.maxRps}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, maxRps: parseInt(e.target.value) || 10 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Requests per second limit for load tests
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxConcurrency">Max Concurrency</Label>
              <Input
                id="maxConcurrency"
                type="number"
                min={1}
                max={10}
                value={config.maxConcurrency}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, maxConcurrency: parseInt(e.target.value) || 2 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Concurrent requests during testing
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doNotTest">DO_NOT_TEST Patterns</Label>
            <Textarea
              id="doNotTest"
              rows={4}
              value={config.doNotTestPatterns}
              onChange={(e) =>
                setConfig((c) => ({ ...c, doNotTestPatterns: e.target.value }))
              }
              placeholder="/admin/*&#10;/internal/*&#10;*.pdf"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              One pattern per line. Routes matching these patterns will be skipped.
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            Save Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Plan & Entitlements */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Plan & Entitlements
          </CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {entLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : !entitlements ? (
            <div className="text-sm text-muted-foreground">
              <p>No active subscription.</p>
              <a href="/pricing" className="text-primary hover:underline">
                View pricing plans →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={entitlements.tier_name === 'production' ? 'default' : 'secondary'}
                >
                  {entitlements.tier_name?.toUpperCase() || 'NONE'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {entitlements.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Scans Remaining</p>
                  <p className="font-mono font-medium">
                    {scansRemaining} / {scanLimit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Retention</p>
                  <p className="font-mono font-medium">
                    {entitlements.retention_days} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Max Concurrency</p>
                  <p className="font-mono font-medium">{entitlements.max_concurrency}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {entitlements.allow_soak && (
                  <Badge variant="outline" className="text-xs">
                    Soak Tests
                  </Badge>
                )}
                {entitlements.allow_stress && (
                  <Badge variant="outline" className="text-xs">
                    Stress Tests
                  </Badge>
                )}
                {entitlements.priority_queue && (
                  <Badge variant="outline" className="text-xs">
                    Priority Queue
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
