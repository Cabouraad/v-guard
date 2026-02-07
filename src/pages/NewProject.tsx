import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubscriptionBanner } from '@/components/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
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
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { EnvironmentType, ScanMode } from '@/types/database';

export default function NewProject() {
  const navigate = useNavigate();
  const { subscription, loading: subLoading, error: subError, createCheckout, openPortal, checkSubscription } = useSubscription();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    environment: 'production' as EnvironmentType,
    scanMode: 'url_only' as ScanMode,
    apiBasePath: '',
    graphqlEndpoint: '',
    maxRps: 10,
    doNotTestRoutes: [] as string[],
    enableSoak: false,
    enableStress: false,
    approveForProduction: false,
  });

  const [newRoute, setNewRoute] = useState('');

  // Reset gated controls if subscription changes to non-production
  useEffect(() => {
    if (!subscription.allow_soak) {
      setFormData(prev => ({ ...prev, enableSoak: false }));
    }
    if (!subscription.allow_stress) {
      setFormData(prev => ({ ...prev, enableStress: false }));
    }
  }, [subscription.allow_soak, subscription.allow_stress]);

  const isProductionTier = subscription.tier === 'production';
  const canSubmit = subscription.subscribed && subscription.scans_remaining > 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
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

    if (!canSubmit) {
      toast.error('Authorization blocked: Active subscription required or scan limit reached for this period.');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create the project in the database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          base_url: formData.baseUrl,
          environment: formData.environment,
          api_base_path: formData.apiBasePath || null,
          graphql_endpoint: formData.graphqlEndpoint || null,
          max_rps: formData.maxRps,
          do_not_test_routes: formData.doNotTestRoutes,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (projectError || !project) {
        throw new Error(projectError?.message || 'Failed to create target');
      }

      // Step 2: Call create-scan-run with flat fields matching edge function contract
      const { data, error } = await supabase.functions.invoke('create-scan-run', {
        body: {
          projectId: project.id,
          mode: formData.scanMode,
          maxRps: formData.maxRps,
          maxConcurrency: 2,
          enableSoak: formData.enableSoak,
          enableStress: formData.enableStress,
          doNotTestPatterns: formData.doNotTestRoutes,
          userApprovedProduction: formData.approveForProduction,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        setServerError(data.error);
        toast.error(data.message || data.error);
        return;
      }

      // Refresh subscription to update usage
      await checkSubscription();

      toast.success('Target authorized. Scan queued for execution.');
      navigate(`/dashboard/scans/${data.scanRunId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create scan';
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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
                     <div className="flex items-center gap-1.5">
                       <Label htmlFor="environment" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                         ENV CLASS *
                       </Label>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                         </TooltipTrigger>
                         <TooltipContent side="top" className="font-mono text-xs max-w-xs">
                           <p>Production scans are limited by default. Heavier testing requires explicit approval.</p>
                         </TooltipContent>
                       </Tooltip>
                     </div>
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

            {/* Section: Advanced Testing (Gated) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  ADVANCED TESTING
                </h2>
                {!isProductionTier && (
                  <Badge variant="outline" className="text-severity-medium border-severity-medium">
                    PRODUCTION TIER
                  </Badge>
                )}
              </div>

              <TooltipProvider>
                <div className="space-y-3">
                  <div className="p-2.5 rounded-sm bg-muted/50 border border-border">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Soak and stress tests are gated to prevent accidental production impact.
                      </span>
                    </div>
                  </div>
                  {/* Soak Test Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={!isProductionTier}
                        onClick={() => setFormData(prev => ({ ...prev, enableSoak: !prev.enableSoak }))}
                        className={`w-full p-3 border text-left transition-all ${
                          !isProductionTier
                            ? 'opacity-50 cursor-not-allowed border-border'
                            : formData.enableSoak
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-mono text-xs uppercase tracking-wider">SOAK TEST</h4>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Extended duration stability testing
                            </p>
                          </div>
                          <Badge variant={formData.enableSoak ? "default" : "secondary"} className="text-[10px]">
                            {formData.enableSoak ? 'ON' : 'OFF'}
                          </Badge>
                        </div>
                      </button>
                    </TooltipTrigger>
                     <TooltipContent className="font-mono text-xs max-w-xs">
                       {!isProductionTier ? (
                         <p>Soak tests require Production-tier authorization. Extended load can degrade live systems.</p>
                       ) : (
                         <p>Extended-duration load test. Monitors for memory leaks and resource degradation.</p>
                       )}
                     </TooltipContent>
                   </Tooltip>

                   {/* Stress Test Toggle */}
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <button
                         type="button"
                         disabled={!isProductionTier}
                         onClick={() => setFormData(prev => ({ ...prev, enableStress: !prev.enableStress }))}
                         className={`w-full p-3 border text-left transition-all ${
                           !isProductionTier
                             ? 'opacity-50 cursor-not-allowed border-border'
                             : formData.enableStress
                               ? 'border-primary bg-primary/10'
                               : 'border-border hover:border-primary/50'
                         }`}
                       >
                         <div className="flex items-center justify-between">
                           <div>
                             <h4 className="font-mono text-xs uppercase tracking-wider">STRESS TEST</h4>
                             <p className="text-[10px] text-muted-foreground mt-1">
                               High-load breaking point analysis
                             </p>
                           </div>
                           <Badge variant={formData.enableStress ? "default" : "secondary"} className="text-[10px]">
                             {formData.enableStress ? 'ON' : 'OFF'}
                           </Badge>
                         </div>
                       </button>
                     </TooltipTrigger>
                     <TooltipContent className="font-mono text-xs max-w-xs">
                       {!isProductionTier ? (
                         <p>Stress tests require Production-tier authorization. Pushes systems beyond rated capacity.</p>
                       ) : (
                         <p>Exceeds normal capacity to identify breaking points and recovery behavior.</p>
                       )}
                     </TooltipContent>
                   </Tooltip>

                  {/* Production Approval Toggle */}
                  {formData.environment === 'production' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={!isProductionTier}
                          onClick={() => setFormData(prev => ({ ...prev, approveForProduction: !prev.approveForProduction }))}
                          className={`w-full p-3 border text-left transition-all ${
                            !isProductionTier
                              ? 'opacity-50 cursor-not-allowed border-border'
                              : formData.approveForProduction
                                ? 'border-severity-critical bg-severity-critical/10'
                                : 'border-border hover:border-severity-critical/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-mono text-xs uppercase tracking-wider text-severity-critical">APPROVE PRODUCTION</h4>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                I confirm this target is authorized for active testing
                              </p>
                            </div>
                            <Badge 
                              variant={formData.approveForProduction ? "destructive" : "secondary"} 
                              className="text-[10px]"
                            >
                              {formData.approveForProduction ? 'APPROVED' : 'NOT SET'}
                            </Badge>
                          </div>
                        </button>
                      </TooltipTrigger>
                     <TooltipContent className="font-mono text-xs max-w-xs">
                       {!isProductionTier ? (
                         <p>Production approval requires Production-tier authorization. Active tests may affect live users.</p>
                       ) : (
                         <p>Confirms this target is authorized for active testing against a production environment.</p>
                       )}
                     </TooltipContent>
                   </Tooltip>
                  )}
                </div>
              </TooltipProvider>
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
          <div className="p-6 flex-1 overflow-auto">
            {/* Subscription Banner */}
            <div className="mb-6">
              <SubscriptionBanner
                subscription={subscription}
                loading={subLoading}
                error={subError}
                onRetry={checkSubscription}
                onUpgrade={() => createCheckout('production')}
                onManageBilling={openPortal}
              />
            </div>

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
          <div className="p-6 border-t border-border space-y-3">
            {/* Server Error Display */}
            {serverError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-destructive uppercase text-[10px]">SERVER ERROR</p>
                    <p className="text-muted-foreground mt-1">{serverError}</p>
                  </div>
                </div>
              </div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="submit" 
                    className="w-full gap-2"
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AUTHORIZING...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        AUTHORIZE & QUEUE
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-xs max-w-xs">
                  <p>Scans run only after explicit authorization and within defined safety limits.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

             {!subscription.subscribed && !subscription.is_test_user && (
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={() => createCheckout('standard')} 
                 className="w-full gap-2"
               >
                 <Zap className="w-4 h-4" />
                 ACTIVATE SUBSCRIPTION
               </Button>
             )}

            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full">
              ABORT
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
