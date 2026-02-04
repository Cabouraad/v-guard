import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Globe, 
  Calendar, 
  Activity,
  ExternalLink,
  MoreVertical,
  Trash2,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EnvironmentType } from '@/types/database';

// Demo data
const projects = [
  {
    id: '1',
    name: 'my-saas-app',
    baseUrl: 'https://my-saas-app.lovable.app',
    environment: 'production' as EnvironmentType,
    lastScanAt: '2 hours ago',
    totalScans: 5,
    lastScore: 72,
  },
  {
    id: '2',
    name: 'portfolio-site',
    baseUrl: 'https://portfolio.vercel.app',
    environment: 'production' as EnvironmentType,
    lastScanAt: 'In progress',
    totalScans: 3,
    lastScore: null,
  },
  {
    id: '3',
    name: 'ecommerce-store',
    baseUrl: 'https://store.replit.app',
    environment: 'staging' as EnvironmentType,
    lastScanAt: '1 day ago',
    totalScans: 8,
    lastScore: 89,
  },
];

const environmentColors = {
  production: 'bg-severity-critical/20 text-severity-critical border-severity-critical/30',
  staging: 'bg-severity-medium/20 text-severity-medium border-severity-medium/30',
  development: 'bg-status-success/20 text-status-success border-status-success/30',
};

export default function Projects() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Projects" 
        subtitle="Manage your security-monitored applications"
      />

      <div className="p-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {projects.length} projects configured
          </p>
          <Link to="/projects/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] mt-1 ${environmentColors[project.environment]}`}
                      >
                        {project.environment}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Play className="w-4 h-4 mr-2" />
                        Run Scan
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open URL
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{project.baseUrl}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {project.lastScanAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {project.totalScans} scans
                    </span>
                  </div>

                  {project.lastScore !== null && (
                    <div className={`font-mono font-bold text-lg ${
                      project.lastScore >= 80 ? 'text-status-success' :
                      project.lastScore >= 60 ? 'text-severity-medium' :
                      'text-severity-critical'
                    }`}>
                      {project.lastScore}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Project Card */}
          <Link to="/projects/new">
            <Card className="h-full min-h-[200px] border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Add New Project</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
