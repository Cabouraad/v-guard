export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      onboarding_progress: {
        Row: {
          completed: boolean
          created_at: string
          dismissed: boolean
          id: string
          step_add_application: boolean
          step_adjust_controls: boolean
          step_authorize_scan: boolean
          step_confirmed_safety: boolean
          step_review_findings: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          dismissed?: boolean
          id?: string
          step_add_application?: boolean
          step_adjust_controls?: boolean
          step_authorize_scan?: boolean
          step_confirmed_safety?: boolean
          step_review_findings?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          dismissed?: boolean
          id?: string
          step_add_application?: boolean
          step_adjust_controls?: boolean
          step_authorize_scan?: boolean
          step_confirmed_safety?: boolean
          step_review_findings?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          api_base_path: string | null
          base_url: string
          created_at: string
          do_not_test_routes: string[] | null
          environment: Database["public"]["Enums"]["environment_type"]
          graphql_endpoint: string | null
          id: string
          max_rps: number | null
          name: string
          notes: string | null
          platform_hint: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_base_path?: string | null
          base_url: string
          created_at?: string
          do_not_test_routes?: string[] | null
          environment?: Database["public"]["Enums"]["environment_type"]
          graphql_endpoint?: string | null
          id?: string
          max_rps?: number | null
          name: string
          notes?: string | null
          platform_hint?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_base_path?: string | null
          base_url?: string
          created_at?: string
          do_not_test_routes?: string[] | null
          environment?: Database["public"]["Enums"]["environment_type"]
          graphql_endpoint?: string | null
          id?: string
          max_rps?: number | null
          name?: string
          notes?: string | null
          platform_hint?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          id: string
          metadata: Json | null
          scan_run_id: string
          storage_path: string
        }
        Insert: {
          artifact_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scan_run_id: string
          storage_path: string
        }
        Update: {
          artifact_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scan_run_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_artifacts_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: false
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_findings: {
        Row: {
          affected_targets: Json
          artifact_refs: Json
          category: Database["public"]["Enums"]["finding_category"]
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          description: string
          endpoint: string | null
          evidence_redacted: string | null
          fix_recommendation: string | null
          id: string
          impact: string | null
          lovable_fix_prompt: string | null
          repro_steps: string[] | null
          scan_run_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
          updated_at: string
        }
        Insert: {
          affected_targets?: Json
          artifact_refs?: Json
          category: Database["public"]["Enums"]["finding_category"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          description: string
          endpoint?: string | null
          evidence_redacted?: string | null
          fix_recommendation?: string | null
          id?: string
          impact?: string | null
          lovable_fix_prompt?: string | null
          repro_steps?: string[] | null
          scan_run_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
          updated_at?: string
        }
        Update: {
          affected_targets?: Json
          artifact_refs?: Json
          category?: Database["public"]["Enums"]["finding_category"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          description?: string
          endpoint?: string | null
          evidence_redacted?: string | null
          fix_recommendation?: string | null
          id?: string
          impact?: string | null
          lovable_fix_prompt?: string | null
          repro_steps?: string[] | null
          scan_run_id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_findings_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: false
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_metrics: {
        Row: {
          concurrency: number | null
          endpoint: string | null
          error_rate: number | null
          id: string
          metric_type: string
          p50_ms: number | null
          p95_ms: number | null
          p99_ms: number | null
          raw: Json
          recorded_at: string
          rps: number | null
          sample_count: number | null
          scan_run_id: string
          step_label: string | null
          timeout_rate: number | null
        }
        Insert: {
          concurrency?: number | null
          endpoint?: string | null
          error_rate?: number | null
          id?: string
          metric_type: string
          p50_ms?: number | null
          p95_ms?: number | null
          p99_ms?: number | null
          raw?: Json
          recorded_at?: string
          rps?: number | null
          sample_count?: number | null
          scan_run_id: string
          step_label?: string | null
          timeout_rate?: number | null
        }
        Update: {
          concurrency?: number | null
          endpoint?: string | null
          error_rate?: number | null
          id?: string
          metric_type?: string
          p50_ms?: number | null
          p95_ms?: number | null
          p99_ms?: number | null
          raw?: Json
          recorded_at?: string
          rps?: number | null
          sample_count?: number | null
          scan_run_id?: string
          step_label?: string | null
          timeout_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_metrics_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: false
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_reports: {
        Row: {
          created_at: string
          html_artifact_id: string | null
          id: string
          pdf_artifact_id: string | null
          report_model: Json
          scan_run_id: string
          summary: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_artifact_id?: string | null
          id?: string
          pdf_artifact_id?: string | null
          report_model?: Json
          scan_run_id: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_artifact_id?: string | null
          id?: string
          pdf_artifact_id?: string | null
          report_model?: Json
          scan_run_id?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_reports_html_artifact_id_fkey"
            columns: ["html_artifact_id"]
            isOneToOne: false
            referencedRelation: "scan_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_reports_pdf_artifact_id_fkey"
            columns: ["pdf_artifact_id"]
            isOneToOne: false
            referencedRelation: "scan_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_reports_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: true
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_runs: {
        Row: {
          allow_advanced_tests: boolean
          app_profile: Json
          approved_for_production: boolean
          config: Json | null
          created_at: string
          ended_at: string | null
          error_message: string | null
          error_summary: string | null
          id: string
          mode: Database["public"]["Enums"]["scan_mode"]
          project_id: string
          reliability_score: number | null
          security_score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["scan_status"]
        }
        Insert: {
          allow_advanced_tests?: boolean
          app_profile?: Json
          approved_for_production?: boolean
          config?: Json | null
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          error_summary?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["scan_mode"]
          project_id: string
          reliability_score?: number | null
          security_score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
        }
        Update: {
          allow_advanced_tests?: boolean
          app_profile?: Json
          approved_for_production?: boolean
          config?: Json | null
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          error_summary?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["scan_mode"]
          project_id?: string
          reliability_score?: number | null
          security_score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "scan_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_tasks: {
        Row: {
          attempt_count: number
          created_at: string
          ended_at: string | null
          error_detail: string | null
          error_message: string | null
          id: string
          max_attempts: number
          max_retries: number | null
          output: Json | null
          retries: number | null
          scan_run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          ended_at?: string | null
          error_detail?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number
          max_retries?: number | null
          output?: Json | null
          retries?: number | null
          scan_run_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          ended_at?: string | null
          error_detail?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number
          max_retries?: number | null
          output?: Json | null
          retries?: number | null
          scan_run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_tasks_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: false
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          price_id: string
          status: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          price_id: string
          status: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          price_id?: string
          status?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_monthly: {
        Row: {
          created_at: string
          id: string
          period_start: string
          scan_runs_created: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_start: string
          scan_runs_created?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_start?: string
          scan_runs_created?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_entitlements: {
        Row: {
          allow_soak: boolean | null
          allow_stress: boolean | null
          cancel_at_period_end: boolean | null
          current_period_end: string | null
          current_period_start: string | null
          max_concurrency: number | null
          price_id: string | null
          priority_queue: boolean | null
          retention_days: number | null
          scan_limit_per_month: number | null
          status: string | null
          stripe_subscription_id: string | null
          tier_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_run_gated_task: {
        Args: { p_scan_run_id: string; p_task_type: string }
        Returns: {
          allow_soak: boolean
          allow_stress: boolean
          allowed: boolean
          max_concurrency: number
          max_rps: number
          reason: string
          tier_name: string
        }[]
      }
      get_monthly_usage: {
        Args: { p_period_start: string; p_user_id: string }
        Returns: number
      }
      get_user_entitlements: {
        Args: { p_user_id: string }
        Returns: {
          allow_soak: boolean
          allow_stress: boolean
          cancel_at_period_end: boolean
          current_period_end: string
          max_concurrency: number
          priority_queue: boolean
          retention_days: number
          scan_limit_per_month: number
          subscription_status: string
          tier_name: string
        }[]
      }
      increment_scan_usage: {
        Args: { p_limit: number; p_period_start: string; p_user_id: string }
        Returns: number
      }
      is_internal_test_user: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      confidence_level: "high" | "medium" | "low"
      environment_type:
        | "production"
        | "staging"
        | "development"
        | "prod"
        | "dev"
      finding_category:
        | "tls"
        | "headers"
        | "cors"
        | "cookies"
        | "auth"
        | "injection"
        | "graphql"
        | "exposure"
        | "config"
        | "performance"
        | "other"
      scan_mode: "url_only" | "authenticated" | "hybrid"
      scan_status:
        | "pending"
        | "running"
        | "paused"
        | "completed"
        | "failed"
        | "cancelled"
        | "queued"
        | "canceled"
      severity_level:
        | "critical"
        | "high"
        | "medium"
        | "low"
        | "info"
        | "not_tested"
      task_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
        | "queued"
        | "canceled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      confidence_level: ["high", "medium", "low"],
      environment_type: ["production", "staging", "development", "prod", "dev"],
      finding_category: [
        "tls",
        "headers",
        "cors",
        "cookies",
        "auth",
        "injection",
        "graphql",
        "exposure",
        "config",
        "performance",
        "other",
      ],
      scan_mode: ["url_only", "authenticated", "hybrid"],
      scan_status: [
        "pending",
        "running",
        "paused",
        "completed",
        "failed",
        "cancelled",
        "queued",
        "canceled",
      ],
      severity_level: [
        "critical",
        "high",
        "medium",
        "low",
        "info",
        "not_tested",
      ],
      task_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
        "queued",
        "canceled",
      ],
    },
  },
} as const
