import { createClient } from "@supabase/supabase-js";

// Internal worker — no CORS needed. Called server-to-server only.
const jsonHeaders = { "Content-Type": "application/json" };

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
type ConfidenceLevel = "high" | "medium" | "low";

interface AuditFinding {
  category: "rls" | "storage" | "auth" | "config" | "exposure";
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  title: string;
  description: string;
  evidence_redacted: string;
  table_or_bucket?: string;
  fix_recommendation: string;
  lovable_fix_prompt: string;
}

interface TableInfo {
  table_name: string;
  table_schema: string;
  rls_enabled: boolean;
  row_count_estimate: number;
}

interface PolicyInfo {
  table_name: string;
  policy_name: string;
  command: string;
  permissive: string;
  roles: string[];
  qual: string | null;
  with_check: string | null;
}

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
}

interface StoragePolicy {
  bucket_id: string;
  policy_name: string;
  command: string;
  definition: string;
}

interface AuditInput {
  scan_run_id: string;
  target_supabase_url: string;
  target_service_role_key: string;
  audit_config?: {
    skip_tables?: string[];
    skip_buckets?: string[];
    check_auth_config?: boolean;
  };
}

interface AuditOutput {
  success: boolean;
  findings: AuditFinding[];
  summary: {
    tablesScanned: number;
    tablesWithoutRls: number;
    overpermissivePolicies: number;
    publicBuckets: number;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
  };
  notAudited: { item: string; reason: string }[];
}

// Patterns that indicate overly permissive policies
const OVERPERMISSIVE_PATTERNS = [
  { pattern: /^\s*true\s*$/i, description: "Policy always returns true" },
  { pattern: /^\s*1\s*=\s*1\s*$/i, description: "Policy uses 1=1 (always true)" },
  { pattern: /^\s*'[^']*'\s*=\s*'[^']*'\s*$/i, description: "Policy uses string equality that's always true" },
  { pattern: /auth\.role\(\)\s*=\s*'authenticated'/i, description: "Policy allows any authenticated user" },
  { pattern: /role\s*=\s*'anon'/i, description: "Policy grants access to anonymous users" },
];

// Tables that should always have RLS (contain user data)
const SENSITIVE_TABLE_PATTERNS = [
  /user/i, /profile/i, /account/i, /order/i, /payment/i, /subscription/i,
  /message/i, /comment/i, /post/i, /document/i, /file/i, /upload/i,
  /secret/i, /token/i, /session/i, /credential/i, /password/i, /key/i,
];

// Check if a policy definition is overly permissive
function isOverpermissive(definition: string | null): { is: boolean; reason?: string } {
  if (!definition) return { is: false };
  
  const trimmed = definition.trim();
  
  for (const { pattern, description } of OVERPERMISSIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { is: true, reason: description };
    }
  }
  
  return { is: false };
}

// Check if table name suggests it contains sensitive data
function isSensitiveTable(tableName: string): boolean {
  return SENSITIVE_TABLE_PATTERNS.some((pattern) => pattern.test(tableName));
}

// Redact sensitive parts of policy definitions
function redactPolicyDefinition(definition: string): string {
  // Redact any string literals that might contain sensitive data
  return definition
    .replace(/'[^']{10,}'/g, "'[REDACTED]'")
    .replace(/\b[a-f0-9]{32,}\b/gi, "[REDACTED_HASH]")
    .substring(0, 500) + (definition.length > 500 ? "..." : "");
}

// Fetch table information from target database
async function fetchTableInfo(supabase: any): Promise<TableInfo[]> {
  const { data, error } = await supabase.rpc("get_table_info_for_audit");
  
  if (error) {
    // Fallback to direct query if RPC doesn't exist
    const { data: fallback, error: fallbackError } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_schema")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE");
    
    if (fallbackError) {
      console.error("Failed to fetch table info:", fallbackError);
      return [];
    }
    
    // Can't get RLS status without proper function
    return (fallback || []).map((t: any) => ({
      table_name: t.table_name,
      table_schema: t.table_schema,
      rls_enabled: false, // Unknown
      row_count_estimate: 0,
    }));
  }
  
  return data || [];
}

// Fetch RLS policies
async function fetchPolicies(supabase: any): Promise<PolicyInfo[]> {
  const { data, error } = await supabase.rpc("get_policies_for_audit");
  
  if (error) {
    console.error("Failed to fetch policies:", error);
    return [];
  }
  
  return data || [];
}

// Fetch storage buckets
async function fetchBuckets(supabase: any): Promise<BucketInfo[]> {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error("Failed to fetch buckets:", error);
    return [];
  }
  
  return data || [];
}

// Audit RLS configuration
function auditRLS(tables: TableInfo[], policies: PolicyInfo[], skipTables: string[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  
  for (const table of tables) {
    if (skipTables.includes(table.table_name)) continue;
    if (table.table_schema !== "public") continue;
    
    // Check if RLS is disabled
    if (!table.rls_enabled) {
      const isSensitive = isSensitiveTable(table.table_name);
      
      findings.push({
        category: "rls",
        severity: isSensitive ? "critical" : "high",
        confidence: "high",
        title: `RLS disabled on table: ${table.table_name}`,
        description: `Row Level Security is not enabled on the "${table.table_name}" table. ${
          isSensitive 
            ? "This table appears to contain sensitive user data and is at critical risk of data exposure."
            : "Any authenticated user or anonymous request may access all data in this table."
        }`,
        evidence_redacted: `Table: public.${table.table_name}\nRLS Enabled: false\nEstimated Rows: ${table.row_count_estimate}`,
        table_or_bucket: table.table_name,
        fix_recommendation: `Enable RLS on the table and create appropriate policies:\n1. ALTER TABLE public.${table.table_name} ENABLE ROW LEVEL SECURITY;\n2. Create SELECT/INSERT/UPDATE/DELETE policies based on user ownership`,
        lovable_fix_prompt: `Enable Row Level Security on the "${table.table_name}" table. Create policies that:
1. Only allow users to SELECT rows where user_id = auth.uid()
2. Only allow users to INSERT rows with their own user_id
3. Only allow users to UPDATE their own rows
4. Only allow users to DELETE their own rows
If this table doesn't have a user_id column, add one or create appropriate access policies based on the table's purpose.`,
      });
    }
    
    // Check policies for this table
    const tablePolicies = policies.filter((p) => p.table_name === table.table_name);
    
    for (const policy of tablePolicies) {
      // Check USING clause
      const usingCheck = isOverpermissive(policy.qual);
      if (usingCheck.is) {
        findings.push({
          category: "rls",
          severity: "high",
          confidence: "high",
          title: `Overly permissive policy: ${policy.policy_name}`,
          description: `The RLS policy "${policy.policy_name}" on table "${table.table_name}" has an overly permissive USING clause. ${usingCheck.reason}`,
          evidence_redacted: `Table: ${table.table_name}\nPolicy: ${policy.policy_name}\nCommand: ${policy.command}\nUSING: ${redactPolicyDefinition(policy.qual || "")}`,
          table_or_bucket: table.table_name,
          fix_recommendation: `Replace the permissive policy with one that properly restricts access based on user identity:\nCREATE POLICY "${policy.policy_name}" ON public.${table.table_name} FOR ${policy.command} USING (auth.uid() = user_id);`,
          lovable_fix_prompt: `Fix the overly permissive RLS policy "${policy.policy_name}" on the "${table.table_name}" table. The current policy allows unrestricted access (${usingCheck.reason}). Replace it with a policy that properly restricts access based on user ownership or role.`,
        });
      }
      
      // Check WITH CHECK clause
      const withCheckCheck = isOverpermissive(policy.with_check);
      if (withCheckCheck.is) {
        findings.push({
          category: "rls",
          severity: "medium",
          confidence: "high",
          title: `Permissive WITH CHECK: ${policy.policy_name}`,
          description: `The RLS policy "${policy.policy_name}" on table "${table.table_name}" has an overly permissive WITH CHECK clause. ${withCheckCheck.reason}`,
          evidence_redacted: `Table: ${table.table_name}\nPolicy: ${policy.policy_name}\nWITH CHECK: ${redactPolicyDefinition(policy.with_check || "")}`,
          table_or_bucket: table.table_name,
          fix_recommendation: `Update the policy's WITH CHECK clause to validate user ownership:\nWITH CHECK (auth.uid() = user_id)`,
          lovable_fix_prompt: `Fix the permissive WITH CHECK clause in policy "${policy.policy_name}" on "${table.table_name}". Ensure it validates that the user can only insert/update rows they own.`,
        });
      }
      
      // Check for policies that grant access to anonymous users
      if (policy.roles.includes("anon") && policy.command === "SELECT") {
        const isSensitive = isSensitiveTable(table.table_name);
        if (isSensitive) {
          findings.push({
            category: "rls",
            severity: "high",
            confidence: "medium",
            title: `Anonymous access to sensitive table: ${table.table_name}`,
            description: `The table "${table.table_name}" appears to contain sensitive data but allows anonymous SELECT access through policy "${policy.policy_name}".`,
            evidence_redacted: `Table: ${table.table_name}\nPolicy: ${policy.policy_name}\nRoles: ${policy.roles.join(", ")}`,
            table_or_bucket: table.table_name,
            fix_recommendation: `Remove anonymous access or restrict it to specific non-sensitive columns:\nDROP POLICY "${policy.policy_name}" ON public.${table.table_name};\nCREATE POLICY "${policy.policy_name}" ON public.${table.table_name} FOR SELECT TO authenticated USING (...);`,
            lovable_fix_prompt: `Remove anonymous (unauthenticated) access to the "${table.table_name}" table. This table appears to contain sensitive user data. Update the policy to require authentication.`,
          });
        }
      }
    }
    
    // Check for tables with no policies at all (but RLS enabled)
    if (table.rls_enabled && tablePolicies.length === 0) {
      findings.push({
        category: "rls",
        severity: "medium",
        confidence: "high",
        title: `RLS enabled but no policies: ${table.table_name}`,
        description: `The table "${table.table_name}" has RLS enabled but no policies defined. This means all access is denied by default, which may break functionality.`,
        evidence_redacted: `Table: ${table.table_name}\nRLS: Enabled\nPolicies: 0`,
        table_or_bucket: table.table_name,
        fix_recommendation: `Create appropriate RLS policies for the table based on its intended access patterns.`,
        lovable_fix_prompt: `The "${table.table_name}" table has RLS enabled but no policies, which blocks all access. Create appropriate SELECT, INSERT, UPDATE, and DELETE policies based on who should access this data.`,
      });
    }
  }
  
  return findings;
}

// Audit storage buckets
function auditStorage(buckets: BucketInfo[], skipBuckets: string[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  
  for (const bucket of buckets) {
    if (skipBuckets.includes(bucket.name)) continue;
    
    // Check for public buckets
    if (bucket.public) {
      const isSensitiveName = /user|private|document|upload|avatar|profile/i.test(bucket.name);
      
      findings.push({
        category: "storage",
        severity: isSensitiveName ? "high" : "medium",
        confidence: isSensitiveName ? "high" : "medium",
        title: `Public storage bucket: ${bucket.name}`,
        description: `The storage bucket "${bucket.name}" is configured as public, meaning anyone can read files from it. ${
          isSensitiveName 
            ? "The bucket name suggests it may contain sensitive user data."
            : "Ensure this is intentional and no sensitive files are stored here."
        }`,
        evidence_redacted: `Bucket: ${bucket.name}\nPublic: true\nSize Limit: ${bucket.file_size_limit || "unlimited"}`,
        table_or_bucket: bucket.name,
        fix_recommendation: `If this bucket should be private:\n1. Update the bucket: UPDATE storage.buckets SET public = false WHERE name = '${bucket.name}';\n2. Create appropriate RLS policies for storage.objects`,
        lovable_fix_prompt: `Review the "${bucket.name}" storage bucket. It's currently public (anyone can read files). If this contains user uploads or sensitive files, make it private and add RLS policies to control access.`,
      });
    }
    
    // Check for missing file size limits
    if (!bucket.file_size_limit) {
      findings.push({
        category: "storage",
        severity: "low",
        confidence: "high",
        title: `No file size limit: ${bucket.name}`,
        description: `The storage bucket "${bucket.name}" has no file size limit configured. This could allow users to upload very large files, potentially causing storage cost issues.`,
        evidence_redacted: `Bucket: ${bucket.name}\nFile Size Limit: not set`,
        table_or_bucket: bucket.name,
        fix_recommendation: `Set a reasonable file size limit:\nUPDATE storage.buckets SET file_size_limit = 5242880 WHERE name = '${bucket.name}'; -- 5MB limit`,
        lovable_fix_prompt: `Add a file size limit to the "${bucket.name}" storage bucket. A reasonable limit (e.g., 5MB for images, 10MB for documents) prevents abuse and controls storage costs.`,
      });
    }
    
    // Check for missing MIME type restrictions
    if (!bucket.allowed_mime_types || bucket.allowed_mime_types.length === 0) {
      findings.push({
        category: "storage",
        severity: "low",
        confidence: "medium",
        title: `No MIME type restrictions: ${bucket.name}`,
        description: `The storage bucket "${bucket.name}" allows any file type to be uploaded. Consider restricting to expected file types for security.`,
        evidence_redacted: `Bucket: ${bucket.name}\nAllowed MIME Types: any`,
        table_or_bucket: bucket.name,
        fix_recommendation: `Restrict allowed file types based on the bucket's purpose:\nUPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'] WHERE name = '${bucket.name}';`,
        lovable_fix_prompt: `Add MIME type restrictions to the "${bucket.name}" storage bucket. Only allow the file types that are actually needed (e.g., images for avatars, PDFs for documents).`,
      });
    }
  }
  
  return findings;
}

// Store findings in the scan_findings table
async function storeFindings(
  supabase: any,
  scanRunId: string,
  findings: AuditFinding[]
): Promise<void> {
  if (findings.length === 0) return;
  
  const findingsToInsert = findings.map((f) => ({
    scan_run_id: scanRunId,
    category: f.category,
    severity: f.severity,
    confidence: f.confidence,
    title: f.title,
    description: f.description,
    evidence_redacted: f.evidence_redacted,
    endpoint: f.table_or_bucket,
    fix_recommendation: f.fix_recommendation,
    lovable_fix_prompt: f.lovable_fix_prompt,
  }));
  
  const { error } = await supabase.from("scan_findings").insert(findingsToInsert);
  if (error) {
    console.error("Failed to store findings:", error);
  }
}

// Main audit function
async function runSupabaseAudit(
  localSupabase: any,
  input: AuditInput
): Promise<AuditOutput> {
  const { scan_run_id, target_supabase_url, target_service_role_key, audit_config } = input;
  const skipTables = audit_config?.skip_tables || [];
  const skipBuckets = audit_config?.skip_buckets || [];
  const notAudited: { item: string; reason: string }[] = [];
  
  // Create client for target Supabase
  const targetSupabase = createClient(target_supabase_url, target_service_role_key, {
    auth: { persistSession: false },
  });
  
  // Fetch metadata (never data!)
  let tables: TableInfo[] = [];
  let policies: PolicyInfo[] = [];
  let buckets: BucketInfo[] = [];
  
  try {
    // Try to get table info via information_schema
    const { data: tableData, error: tableError } = await targetSupabase
      .rpc("pg_catalog_tables_audit", {});
    
    if (tableError) {
      // Use a simpler approach
      notAudited.push({
        item: "Full table metadata",
        reason: "Could not access pg_catalog. Using limited metadata inspection.",
      });
    } else {
      tables = tableData || [];
    }
  } catch (e) {
    notAudited.push({
      item: "Table RLS status",
      reason: "Error fetching table metadata",
    });
  }
  
  try {
    // Get policies via pg_policies
    const { data: policyData, error: policyError } = await targetSupabase
      .rpc("pg_policies_audit", {});
    
    if (policyError) {
      notAudited.push({
        item: "RLS policies",
        reason: "Could not fetch policy definitions. Manual review recommended.",
      });
    } else {
      policies = policyData || [];
    }
  } catch (e) {
    notAudited.push({
      item: "RLS policies",
      reason: "Error fetching policies",
    });
  }
  
  try {
    buckets = await fetchBuckets(targetSupabase);
  } catch (e) {
    notAudited.push({
      item: "Storage buckets",
      reason: "Error fetching bucket configuration",
    });
  }
  
  // Run audits
  const rlsFindings = auditRLS(tables, policies, skipTables);
  const storageFindings = auditStorage(buckets, skipBuckets);
  
  const allFindings = [...rlsFindings, ...storageFindings];
  
  // Store findings
  await storeFindings(localSupabase, scan_run_id, allFindings);
  
  // Calculate summary
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  
  return {
    success: true,
    findings: allFindings,
    summary: {
      tablesScanned: tables.length,
      tablesWithoutRls: tables.filter((t) => !t.rls_enabled).length,
      overpermissivePolicies: allFindings.filter((f) => f.title.includes("permissive")).length,
      publicBuckets: buckets.filter((b) => b.public).length,
      totalFindings: allFindings.length,
      criticalCount,
      highCount,
    },
    notAudited,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    // Local supabase for storing results
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const localSupabase = createClient(supabaseUrl, supabaseKey);

    const input: AuditInput = await req.json();

    // Validate required permissions
    if (!input.scan_run_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing scan_run_id" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (!input.target_supabase_url || !input.target_service_role_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase auditing requires explicit connection details (target_supabase_url and target_service_role_key). This is a V2 feature that only runs with user permission.",
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Validate the URL format
    try {
      new URL(input.target_supabase_url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid target_supabase_url format" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Run the audit
    const result = await runSupabaseAudit(localSupabase, input);

    return new Response(JSON.stringify(result), {
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("Supabase auditor error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
