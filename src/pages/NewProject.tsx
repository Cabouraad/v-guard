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
      toast.error('Please fill in required fields');
      return;
    }

    // Validate URL
    try {
      new URL(formData.baseUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    toast.success('Project created! Starting scan...');
    navigate('/scans/demo');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="New Project" 
        subtitle="Configure your security scan"
      />

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Target Application
              </CardTitle>
              <CardDescription>
                Enter the URL of the application you want to scan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="my-awesome-app"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment *</Label>
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
                          Production
                        </div>
                      </SelectItem>
                      <SelectItem value="staging">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-severity-medium" />
                          Staging
                        </div>
                      </SelectItem>
                      <SelectItem value="development">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-success" />
                          Development
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL *</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://your-app.lovable.app"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Works with any public URL: Lovable, Vercel, Netlify, Replit, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scan Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Scan Mode
              </CardTitle>
              <CardDescription>
                Choose how deep the scanner should analyze your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    mode: 'url_only' as ScanMode,
                    title: 'URL Only',
                    description: 'Black-box scan for any public app. Safest mode.',
                    icon: Globe,
                    recommended: true,
                  },
                  {
                    mode: 'authenticated' as ScanMode,
                    title: 'Authenticated',
                    description: 'Deeper analysis with test credentials.',
                    icon: Lock,
                  },
                  {
                    mode: 'hybrid' as ScanMode,
                    title: 'Hybrid',
                    description: 'Full analysis with repo access (coming soon).',
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
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : formData.scanMode === option.mode
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-primary">
                        Recommended
                      </Badge>
                    )}
                    <option.icon className={`w-8 h-8 mb-3 ${
                      formData.scanMode === option.mode 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} />
                    <h4 className="font-semibold">{option.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Safety Guardrails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-severity-medium" />
                Safety Guardrails
              </CardTitle>
              <CardDescription>
                Configure rate limits and excluded routes for safe scanning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Max Requests Per Second</Label>
                    <p className="text-xs text-muted-foreground">
                      Higher values may trigger rate limiting on your target
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
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">RPS</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Do Not Test Routes</Label>
                  <p className="text-xs text-muted-foreground">
                    Add routes that should never be tested (e.g., /api/billing, /admin/delete)
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="/api/billing/*"
                      value={newRoute}
                      onChange={(e) => setNewRoute(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDoNotTestRoute())}
                    />
                    <Button type="button" variant="outline" onClick={addDoNotTestRoute}>
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

              {/* Production Warning */}
              {formData.environment === 'production' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-severity-medium/10 border border-severity-medium/30">
                  <Info className="w-5 h-5 text-severity-medium mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-severity-medium">
                      Production Environment Detected
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scans will use read-only checks and light load testing only. 
                      Switch to Staging for full stress/soak tests.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional: API & GraphQL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                API Configuration
                <Badge variant="outline">Optional</Badge>
              </CardTitle>
              <CardDescription>
                Provide additional endpoints for deeper API analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBasePath">API Base Path</Label>
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
                  <Label htmlFor="graphqlEndpoint">GraphQL Endpoint</Label>
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
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Shield className="w-4 h-4" />
              Create Project & Start Scan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
