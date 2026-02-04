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
          category: Database["public"]["Enums"]["finding_category"]
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          description: string
          endpoint: string | null
          evidence_redacted: string | null
          fix_recommendation: string | null
          id: string
          lovable_fix_prompt: string | null
          repro_steps: string[] | null
          scan_run_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["finding_category"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          description: string
          endpoint?: string | null
          evidence_redacted?: string | null
          fix_recommendation?: string | null
          id?: string
          lovable_fix_prompt?: string | null
          repro_steps?: string[] | null
          scan_run_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["finding_category"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          description?: string
          endpoint?: string | null
          evidence_redacted?: string | null
          fix_recommendation?: string | null
          id?: string
          lovable_fix_prompt?: string | null
          repro_steps?: string[] | null
          scan_run_id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          title?: string
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
          endpoint: string | null
          error_rate: number | null
          id: string
          metric_type: string
          p50_ms: number | null
          p95_ms: number | null
          p99_ms: number | null
          recorded_at: string
          rps: number | null
          sample_count: number | null
          scan_run_id: string
          timeout_rate: number | null
        }
        Insert: {
          endpoint?: string | null
          error_rate?: number | null
          id?: string
          metric_type: string
          p50_ms?: number | null
          p95_ms?: number | null
          p99_ms?: number | null
          recorded_at?: string
          rps?: number | null
          sample_count?: number | null
          scan_run_id: string
          timeout_rate?: number | null
        }
        Update: {
          endpoint?: string | null
          error_rate?: number | null
          id?: string
          metric_type?: string
          p50_ms?: number | null
          p95_ms?: number | null
          p99_ms?: number | null
          recorded_at?: string
          rps?: number | null
          sample_count?: number | null
          scan_run_id?: string
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
      scan_runs: {
        Row: {
          config: Json | null
          created_at: string
          ended_at: string | null
          error_message: string | null
          id: string
          mode: Database["public"]["Enums"]["scan_mode"]
          project_id: string
          reliability_score: number | null
          security_score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["scan_status"]
        }
        Insert: {
          config?: Json | null
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["scan_mode"]
          project_id: string
          reliability_score?: number | null
          security_score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
        }
        Update: {
          config?: Json | null
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
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
          created_at: string
          ended_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          output: Json | null
          retries: number | null
          scan_run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          output?: Json | null
          retries?: number | null
          scan_run_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      confidence_level: "high" | "medium" | "low"
      environment_type: "production" | "staging" | "development"
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
      severity_level: "critical" | "high" | "medium" | "low" | "info"
      task_status: "pending" | "running" | "completed" | "failed" | "skipped"
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
      environment_type: ["production", "staging", "development"],
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
      ],
      severity_level: ["critical", "high", "medium", "low", "info"],
      task_status: ["pending", "running", "completed", "failed", "skipped"],
    },
  },
} as const
