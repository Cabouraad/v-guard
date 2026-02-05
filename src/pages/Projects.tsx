import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Globe, 
  ExternalLink,
  Trash2,
  Play,
  ChevronRight,
  ChevronDown,
  Settings2,
  Crosshair
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Project = Tables<'projects'>;

const environmentColors: Record<string, string> = {
  production: 'text-severity-critical',
  staging: 'text-severity-medium',
  development: 'text-status-success',
  prod: 'text-severity-critical',
  dev: 'text-status-success',
};

const environmentLabels: Record<string, string> = {
  production: 'PROD',
  staging: 'STG',
  development: 'DEV',
  prod: 'PROD',
  dev: 'DEV',
};

export default function Projects() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Targets" 
        subtitle="Authorized scan targets and their current status"
      />

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">
              {isLoading ? '—' : `${projects?.length ?? 0} TARGETS REGISTERED`}
            </span>
          </div>
          <Link to="/dashboard/targets/new">
            <Button size="sm" className="gap-2 font-mono text-xs">
              <Plus className="w-4 h-4" />
              AUTHORIZE TARGET
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !hasProjects ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-sm border border-dashed border-border flex items-center justify-center mb-6">
                <Crosshair className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h2 className="font-mono text-sm text-foreground mb-2">
                NO TARGETS REGISTERED
              </h2>
              <p className="font-mono text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                Authorize a target URL to begin security and performance scanning. 
                Each target defines an endpoint, environment, and rate limit for the probe.
              </p>
              <Link to="/dashboard/targets/new">
                <Button size="sm" className="gap-2 font-mono text-xs">
                  <Plus className="w-4 h-4" />
                  AUTHORIZE FIRST TARGET
                </Button>
              </Link>
            </div>
          ) : (
            /* Table */
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b border-border z-10">
                <tr className="text-left">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ENV</th>
                  <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">TARGET</th>
                  <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">ENDPOINT</th>
                  <th className="px-4 py-3 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">MAX RPS</th>
                  <th className="w-24 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const isExpanded = expandedId === project.id;
                  return (
                    <TargetRow 
                      key={project.id}
                      project={project}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpanded(project.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with add action */}
        {hasProjects && (
          <div className="px-6 py-4 border-t border-border">
            <Link to="/dashboard/targets/new">
              <button className="w-full py-3 border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
                AUTHORIZE NEW TARGET
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface TargetRowProps {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
}

function TargetRow({ project, isExpanded, onToggle }: TargetRowProps) {
  return (
    <>
      <tr 
        onClick={onToggle}
        className={cn(
          "border-b border-border cursor-pointer transition-colors",
          isExpanded ? "bg-muted/30" : "hover:bg-muted/10"
        )}
      >
        <td className="px-4 py-4">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </td>
        <td className="px-4 py-4">
          <span className={cn(
            "text-[10px] font-mono font-bold uppercase",
            environmentColors[project.environment] || 'text-muted-foreground'
          )}>
            {environmentLabels[project.environment] || project.environment.toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm font-mono font-medium text-foreground">
            {project.name}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-xs font-mono text-muted-foreground">
            {project.base_url}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-xs font-mono text-muted-foreground">
            {project.max_rps ?? '—'} RPS
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-1">
            <Link to={`/dashboard/scans/${project.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Play className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </td>
      </tr>
      
      {/* Expanded row content */}
      {isExpanded && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={6} className="px-4 py-4">
            <div className="pl-8 grid grid-cols-3 gap-6">
              {/* Configuration */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  CONFIGURATION
                </h4>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-foreground">
                    {project.max_rps ?? '—'} RPS MAX
                  </div>
                  {project.api_base_path && (
                    <div className="text-xs font-mono text-muted-foreground">
                      API: {project.api_base_path}
                    </div>
                  )}
                  {project.do_not_test_routes?.length ? (
                    <div className="text-xs font-mono text-muted-foreground">
                      {project.do_not_test_routes.length} EXCLUDED ROUTES
                    </div>
                  ) : null}
                </div>
              </div>

              {/* External link */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  EXTERNAL
                </h4>
                <a 
                  href={project.base_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Target
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Link to={`/dashboard/scans/${project.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="gap-1.5 font-mono text-[10px]">
                    <Play className="w-3 h-3" />
                    QUEUE SCAN
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" className="gap-1.5 font-mono text-[10px]">
                  <Settings2 className="w-3 h-3" />
                  CONFIGURE
                </Button>
                <Button size="sm" variant="ghost" className="text-severity-critical hover:text-severity-critical font-mono text-[10px]">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
