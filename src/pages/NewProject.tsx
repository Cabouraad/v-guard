import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Shield, 
  Zap, 
  AlertTriangle, 
  Plus, 
  X,
  Info,
  Lock,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import type { EnvironmentType, ScanMode } from '@/types/database';

export default function NewProject() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    environment: 'production' as EnvironmentType,
    scanMode: 'url_only' as ScanMode,
    apiBasePath: '',
    graphqlEndpoint: '',
    maxRps: 10,
    doNotTestRoutes: [] as string[],
    enableAuth: false,
    authToken: '',
  });

  const [newRoute, setNewRoute] = useState('');

  const addDoNotTestRoute = () => {
    if (newRoute && !formData.doNotTestRoutes.includes(newRoute)) {
      setFormData(prev => ({
        ...prev,
        doNotTestRoutes: [...prev.doNotTestRoutes, newRoute]
      }));
      setNewRoute('');
    }
  };

  const removeDoNotTestRoute = (route: string) => {
    setFormData(prev => ({
      ...prev,
      doNotTestRoutes: prev.doNotTestRoutes.filter(r => r !== route)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.baseUrl) {
      toast.error('Required fields missing: Target identifier and URL required to authorize scan.');
      return;
    }

    // Validate URL
    try {
      new URL(formData.baseUrl);
    } catch {
      toast.error('Invalid target URL: Must be a valid HTTP/HTTPS endpoint.');
      return;
    }

    toast.success('Target authorized. Scan queued for execution.');
    navigate('/scans/demo');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Authorize Target" 
        subtitle="Configure scan parameters and safety constraints"
      />

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Target Definition
              </CardTitle>
              <CardDescription>
                Specify target endpoint and operating environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Target Identifier *</Label>
                  <Input
                    id="name"
                    placeholder="api-gateway-prod"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment Class *</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(val: EnvironmentType) => 
                      setFormData(prev => ({ ...prev, environment: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-severity-critical" />
                          PROD (restricted)
                        </div>
                      </SelectItem>
                      <SelectItem value="staging">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-severity-medium" />
                          STAGING
                        </div>
                      </SelectItem>
                      <SelectItem value="development">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-success" />
                          DEV (full access)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl">Target Endpoint *</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://your-app.lovable.app"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Accepts any publicly accessible HTTP/HTTPS endpoint.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Analysis Mode
              </CardTitle>
              <CardDescription>
                Select probe depth and access level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    mode: 'url_only' as ScanMode,
                    title: 'Passive',
                    description: 'Read-only external probe. No authentication required.',
                    icon: Globe,
                    recommended: true,
                  },
                  {
                    mode: 'authenticated' as ScanMode,
                    title: 'Authenticated',
                    description: 'Session-aware analysis. Requires test credentials.',
                    icon: Lock,
                  },
                  {
                    mode: 'hybrid' as ScanMode,
                    title: 'Full Access',
                    description: 'Source + runtime analysis. Pending implementation.',
                    icon: Server,
                    disabled: true,
                  },
                ].map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      scanMode: option.mode,
                      enableAuth: option.mode === 'authenticated'
                    }))}
                    className={`relative p-4 rounded-sm border-2 text-left transition-all ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : formData.scanMode === option.mode
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-primary font-mono text-[10px]">
                        DEFAULT
                      </Badge>
                    )}
                    <option.icon className={`w-8 h-8 mb-3 ${
                      formData.scanMode === option.mode 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} />
                    <h4 className="font-mono text-sm">{option.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operational Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-severity-medium" />
                Safety Constraints
              </CardTitle>
              <CardDescription>
                Define rate limits and exclusion zones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-mono text-xs">MAX_RPS</Label>
                    <p className="text-xs text-muted-foreground">
                      Rate ceiling. Automatic backoff if target degrades.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.maxRps}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxRps: parseInt(e.target.value) || 10 
                      }))}
                      className="w-20 text-center font-mono"
                    />
                    <span className="text-sm text-muted-foreground">RPS</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-mono text-xs">DO_NOT_TEST</Label>
                  <p className="text-xs text-muted-foreground">
                    Excluded endpoints. Scanner will never probe these paths.
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="/api/billing/*"
                      value={newRoute}
                      onChange={(e) => setNewRoute(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDoNotTestRoute())}
                      className="font-mono text-xs"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addDoNotTestRoute}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.doNotTestRoutes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.doNotTestRoutes.map((route) => (
                        <Badge 
                          key={route} 
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          <code className="text-xs">{route}</code>
                          <button
                            type="button"
                            onClick={() => removeDoNotTestRoute(route)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Production Constraint Notice */}
              {formData.environment === 'production' && (
                <div className="flex items-start gap-3 p-4 rounded-sm bg-severity-medium/10 border border-severity-medium/30">
                  <Info className="w-5 h-5 text-severity-medium mt-0.5" />
                  <div>
                    <p className="font-mono text-xs text-severity-medium">
                      PROD ENVIRONMENT — RESTRICTED MODE
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analysis limited to passive probes and light load ramp (max 5 RPS, 3 concurrent). 
                      Soak and stress tests require STAGING or explicit authorization.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                API Endpoints
                <Badge variant="outline" className="font-mono text-[10px]">OPTIONAL</Badge>
              </CardTitle>
              <CardDescription>
                Specify API paths for targeted endpoint analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBasePath" className="font-mono text-xs">API_BASE</Label>
                  <Input
                    id="apiBasePath"
                    placeholder="/api/v1"
                    value={formData.apiBasePath}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      apiBasePath: e.target.value 
                    }))}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graphqlEndpoint" className="font-mono text-xs">GRAPHQL_ENDPOINT</Label>
                  <Input
                    id="graphqlEndpoint"
                    placeholder="/graphql"
                    value={formData.graphqlEndpoint}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      graphqlEndpoint: e.target.value 
                    }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="font-mono text-xs">
              ABORT
            </Button>
            <Button type="submit" className="gap-2 font-mono text-xs">
              <Shield className="w-4 h-4" />
              AUTHORIZE & QUEUE SCAN
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
