// Database types for the security scanner

export type EnvironmentType = 'production' | 'staging' | 'development';
export type ScanMode = 'url_only' | 'authenticated' | 'hybrid';
export type ScanStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
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
  | 'other';

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
  created_at: string;
  updated_at: string;
}

export interface ScanRun {
  id: string;
  project_id: string;
  mode: ScanMode;
  status: ScanStatus;
  config: Record<string, unknown>;
  security_score?: number;
  reliability_score?: number;
  started_at?: string;
  ended_at?: string;
  error_message?: string;
  created_at: string;
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
  started_at?: string;
  ended_at?: string;
  output: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

export interface ScanFinding {
  id: string;
  scan_run_id: string;
  category: FindingCategory;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  title: string;
  description: string;
  evidence_redacted?: string;
  repro_steps?: string[];
  fix_recommendation?: string;
  lovable_fix_prompt?: string;
  endpoint?: string;
  created_at: string;
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
  recorded_at: string;
}

export interface ScanArtifact {
  id: string;
  scan_run_id: string;
  artifact_type: string;
  storage_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// UI-specific types
export interface ScanSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  securityScore: number;
  reliabilityScore: number;
  readinessStatus: 'ready' | 'needs-work' | 'not-ready';
}

export interface TaskProgress {
  total: number;
  completed: number;
  running: number;
  failed: number;
  pending: number;
}
