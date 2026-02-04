-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Environment enum
CREATE TYPE environment_type AS ENUM ('production', 'staging', 'development');

-- Scan mode enum
CREATE TYPE scan_mode AS ENUM ('url_only', 'authenticated', 'hybrid');

-- Scan status enum
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');

-- Task status enum
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- Severity enum
CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- Confidence enum
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- Finding category enum
CREATE TYPE finding_category AS ENUM (
  'tls', 'headers', 'cors', 'cookies', 'auth', 'injection', 
  'graphql', 'exposure', 'config', 'performance', 'other'
);

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  environment environment_type NOT NULL DEFAULT 'production',
  api_base_path TEXT,
  graphql_endpoint TEXT,
  do_not_test_routes TEXT[] DEFAULT '{}',
  max_rps INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan runs table
CREATE TABLE public.scan_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mode scan_mode NOT NULL DEFAULT 'url_only',
  status scan_status NOT NULL DEFAULT 'pending',
  config JSONB DEFAULT '{}',
  security_score INTEGER,
  reliability_score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan tasks table
CREATE TABLE public.scan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_run_id UUID NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  output JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan findings table
CREATE TABLE public.scan_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_run_id UUID NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  category finding_category NOT NULL,
  severity severity_level NOT NULL,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_redacted TEXT,
  repro_steps TEXT[],
  fix_recommendation TEXT,
  lovable_fix_prompt TEXT,
  endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan metrics table
CREATE TABLE public.scan_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_run_id UUID NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  endpoint TEXT,
  p50_ms NUMERIC,
  p95_ms NUMERIC,
  p99_ms NUMERIC,
  rps NUMERIC,
  error_rate NUMERIC,
  timeout_rate NUMERIC,
  sample_count INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan artifacts table
CREATE TABLE public.scan_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_run_id UUID NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_artifacts ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Scan runs policies (based on project ownership)
CREATE POLICY "Users can view their scan runs" ON public.scan_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create scan runs for their projects" ON public.scan_runs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their scan runs" ON public.scan_runs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- Scan tasks policies
CREATE POLICY "Users can view their scan tasks" ON public.scan_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scan tasks" ON public.scan_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their scan tasks" ON public.scan_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

-- Scan findings policies
CREATE POLICY "Users can view their scan findings" ON public.scan_findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scan findings" ON public.scan_findings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

-- Scan metrics policies
CREATE POLICY "Users can view their scan metrics" ON public.scan_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scan metrics" ON public.scan_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

-- Scan artifacts policies
CREATE POLICY "Users can view their scan artifacts" ON public.scan_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scan artifacts" ON public.scan_artifacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_runs sr
      JOIN public.projects p ON sr.project_id = p.id
      WHERE sr.id = scan_run_id AND p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_scan_runs_project_id ON public.scan_runs(project_id);
CREATE INDEX idx_scan_runs_status ON public.scan_runs(status);
CREATE INDEX idx_scan_tasks_scan_run_id ON public.scan_tasks(scan_run_id);
CREATE INDEX idx_scan_findings_scan_run_id ON public.scan_findings(scan_run_id);
CREATE INDEX idx_scan_findings_severity ON public.scan_findings(severity);
CREATE INDEX idx_scan_metrics_scan_run_id ON public.scan_metrics(scan_run_id);
CREATE INDEX idx_scan_artifacts_scan_run_id ON public.scan_artifacts(scan_run_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();