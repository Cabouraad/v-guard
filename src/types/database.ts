// Database types for the security scanner

export type EnvironmentType = 'production' | 'staging' | 'development' | 'prod' | 'dev';
export type ScanMode = 'url_only' | 'authenticated' | 'hybrid';
export type ScanStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'queued' | 'canceled';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'queued' | 'canceled';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'not_tested';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FindingCategory = 
  | 'tls' 
  | 'headers' 
  | 'cors' 
  | 'cookies' 
  | 'auth' 
  | 'injection'
  | 'graphql' 
  | 'exposure' 
  | 'config' 
  | 'performance' 
  | 'other'
  | 'not_tested';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  base_url: string;
  environment: EnvironmentType;
  api_base_path?: string;
  graphql_endpoint?: string;
  do_not_test_routes: string[];
  max_rps: number;
  platform_hint?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScanRun {
  id: string;
  project_id: string;
  mode: ScanMode;
  status: ScanStatus;
  config: Record<string, unknown>;
  app_profile: Record<string, unknown>;
  security_score?: number;
  reliability_score?: number;
  allow_advanced_tests: boolean;
  approved_for_production: boolean;
  started_at?: string;
  ended_at?: string;
  error_message?: string;
  error_summary?: string;
  created_at: string;
  updated_at?: string;
  // Joined data
  project?: Project;
}

export interface ScanTask {
  id: string;
  scan_run_id: string;
  task_type: string;
  status: TaskStatus;
  retries: number;
  max_retries: number;
  attempt_count: number;
  max_attempts: number;
  started_at?: string;
  ended_at?: string;
  output: Record<string, unknown>;
  error_message?: string;
  error_detail?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScanFinding {
  id: string;
  scan_run_id: string;
  category: FindingCategory | string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  title: string;
  description: string;
  affected_targets: string[];
  evidence_redacted?: string | Record<string, unknown>;
  repro_steps?: string[];
  impact?: string;
  fix_recommendation?: string;
  lovable_fix_prompt?: string;
  artifact_refs?: string[];
  endpoint?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScanMetric {
  id: string;
  scan_run_id: string;
  metric_type: string;
  endpoint?: string;
  p50_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
  rps?: number;
  error_rate?: number;
  timeout_rate?: number;
  sample_count?: number;
  concurrency?: number;
  step_label?: string;
  raw?: Record<string, unknown>;
  recorded_at: string;
  created_at?: string;
}

export interface ScanArtifact {
  id: string;
  scan_run_id: string;
  artifact_type: string;
  storage_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScanReport {
  id: string;
  scan_run_id: string;
  summary: Record<string, unknown>;
  report_model: Record<string, unknown>;
  html_artifact_id?: string;
  pdf_artifact_id?: string;
  created_at: string;
  updated_at: string;
}

// UI-specific types
export interface ScanSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  notTestedCount: number;
  securityScore: number;
  reliabilityScore: number;
  readinessStatus: 'go' | 'caution' | 'no-go';
}

export interface TaskProgress {
  total: number;
  completed: number;
  running: number;
  failed: number;
  pending: number;
  queued: number;
  skipped: number;
  canceled: number;
}

export interface TestedVsNotTested {
  tested: string[];
  notTested: Array<{
    item: string;
    reason: string;
  }>;
}
