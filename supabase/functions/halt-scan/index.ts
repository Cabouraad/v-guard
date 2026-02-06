import { createClient } from "@supabase/supabase-js";

const jsonHeaders = { "Content-Type": "application/json" };

const ALLOWED_ORIGINS = [
  "https://v-guard.lovable.app",
  "https://id-preview--f5ffb258-a61b-4eb2-a12c-ab21db0c5ae9.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

interface HaltRequest {
  scan_run_id: string;
  reason?: string;
}

interface HaltAudit {
  halted_by: string;
  halted_at: string;
  reason: string;
  stage_when_halted: string;
  tasks_canceled: number;
  tasks_completed_before_halt: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid auth token" }),
        { status: 401, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    const body: HaltRequest = await req.json();

    if (!body.scan_run_id) {
      return new Response(
        JSON.stringify({ success: false, error: "scan_run_id is required" }),
        { status: 400, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    // Fetch scan run and verify ownership via project
    const { data: scanRun, error: scanError } = await supabase
      .from("scan_runs")
      .select("*, project:projects(*)")
      .eq("id", body.scan_run_id)
      .single();

    if (scanError || !scanRun) {
      return new Response(
        JSON.stringify({ success: false, error: "Scan run not found" }),
        { status: 404, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    // Verify user owns this project
    if (scanRun.project?.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    // Only allow halting running or pending scans
    const haltableStatuses = ["running", "pending", "queued", "paused"];
    if (!haltableStatuses.includes(scanRun.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cannot halt scan in '${scanRun.status}' state`,
        }),
        { status: 409, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
      );
    }

    const now = new Date().toISOString();

    // Get current tasks to determine stage and counts
    const { data: tasks } = await supabase
      .from("scan_tasks")
      .select("id, task_type, status")
      .eq("scan_run_id", body.scan_run_id)
      .order("created_at", { ascending: true });

    const allTasks = tasks || [];
    const runningTask = allTasks.find((t) => t.status === "running");
    const completedBefore = allTasks.filter(
      (t) => t.status === "completed"
    ).length;

    // Determine current stage
    const stageMap: Record<string, string> = {
      fingerprint: "Fingerprint",
      tls_check: "Security Safe Checks",
      security_headers: "Security Safe Checks",
      cors_check: "Security Safe Checks",
      cookie_check: "Security Safe Checks",
      exposure_check: "Security Safe Checks",
      endpoint_discovery: "Security Safe Checks",
      injection_safe: "Security Safe Checks",
      graphql_introspection: "Security Safe Checks",
      perf_baseline: "Performance Baseline",
      load_ramp_light: "Load Ramp",
      load_ramp_full: "Load Ramp",
      soak_test: "Soak Test",
      stress_test: "Stress & Recovery",
      report_compile: "Report Compile",
    };
    const stageWhenHalted = runningTask
      ? stageMap[runningTask.task_type] || runningTask.task_type
      : "Initializing";

    // Cancel running tasks
    const tasksToCancel = allTasks.filter((t) =>
      ["running", "pending", "queued"].includes(t.status)
    );

    if (tasksToCancel.length > 0) {
      const cancelIds = tasksToCancel.map((t) => t.id);
      await supabase
        .from("scan_tasks")
        .update({
          status: "canceled",
          ended_at: now,
          error_message: "Halted by operator",
          error_detail: `Operator safety halt. Reason: ${body.reason || "No reason provided"}. Stage: ${stageWhenHalted}.`,
        })
        .in("id", cancelIds);
    }

    // Build audit log
    const audit: HaltAudit = {
      halted_by: user.email || user.id,
      halted_at: now,
      reason: body.reason || "No reason provided",
      stage_when_halted: stageWhenHalted,
      tasks_canceled: tasksToCancel.length,
      tasks_completed_before_halt: completedBefore,
    };

    // Update scan run status and store audit in error_summary
    await supabase
      .from("scan_runs")
      .update({
        status: "canceled",
        ended_at: now,
        error_summary: `OPERATOR HALT: ${audit.reason}`,
        error_message: JSON.stringify(audit),
      })
      .eq("id", body.scan_run_id);

    return new Response(
      JSON.stringify({ success: true, audit }),
      { headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
    );
  } catch (error) {
    console.error("Halt scan error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...jsonHeaders, ...getCorsHeaders(req) } }
    );
  }
});
