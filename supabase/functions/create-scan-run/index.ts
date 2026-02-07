import { createClient } from "@supabase/supabase-js";
 
const ALLOWED_ORIGINS = [
  "https://v-guard.lovable.app",
  "https://id-preview--f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovable.app",
  "https://f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovableproject.com",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}
 
 // Types
 interface ScanConfig {
   projectId: string;
   mode: "url_only" | "authenticated" | "hybrid";
   maxRps: number;
   maxConcurrency: number;
   enableSoak: boolean;
   enableStress: boolean;
   authToken?: string;
   doNotTestPatterns: string[];
   userApprovedProduction: boolean;
 }
 
 interface Entitlements {
   tier_name: string;
   scan_limit_per_month: number;
   allow_soak: boolean;
   allow_stress: boolean;
   priority_queue: boolean;
   retention_days: number;
   max_concurrency: number;
   subscription_status: string;
   current_period_end: string;
 }
 
 interface ValidationError {
   field: string;
   message: string;
   code: string;
 }
 
 // Task definitions with gating info
 const TASK_DEFINITIONS = [
   { type: "fingerprint", order: 1, requiresAuth: false, safeForProd: true, gated: false },
   { type: "security_headers", order: 2, requiresAuth: false, safeForProd: true, gated: false },
   { type: "tls_check", order: 3, requiresAuth: false, safeForProd: true, gated: false },
   { type: "cors_check", order: 4, requiresAuth: false, safeForProd: true, gated: false },
   { type: "cookie_check", order: 5, requiresAuth: false, safeForProd: true, gated: false },
   { type: "endpoint_discovery", order: 6, requiresAuth: false, safeForProd: true, gated: false },
   { type: "injection_safe", order: 7, requiresAuth: false, safeForProd: true, gated: false },
   { type: "graphql_introspection", order: 8, requiresAuth: false, safeForProd: true, gated: false },
   { type: "exposure_check", order: 9, requiresAuth: false, safeForProd: true, gated: false },
   { type: "perf_baseline", order: 10, requiresAuth: false, safeForProd: true, gated: false },
   { type: "load_ramp_light", order: 11, requiresAuth: false, safeForProd: true, gated: false },
   { type: "load_ramp_full", order: 12, requiresAuth: false, safeForProd: false, gated: true, gateType: "advanced" },
   { type: "soak_test", order: 13, requiresAuth: false, safeForProd: false, gated: true, gateType: "soak" },
   { type: "stress_test", order: 14, requiresAuth: false, safeForProd: false, gated: true, gateType: "stress" },
 ];
 
 const logStep = (step: string, details?: unknown) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
   console.log(`[CREATE-SCAN-RUN] ${step}${detailsStr}`);
 };
 
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
 
   // Use service role for all database operations
   const supabaseAdmin = createClient(
     Deno.env.get("SUPABASE_URL") ?? "",
     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
     { auth: { persistSession: false } }
   );
 
   // Use anon client for user auth verification
   const supabaseClient = createClient(
     Deno.env.get("SUPABASE_URL") ?? "",
     Deno.env.get("SUPABASE_ANON_KEY") ?? ""
   );
 
   try {
     logStep("Function started");
 
     // ============================================
     // 1. AUTHENTICATE USER
     // ============================================
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       throw new Error("UNAUTHORIZED: No authorization header provided");
     }
 
     const token = authHeader.replace("Bearer ", "");
     const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
     if (userError || !userData.user) {
       throw new Error(`UNAUTHORIZED: ${userError?.message || "Invalid token"}`);
     }
     const userId = userData.user.id;
     logStep("User authenticated", { userId });
 
     // ============================================
     // 2. PARSE AND VALIDATE REQUEST
     // ============================================
     const body = await req.json();
     const config: ScanConfig = {
       projectId: body.projectId,
       mode: body.mode || "url_only",
       maxRps: body.maxRps || 10,
       maxConcurrency: body.maxConcurrency || 2,
       enableSoak: body.enableSoak || false,
       enableStress: body.enableStress || false,
       authToken: body.authToken,
       doNotTestPatterns: body.doNotTestPatterns || [],
       userApprovedProduction: body.userApprovedProduction || false,
     };
 
     if (!config.projectId) {
       throw new Error("VALIDATION: projectId is required");
     }
 
     // ============================================
     // 3. VERIFY PROJECT OWNERSHIP
     // ============================================
     const { data: project, error: projectError } = await supabaseAdmin
       .from("projects")
       .select("id, user_id, environment, base_url, max_rps, do_not_test_routes")
       .eq("id", config.projectId)
       .maybeSingle();
 
     if (projectError || !project) {
       throw new Error("NOT_FOUND: Project not found");
     }
 
     if (project.user_id !== userId) {
       throw new Error("FORBIDDEN: You do not own this project");
     }
 
     logStep("Project verified", { projectId: project.id, environment: project.environment });
 
     // ============================================
     // 4. CHECK SUBSCRIPTION & LOAD ENTITLEMENTS
     // ============================================
     const { data: entitlements, error: entError } = await supabaseAdmin
       .rpc("get_user_entitlements", { p_user_id: userId });
 
     if (entError) {
       logStep("Entitlements error", { error: entError.message });
       throw new Error("INTERNAL: Failed to load entitlements");
     }
 
     const ent: Entitlements | null = entitlements?.[0] || null;
 
     if (!ent || !["active", "trialing"].includes(ent.subscription_status || "")) {
       throw new Error("SUBSCRIPTION_REQUIRED: Active subscription required to run scans");
     }
 
     logStep("Entitlements loaded", {
       tier: ent.tier_name,
       scanLimit: ent.scan_limit_per_month,
       allowSoak: ent.allow_soak,
       allowStress: ent.allow_stress,
     });
 
     // ============================================
     // 5. VALIDATE CONFIG AGAINST ENTITLEMENTS
     // ============================================
     const validationErrors: ValidationError[] = [];
 
     // Validate concurrency against tier
     if (config.maxConcurrency > ent.max_concurrency) {
       validationErrors.push({
         field: "maxConcurrency",
         message: `Max concurrency ${config.maxConcurrency} exceeds tier limit of ${ent.max_concurrency}`,
         code: "EXCEEDS_TIER_LIMIT",
       });
     }
 
     // Validate RPS (project-level cap overrides)
     const effectiveMaxRps = Math.min(config.maxRps, project.max_rps || 10);
     if (config.maxRps > (project.max_rps || 10)) {
       logStep("RPS capped", { requested: config.maxRps, capped: effectiveMaxRps });
     }
 
     // Validate soak tests against tier
     if (config.enableSoak && !ent.allow_soak) {
       validationErrors.push({
         field: "enableSoak",
         message: "Soak tests require Production tier",
         code: "TIER_UPGRADE_REQUIRED",
       });
     }
 
     // Validate stress tests against tier
     if (config.enableStress && !ent.allow_stress) {
       validationErrors.push({
         field: "enableStress",
         message: "Stress tests require Production tier",
         code: "TIER_UPGRADE_REQUIRED",
       });
     }
 
     // Production environment requires approval for dangerous tests
     if (project.environment === "production") {
       if ((config.enableSoak || config.enableStress) && !config.userApprovedProduction) {
         validationErrors.push({
           field: "userApprovedProduction",
           message: "Production environment requires explicit approval for soak/stress tests",
           code: "PRODUCTION_APPROVAL_REQUIRED",
         });
       }
     }
 
     if (validationErrors.length > 0) {
       logStep("Validation failed", { errors: validationErrors });
       return new Response(
         JSON.stringify({
           error: "VALIDATION_FAILED",
           message: "Scan configuration failed validation",
           details: validationErrors,
         }),
         {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
           status: 400,
         }
       );
     }
 
      // ============================================
      // 6. ENFORCE MONTHLY SCAN CAP
      // ============================================
      // Internal test users bypass usage tracking entirely —
      // their scans must not pollute billing metrics or analytics.
      const { data: isTestUser } = await supabaseAdmin.rpc("is_internal_test_user", {
        p_user_id: userId,
      });

      let usageResult: number | null = null;

      if (isTestUser) {
        logStep("Test user — skipping usage increment", { userId });
        usageResult = 0; // Synthetic: unlimited
      } else {
        // Calculate period start (first of current month)
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

        const { data: usageData, error: usageError } = await supabaseAdmin
          .rpc("increment_scan_usage", {
            p_user_id: userId,
            p_period_start: periodStart,
            p_limit: ent.scan_limit_per_month,
          });

        if (usageError) {
          logStep("Usage increment error", { error: usageError.message });
          throw new Error("INTERNAL: Failed to check usage");
        }

        if (usageData === -1) {
          logStep("Usage limit exceeded", { limit: ent.scan_limit_per_month });
          return new Response(
            JSON.stringify({
              error: "USAGE_LIMIT_EXCEEDED",
              message: `Monthly scan limit of ${ent.scan_limit_per_month} reached`,
              limit: ent.scan_limit_per_month,
              tier: ent.tier_name,
              upgradeUrl: "/pricing",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 429,
            }
          );
        }

        usageResult = usageData;
        logStep("Usage incremented", { newCount: usageResult, limit: ent.scan_limit_per_month });
      }
 
     // ============================================
     // 7. DETERMINE TASKS TO CREATE
     // ============================================
     const allowAdvancedTests = 
       (config.enableSoak || config.enableStress) && 
       (project.environment !== "production" || config.userApprovedProduction);
 
     const tasksToCreate = TASK_DEFINITIONS.filter((task) => {
       // Skip auth-required tasks if URL-only mode
       if (task.requiresAuth && config.mode === "url_only") {
         return false;
       }
 
       // Skip non-prod-safe tasks for production without approval
       if (!task.safeForProd && project.environment === "production" && !config.userApprovedProduction) {
         return false;
       }
 
       // Gate soak/stress by entitlements
       if (task.type === "soak_test" && (!config.enableSoak || !ent.allow_soak)) {
         return false;
       }
       if (task.type === "stress_test" && (!config.enableStress || !ent.allow_stress)) {
         return false;
       }
 
       // Skip full ramp if production without approval
       if (task.type === "load_ramp_full" && project.environment === "production" && !config.userApprovedProduction) {
         return false;
       }
 
       // Skip light ramp if doing soak (which includes full ramp)
       if (task.type === "load_ramp_light" && config.enableSoak) {
         return false;
       }
 
       return true;
     });
 
     logStep("Tasks determined", { count: tasksToCreate.length, types: tasksToCreate.map((t) => t.type) });
 
     // ============================================
     // 8. CREATE SCAN RUN
     // ============================================
     const scanRunPayload = {
       project_id: config.projectId,
       mode: config.mode,
       status: ent.priority_queue ? "queued" : "pending",
       allow_advanced_tests: allowAdvancedTests,
       approved_for_production: config.userApprovedProduction,
       config: {
         projectId: config.projectId,
         mode: config.mode,
         maxRps: effectiveMaxRps,
         maxConcurrency: Math.min(config.maxConcurrency, ent.max_concurrency),
         enableSoak: config.enableSoak && ent.allow_soak,
         enableStress: config.enableStress && ent.allow_stress,
         doNotTestPatterns: [
           ...config.doNotTestPatterns,
           ...(project.do_not_test_routes || []),
         ],
         environment: project.environment,
         userApprovedProduction: config.userApprovedProduction,
         tier: ent.tier_name,
         retentionDays: ent.retention_days,
       },
       app_profile: {},
     };
 
     const { data: scanRun, error: scanRunError } = await supabaseAdmin
       .from("scan_runs")
       .insert(scanRunPayload)
       .select("id")
       .single();
 
     if (scanRunError || !scanRun) {
       logStep("Failed to create scan run", { error: scanRunError?.message });
       throw new Error("INTERNAL: Failed to create scan run");
     }
 
     logStep("Scan run created", { scanRunId: scanRun.id });
 
     // ============================================
     // 9. CREATE SCAN TASKS
     // ============================================
     const taskPayloads = tasksToCreate.map((task) => ({
       scan_run_id: scanRun.id,
       task_type: task.type,
       status: "pending",
       attempt_count: 0,
       max_attempts: 3,
       output: {},
     }));
 
     const { error: tasksError } = await supabaseAdmin
       .from("scan_tasks")
       .insert(taskPayloads);
 
     if (tasksError) {
       logStep("Failed to create tasks", { error: tasksError.message });
       // Rollback: delete the scan run
       await supabaseAdmin.from("scan_runs").delete().eq("id", scanRun.id);
       throw new Error("INTERNAL: Failed to create scan tasks");
     }
 
     logStep("Scan tasks created", { count: taskPayloads.length });
 
     // ============================================
     // 10. RETURN SUCCESS
     // ============================================
     return new Response(
       JSON.stringify({
         success: true,
         scanRunId: scanRun.id,
         status: scanRunPayload.status,
         tasksCreated: taskPayloads.length,
         taskTypes: tasksToCreate.map((t) => t.type),
          entitlements: {
            tier: ent.tier_name,
            scansUsed: usageResult ?? 0,
            scansLimit: ent.scan_limit_per_month,
           allowSoak: ent.allow_soak,
           allowStress: ent.allow_stress,
           retentionDays: ent.retention_days,
         },
         config: scanRunPayload.config,
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
         status: 201,
       }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     logStep("ERROR", { message: errorMessage });
 
     // Parse error type
     let status = 500;
     let errorCode = "INTERNAL_ERROR";
 
     if (errorMessage.startsWith("UNAUTHORIZED:")) {
       status = 401;
       errorCode = "UNAUTHORIZED";
     } else if (errorMessage.startsWith("FORBIDDEN:")) {
       status = 403;
       errorCode = "FORBIDDEN";
     } else if (errorMessage.startsWith("NOT_FOUND:")) {
       status = 404;
       errorCode = "NOT_FOUND";
     } else if (errorMessage.startsWith("VALIDATION:")) {
       status = 400;
       errorCode = "VALIDATION_ERROR";
     } else if (errorMessage.startsWith("SUBSCRIPTION_REQUIRED:")) {
       status = 402;
       errorCode = "SUBSCRIPTION_REQUIRED";
     }
 
     return new Response(
       JSON.stringify({
         error: errorCode,
         message: errorMessage.replace(/^[A-Z_]+:\s*/, ""),
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
         status,
       }
     );
   }
 });