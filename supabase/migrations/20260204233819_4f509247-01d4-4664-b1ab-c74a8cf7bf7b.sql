-- ============================================================
-- Vibe Code Security & Load Testing Tool Schema Migration
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Helper Function ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- ---------- Update Enums ----------
-- Environment type: add 'prod' and 'dev' if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prod' AND enumtypid = 'environment_type'::regtype) THEN
    ALTER TYPE public.environment_type ADD VALUE 'prod';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dev' AND enumtypid = 'environment_type'::regtype) THEN
    ALTER TYPE public.environment_type ADD VALUE 'dev';
  END IF;
END $$;

-- Scan status: add 'queued' and 'canceled' if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'queued' AND enumtypid = 'scan_status'::regtype) THEN
    ALTER TYPE public.scan_status ADD VALUE 'queued';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'canceled' AND enumtypid = 'scan_status'::regtype) THEN
    ALTER TYPE public.scan_status ADD VALUE 'canceled';
  END IF;
END $$;

-- Task status: add 'queued' and 'canceled' if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'queued' AND enumtypid = 'task_status'::regtype) THEN
    ALTER TYPE public.task_status ADD VALUE 'queued';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'canceled' AND enumtypid = 'task_status'::regtype) THEN
    ALTER TYPE public.task_status ADD VALUE 'canceled';
  END IF;
END $$;

-- Severity level: add 'not_tested' if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'not_tested' AND enumtypid = 'severity_level'::regtype) THEN
    ALTER TYPE public.severity_level ADD VALUE 'not_tested';
  END IF;
END $$;

-- ---------- Projects Table Updates ----------
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS platform_hint text NULL,
  ADD COLUMN IF NOT EXISTS notes text NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_base_url ON public.projects(base_url);

-- Add trigger if not exists
DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Scan Runs Table Updates ----------
ALTER TABLE public.scan_runs
  ADD COLUMN IF NOT EXISTS app_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_advanced_tests boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_for_production boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_summary text NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_runs_project_id ON public.scan_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_scan_runs_status ON public.scan_runs(status);

-- Add trigger
DROP TRIGGER IF EXISTS trg_scan_runs_updated_at ON public.scan_runs;
CREATE TRIGGER trg_scan_runs_updated_at
  BEFORE UPDATE ON public.scan_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Scan Tasks Table Updates ----------
ALTER TABLE public.scan_tasks
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS error_detail text NULL;

-- Copy data from old columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_tasks' AND column_name = 'retries') THEN
    UPDATE public.scan_tasks SET attempt_count = COALESCE(retries, 0);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_tasks' AND column_name = 'max_retries') THEN
    UPDATE public.scan_tasks SET max_attempts = COALESCE(max_retries, 3);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_tasks' AND column_name = 'error_message') THEN
    UPDATE public.scan_tasks SET error_detail = error_message;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_tasks_run_id ON public.scan_tasks(scan_run_id);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_type ON public.scan_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_scan_tasks_status ON public.scan_tasks(status);

-- Add trigger
DROP TRIGGER IF EXISTS trg_scan_tasks_updated_at ON public.scan_tasks;
CREATE TRIGGER trg_scan_tasks_updated_at
  BEFORE UPDATE ON public.scan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Scan Findings Table Updates ----------
ALTER TABLE public.scan_findings
  ADD COLUMN IF NOT EXISTS affected_targets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS impact text NULL,
  ADD COLUMN IF NOT EXISTS artifact_refs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add updated_at column and trigger
ALTER TABLE public.scan_findings
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_findings_run_id ON public.scan_findings(scan_run_id);
CREATE INDEX IF NOT EXISTS idx_scan_findings_severity ON public.scan_findings(severity);

-- Add trigger
DROP TRIGGER IF EXISTS trg_scan_findings_updated_at ON public.scan_findings;
CREATE TRIGGER trg_scan_findings_updated_at
  BEFORE UPDATE ON public.scan_findings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Scan Metrics Table Updates ----------
ALTER TABLE public.scan_metrics
  ADD COLUMN IF NOT EXISTS concurrency int NULL,
  ADD COLUMN IF NOT EXISTS step_label text NULL,
  ADD COLUMN IF NOT EXISTS raw jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_metrics_run_id ON public.scan_metrics(scan_run_id);
CREATE INDEX IF NOT EXISTS idx_scan_metrics_type_time ON public.scan_metrics(metric_type, recorded_at);

-- Add constraints for rate ranges
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_error_rate_range') THEN
    ALTER TABLE public.scan_metrics
      ADD CONSTRAINT chk_error_rate_range
      CHECK (error_rate IS NULL OR (error_rate >= 0 AND error_rate <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_timeout_rate_range') THEN
    ALTER TABLE public.scan_metrics
      ADD CONSTRAINT chk_timeout_rate_range
      CHECK (timeout_rate IS NULL OR (timeout_rate >= 0 AND timeout_rate <= 1));
  END IF;
END $$;

-- ---------- Scan Artifacts Indexes ----------
CREATE INDEX IF NOT EXISTS idx_scan_artifacts_run_id ON public.scan_artifacts(scan_run_id);
CREATE INDEX IF NOT EXISTS idx_scan_artifacts_type ON public.scan_artifacts(artifact_type);

-- ---------- Create Scan Reports Table ----------
CREATE TABLE IF NOT EXISTS public.scan_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_run_id uuid NOT NULL UNIQUE REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  report_model jsonb NOT NULL DEFAULT '{}'::jsonb,
  html_artifact_id uuid NULL REFERENCES public.scan_artifacts(id) ON DELETE SET NULL,
  pdf_artifact_id uuid NULL REFERENCES public.scan_artifacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_reports_run_id ON public.scan_reports(scan_run_id);

DROP TRIGGER IF EXISTS trg_scan_reports_updated_at ON public.scan_reports;
CREATE TRIGGER trg_scan_reports_updated_at
  BEFORE UPDATE ON public.scan_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;

-- ---------- RLS Policies for scan_reports ----------
DROP POLICY IF EXISTS "scan_reports_select_own" ON public.scan_reports;
CREATE POLICY "scan_reports_select_own"
ON public.scan_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_reports.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_reports_insert_own" ON public.scan_reports;
CREATE POLICY "scan_reports_insert_own"
ON public.scan_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_reports.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_reports_update_own" ON public.scan_reports;
CREATE POLICY "scan_reports_update_own"
ON public.scan_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_reports.scan_run_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_reports.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_reports_delete_own" ON public.scan_reports;
CREATE POLICY "scan_reports_delete_own"
ON public.scan_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_reports.scan_run_id
      AND p.user_id = auth.uid()
  )
);

-- ---------- Add DELETE policies to existing tables ----------
DROP POLICY IF EXISTS "scan_runs_delete_own" ON public.scan_runs;
CREATE POLICY "scan_runs_delete_own"
ON public.scan_runs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = scan_runs.project_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_tasks_delete_own" ON public.scan_tasks;
CREATE POLICY "scan_tasks_delete_own"
ON public.scan_tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_tasks.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_findings_update_own" ON public.scan_findings;
CREATE POLICY "scan_findings_update_own"
ON public.scan_findings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_findings.scan_run_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_findings.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_findings_delete_own" ON public.scan_findings;
CREATE POLICY "scan_findings_delete_own"
ON public.scan_findings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_findings.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_metrics_update_own" ON public.scan_metrics;
CREATE POLICY "scan_metrics_update_own"
ON public.scan_metrics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_metrics.scan_run_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_metrics.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_metrics_delete_own" ON public.scan_metrics;
CREATE POLICY "scan_metrics_delete_own"
ON public.scan_metrics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_metrics.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_artifacts_update_own" ON public.scan_artifacts;
CREATE POLICY "scan_artifacts_update_own"
ON public.scan_artifacts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_artifacts.scan_run_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_artifacts.scan_run_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "scan_artifacts_delete_own" ON public.scan_artifacts;
CREATE POLICY "scan_artifacts_delete_own"
ON public.scan_artifacts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scan_runs r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.id = scan_artifacts.scan_run_id
      AND p.user_id = auth.uid()
  )
);