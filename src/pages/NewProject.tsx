import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Server,
  ChevronRight
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

      <form onSubmit={handleSubmit} className="h-[calc(100vh-80px)] flex">
        {/* Left Panel - Main Configuration */}
        <div className="flex-1 overflow-auto border-r border-border">
          <div className="p-6 space-y-8">
            {/* Section: Target Definition */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  TARGET DEFINITION
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      IDENTIFIER *
                    </Label>
                    <Input
                      id="name"
                      placeholder="api-gateway-prod"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      ENV CLASS *
                    </Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(val: EnvironmentType) => 
                        setFormData(prev => ({ ...prev, environment: val }))
                      }
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-severity-critical" />
                            <span className="font-mono text-xs">PROD</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="staging">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-severity-medium" />
                            <span className="font-mono text-xs">STAGING</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="development">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-status-success" />
                            <span className="font-mono text-xs">DEV</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    ENDPOINT *
                  </Label>
                  <Input
                    id="baseUrl"
                    type="url"
                    placeholder="https://your-app.lovable.app"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Section: Analysis Mode */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  ANALYSIS MODE
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    mode: 'url_only' as ScanMode,
                    title: 'Passive',
                    description: 'Read-only external probe',
                    icon: Globe,
                    recommended: true,
                  },
                  {
                    mode: 'authenticated' as ScanMode,
                    title: 'Authenticated',
                    description: 'Session-aware analysis',
                    icon: Lock,
                  },
                  {
                    mode: 'hybrid' as ScanMode,
                    title: 'Full Access',
                    description: 'Source + runtime (pending)',
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
                    className={`relative p-4 border text-left transition-all ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : formData.scanMode === option.mode
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                        DEFAULT
                      </Badge>
                    )}
                    <option.icon className={`w-5 h-5 mb-2 ${
                      formData.scanMode === option.mode 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} />
                    <h4 className="font-mono text-xs uppercase tracking-wider">{option.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            {/* Section: Safety Constraints */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-severity-medium" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  SAFETY CONSTRAINTS
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">MAX_RPS</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Rate ceiling with automatic backoff
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
                      className="w-16 text-center"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">RPS</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">DO_NOT_TEST</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/api/billing/*"
                      value={newRoute}
                      onChange={(e) => setNewRoute(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDoNotTestRoute())}
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
                          <code>{route}</code>
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
            </section>

            <Separator />

            {/* Section: API Endpoints */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  API ENDPOINTS
                </h2>
                <Badge variant="outline">OPTIONAL</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBasePath" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">API_BASE</Label>
                  <Input
                    id="apiBasePath"
                    placeholder="/api/v1"
                    value={formData.apiBasePath}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      apiBasePath: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graphqlEndpoint" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">GRAPHQL</Label>
                  <Input
                    id="graphqlEndpoint"
                    placeholder="/graphql"
                    value={formData.graphqlEndpoint}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      graphqlEndpoint: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel - Summary & Actions */}
        <div className="w-80 bg-muted/20 flex flex-col">
          <div className="p-6 flex-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              SCAN CONFIGURATION
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 border border-border bg-background">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">TARGET</div>
                <div className="text-sm font-mono text-foreground truncate">
                  {formData.name || '—'}
                </div>
              </div>
              
              <div className="p-3 border border-border bg-background">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">ENDPOINT</div>
                <div className="text-xs font-mono text-foreground truncate">
                  {formData.baseUrl || '—'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 border border-border bg-background">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">ENV</div>
                  <div className="text-xs font-mono text-foreground uppercase">
                    {formData.environment}
                  </div>
                </div>
                <div className="p-3 border border-border bg-background">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">MODE</div>
                  <div className="text-xs font-mono text-foreground uppercase">
                    {formData.scanMode.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="p-3 border border-border bg-background">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">RATE LIMIT</div>
                <div className="text-sm font-mono text-foreground">
                  {formData.maxRps} RPS
                </div>
              </div>

              {formData.doNotTestRoutes.length > 0 && (
                <div className="p-3 border border-border bg-background">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">EXCLUSIONS</div>
                  <div className="text-xs font-mono text-foreground">
                    {formData.doNotTestRoutes.length} routes
                  </div>
                </div>
              )}
            </div>

            {/* Production Warning */}
            {formData.environment === 'production' && (
              <div className="mt-6 p-3 bg-severity-medium/10 border border-severity-medium/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-severity-medium mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-mono text-severity-medium uppercase">
                      RESTRICTED MODE
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Limited to passive probes and light load ramp.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-border space-y-2">
            <Button type="submit" className="w-full gap-2">
              <Shield className="w-4 h-4" />
              AUTHORIZE & QUEUE
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full">
              ABORT
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
