import { createClient } from "@supabase/supabase-js";

// Internal worker — no CORS needed. Called server-to-server only.
const jsonHeaders = { "Content-Type": "application/json" };

interface RampStep {
  concurrency: number;
  durationSeconds: number;
  targetRps: number;
}

interface EndpointToTest {
  url: string;
  method: "GET" | "HEAD";
  name: string;
}

interface EnvironmentGating {
  environment: "production" | "staging" | "development";
  userApprovedProduction: boolean;
  allowFullRamp: boolean;
}

interface WorkerInput {
  scan_run_id: string;
  endpoints_to_test: EndpointToTest[];
  target_concurrency: number;
  max_rps: number;
  ramp_schedule: RampStep[];
  environment_gating: EnvironmentGating;
  do_not_test_routes: string[];
}

interface StepMetrics {
  step: number;
  concurrency: number;
  targetRps: number;
  actualRps: number;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  errorRate: number;
  timeoutRate: number;
  durationMs: number;
}

interface KneePoint {
  detected: boolean;
  step?: number;
  concurrency?: number;
  rps?: number;
  reason?: string;
  latencyJump?: number;
  errorJump?: number;
}

interface RecommendedLimits {
  maxSafeRps: number;
  maxSafeConcurrency: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface FailureHypothesis {
  hypothesis: string;
  confidence: "low" | "medium";
  indicators: string[];
}

interface WorkerOutput {
  success: boolean;
  aborted: boolean;
  abortReason?: string;
  stepResults: StepMetrics[];
  kneePoint: KneePoint;
  recommendedLimits: RecommendedLimits;
  failureHypotheses: FailureHypothesis[];
  notTested: { endpoint: string; reason: string }[];
  summary: {
    totalSteps: number;
    completedSteps: number;
    peakRps: number;
    peakConcurrency: number;
    finalErrorRate: number;
    totalDurationMs: number;
  };
}

// Circuit breaker thresholds
const CIRCUIT_BREAKER = {
  errorRateThreshold: 25, // Abort if error rate exceeds 25%
  timeoutRateThreshold: 15, // Abort if timeout rate exceeds 15%
  consecutiveFailures: 10, // Abort after 10 consecutive failures
  latencyThresholdMs: 30000, // Abort if p95 exceeds 30s
};

// Calculate percentile from sorted array
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

// Check if URL matches any do-not-test pattern
function isDoNotTestRoute(url: string, patterns: string[]): boolean {
  const urlPath = new URL(url).pathname;
  return patterns.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(urlPath);
    }
    return urlPath.includes(pattern);
  });
}

// Request sample structure
interface RequestSample {
  latencyMs: number;
  success: boolean;
  isTimeout: boolean;
  statusCode: number;
}

// Execute a single request
async function executeRequest(
  endpoint: EndpointToTest,
  scanRunId: string,
  timeoutMs: number = 10000
): Promise<RequestSample> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "User-Agent": "VibeGuard-LoadRamp/1.0",
        "X-Scan-Run-Id": scanRunId,
        Accept: "text/html,application/json,*/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = performance.now() - startTime;

    return {
      latencyMs,
      success: response.status >= 200 && response.status < 400,
      isTimeout: false,
      statusCode: response.status,
    };
  } catch (error) {
    const latencyMs = performance.now() - startTime;
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      latencyMs,
      success: false,
      isTimeout,
      statusCode: isTimeout ? 0 : -1,
    };
  }
}

// Execute a ramp step with concurrency control
async function executeRampStep(
  endpoints: EndpointToTest[],
  scanRunId: string,
  step: RampStep,
  stepNumber: number
): Promise<{ metrics: StepMetrics; shouldAbort: boolean; abortReason?: string }> {
  const samples: RequestSample[] = [];
  const startTime = performance.now();
  const stepDurationMs = step.durationSeconds * 1000;
  
  let consecutiveFailures = 0;
  let activeRequests = 0;
  const maxConcurrent = step.concurrency;
  
  // Calculate delay between requests to achieve target RPS
  const delayBetweenRequests = 1000 / step.targetRps;
  
  const pendingRequests: Promise<void>[] = [];
  let endpointIndex = 0;
  let shouldAbort = false;
  let abortReason: string | undefined;

  // Run requests for the step duration
  while (performance.now() - startTime < stepDurationMs && !shouldAbort) {
    // Wait if we've hit max concurrency
    while (activeRequests >= maxConcurrent) {
      await Promise.race(pendingRequests);
    }

    // Select endpoint (round-robin)
    const endpoint = endpoints[endpointIndex % endpoints.length];
    endpointIndex++;

    activeRequests++;
    const requestPromise = (async () => {
      const sample = await executeRequest(endpoint, scanRunId);
      samples.push(sample);

      // Track consecutive failures
      if (!sample.success) {
        consecutiveFailures++;
        if (consecutiveFailures >= CIRCUIT_BREAKER.consecutiveFailures) {
          shouldAbort = true;
          abortReason = `Circuit breaker: ${consecutiveFailures} consecutive failures`;
        }
      } else {
        consecutiveFailures = 0;
      }

      activeRequests--;
    })();

    pendingRequests.push(requestPromise);

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
  }

  // Wait for all pending requests
  await Promise.all(pendingRequests);

  const durationMs = performance.now() - startTime;

  // Calculate metrics
  const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
  const successCount = samples.filter((s) => s.success).length;
  const errorCount = samples.filter((s) => !s.success && !s.isTimeout).length;
  const timeoutCount = samples.filter((s) => s.isTimeout).length;

  const metrics: StepMetrics = {
    step: stepNumber,
    concurrency: step.concurrency,
    targetRps: step.targetRps,
    actualRps: samples.length / (durationMs / 1000),
    totalRequests: samples.length,
    successCount,
    errorCount,
    timeoutCount,
    p50Ms: Math.round(percentile(latencies, 50)),
    p95Ms: Math.round(percentile(latencies, 95)),
    p99Ms: Math.round(percentile(latencies, 99)),
    avgMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
    errorRate: samples.length > 0 ? (errorCount / samples.length) * 100 : 0,
    timeoutRate: samples.length > 0 ? (timeoutCount / samples.length) * 100 : 0,
    durationMs: Math.round(durationMs),
  };

  // Check circuit breaker thresholds
  if (!shouldAbort) {
    if (metrics.errorRate > CIRCUIT_BREAKER.errorRateThreshold) {
      shouldAbort = true;
      abortReason = `Circuit breaker: error rate ${metrics.errorRate.toFixed(1)}% exceeds ${CIRCUIT_BREAKER.errorRateThreshold}%`;
    } else if (metrics.timeoutRate > CIRCUIT_BREAKER.timeoutRateThreshold) {
      shouldAbort = true;
      abortReason = `Circuit breaker: timeout rate ${metrics.timeoutRate.toFixed(1)}% exceeds ${CIRCUIT_BREAKER.timeoutRateThreshold}%`;
    } else if (metrics.p95Ms > CIRCUIT_BREAKER.latencyThresholdMs) {
      shouldAbort = true;
      abortReason = `Circuit breaker: p95 latency ${metrics.p95Ms}ms exceeds ${CIRCUIT_BREAKER.latencyThresholdMs}ms threshold`;
    }
  }

  return { metrics, shouldAbort, abortReason };
}

// Detect knee point where performance degrades
function detectKneePoint(stepResults: StepMetrics[]): KneePoint {
  if (stepResults.length < 2) {
    return { detected: false };
  }

  for (let i = 1; i < stepResults.length; i++) {
    const prev = stepResults[i - 1];
    const curr = stepResults[i];

    // Check for latency jump (>50% increase in p95)
    const latencyJump = prev.p95Ms > 0 ? ((curr.p95Ms - prev.p95Ms) / prev.p95Ms) * 100 : 0;
    if (latencyJump > 50) {
      return {
        detected: true,
        step: curr.step,
        concurrency: curr.concurrency,
        rps: curr.actualRps,
        reason: "Significant latency increase detected",
        latencyJump,
      };
    }

    // Check for error rate jump (>10% increase)
    const errorJump = curr.errorRate - prev.errorRate;
    if (errorJump > 10) {
      return {
        detected: true,
        step: curr.step,
        concurrency: curr.concurrency,
        rps: curr.actualRps,
        reason: "Significant error rate increase detected",
        errorJump,
      };
    }

    // Check for throughput saturation (RPS stops increasing despite more concurrency)
    if (curr.concurrency > prev.concurrency && curr.actualRps <= prev.actualRps * 1.05) {
      return {
        detected: true,
        step: curr.step,
        concurrency: prev.concurrency, // Previous was the safe point
        rps: prev.actualRps,
        reason: "Throughput saturation detected - RPS no longer scaling with concurrency",
      };
    }
  }

  return { detected: false };
}

// Calculate recommended safe limits
function calculateRecommendedLimits(
  stepResults: StepMetrics[],
  kneePoint: KneePoint
): RecommendedLimits {
  if (stepResults.length === 0) {
    return {
      maxSafeRps: 1,
      maxSafeConcurrency: 1,
      confidence: "low",
      reasoning: "Insufficient data to determine safe limits",
    };
  }

  // Find the last step with acceptable error rate (<5%) and latency (<2s p95)
  let safeStep: StepMetrics | null = null;
  for (let i = stepResults.length - 1; i >= 0; i--) {
    const step = stepResults[i];
    if (step.errorRate < 5 && step.p95Ms < 2000) {
      safeStep = step;
      break;
    }
  }

  if (!safeStep) {
    // Even first step wasn't safe
    const first = stepResults[0];
    return {
      maxSafeRps: Math.max(1, Math.floor(first.actualRps * 0.5)),
      maxSafeConcurrency: 1,
      confidence: "low",
      reasoning: "Even baseline load showed degradation; recommend conservative limits",
    };
  }

  // If knee point was detected, recommend staying below it
  if (kneePoint.detected && kneePoint.rps && kneePoint.concurrency) {
    return {
      maxSafeRps: Math.floor(kneePoint.rps * 0.8), // 20% safety margin
      maxSafeConcurrency: Math.max(1, kneePoint.concurrency - 1),
      confidence: "medium",
      reasoning: `Knee point detected at ${kneePoint.rps.toFixed(1)} RPS; recommending 80% of that value`,
    };
  }

  // Use the highest safe step
  return {
    maxSafeRps: Math.floor(safeStep.actualRps),
    maxSafeConcurrency: safeStep.concurrency,
    confidence: stepResults.length >= 3 ? "medium" : "low",
    reasoning: `Based on ${stepResults.length} ramp steps; highest safe load observed at ${safeStep.actualRps.toFixed(1)} RPS`,
  };
}

// Generate failure hypotheses based on observed patterns
function generateFailureHypotheses(stepResults: StepMetrics[]): FailureHypothesis[] {
  const hypotheses: FailureHypothesis[] = [];

  if (stepResults.length === 0) return hypotheses;

  const lastStep = stepResults[stepResults.length - 1];
  const hasHighTimeouts = stepResults.some((s) => s.timeoutRate > 5);
  const hasHighErrors = stepResults.some((s) => s.errorRate > 10);
  const hasLatencySpike = stepResults.some((s, i) => {
    if (i === 0) return false;
    return s.p95Ms > stepResults[i - 1].p95Ms * 2;
  });

  // High timeout rate suggests connection/pool exhaustion
  if (hasHighTimeouts) {
    hypotheses.push({
      hypothesis: "Database connection pool exhaustion",
      confidence: "low",
      indicators: [
        "Elevated timeout rates during load increase",
        "Requests timing out rather than returning errors",
        "Latency spikes preceding timeouts",
      ],
    });

    hypotheses.push({
      hypothesis: "Upstream service rate limiting or timeout",
      confidence: "low",
      indicators: [
        "Timeout patterns consistent with external service limits",
        "May indicate third-party API rate limits",
      ],
    });
  }

  // Sudden error spikes suggest resource limits
  if (hasHighErrors) {
    hypotheses.push({
      hypothesis: "Memory or CPU resource exhaustion",
      confidence: "low",
      indicators: [
        "Error rate increased sharply with load",
        "500-series errors observed",
        "May indicate container/function scaling limits",
      ],
    });
  }

  // Latency growing linearly suggests queue buildup
  if (hasLatencySpike) {
    hypotheses.push({
      hypothesis: "Request queue buildup",
      confidence: "low",
      indicators: [
        "Latency increased disproportionately to load",
        "Possible single-threaded bottleneck",
        "Backend may be processing requests serially",
      ],
    });
  }

  // Throughput saturation
  const throughputFlattened = stepResults.length >= 2 &&
    stepResults[stepResults.length - 1].actualRps <= stepResults[stepResults.length - 2].actualRps * 1.1;
  
  if (throughputFlattened && lastStep.concurrency > 1) {
    hypotheses.push({
      hypothesis: "Backend throughput saturation",
      confidence: "low",
      indicators: [
        "RPS stopped increasing despite higher concurrency",
        "May indicate fixed worker pool or connection limit",
        "Consider horizontal scaling",
      ],
    });
  }

  return hypotheses;
}

// Store metrics to database
async function storeRampMetrics(
  supabase: any,
  scanRunId: string,
  stepResults: StepMetrics[]
): Promise<void> {
  const metricsToInsert = stepResults.map((m) => ({
    scan_run_id: scanRunId,
    metric_type: `load_ramp_step_${m.step}`,
    endpoint: "aggregate",
    p50_ms: m.p50Ms,
    p95_ms: m.p95Ms,
    p99_ms: m.p99Ms,
    rps: m.actualRps,
    error_rate: m.errorRate,
    timeout_rate: m.timeoutRate,
    sample_count: m.totalRequests,
  }));

  if (metricsToInsert.length > 0) {
    const { error } = await supabase.from("scan_metrics").insert(metricsToInsert);
    if (error) {
      console.error("Failed to store ramp metrics:", error);
    }
  }
}

// Generate default ramp schedule if not provided
function generateDefaultRampSchedule(
  maxRps: number,
  targetConcurrency: number,
  isProduction: boolean
): RampStep[] {
  const steps: RampStep[] = [];
  const numSteps = isProduction ? 3 : 5;
  
  for (let i = 1; i <= numSteps; i++) {
    const fraction = i / numSteps;
    steps.push({
      concurrency: Math.max(1, Math.ceil(targetConcurrency * fraction)),
      targetRps: Math.max(1, Math.ceil(maxRps * fraction)),
      durationSeconds: isProduction ? 10 : 15,
    });
  }

  return steps;
}

// Main worker function
async function runLoadRamp(
  supabase: any,
  input: WorkerInput
): Promise<WorkerOutput> {
  const {
    scan_run_id,
    endpoints_to_test,
    target_concurrency,
    max_rps,
    ramp_schedule,
    environment_gating,
    do_not_test_routes,
  } = input;

  const notTested: { endpoint: string; reason: string }[] = [];
  const stepResults: StepMetrics[] = [];

  // Filter endpoints
  const safeEndpoints = endpoints_to_test.filter((ep) => {
    if (isDoNotTestRoute(ep.url, do_not_test_routes)) {
      notTested.push({
        endpoint: ep.url,
        reason: "Excluded by DO_NOT_TEST configuration",
      });
      return false;
    }
    return true;
  });

  if (safeEndpoints.length === 0) {
    return {
      success: false,
      aborted: true,
      abortReason: "No endpoints available for testing after DO_NOT_TEST filtering",
      stepResults: [],
      kneePoint: { detected: false },
      recommendedLimits: {
        maxSafeRps: 1,
        maxSafeConcurrency: 1,
        confidence: "low",
        reasoning: "No endpoints tested",
      },
      failureHypotheses: [],
      notTested,
      summary: {
        totalSteps: 0,
        completedSteps: 0,
        peakRps: 0,
        peakConcurrency: 0,
        finalErrorRate: 0,
        totalDurationMs: 0,
      },
    };
  }

  // Environment gating - limit production tests
  const isProduction = environment_gating.environment === "production";
  const allowFullRamp = !isProduction || environment_gating.userApprovedProduction;

  // Cap limits for production
  const effectiveMaxRps = isProduction && !allowFullRamp ? Math.min(max_rps, 5) : max_rps;
  const effectiveMaxConcurrency = isProduction && !allowFullRamp ? Math.min(target_concurrency, 3) : target_concurrency;

  // Generate or use provided ramp schedule
  const schedule = ramp_schedule && ramp_schedule.length > 0
    ? ramp_schedule
    : generateDefaultRampSchedule(effectiveMaxRps, effectiveMaxConcurrency, isProduction);

  // Enforce max limits on schedule
  const safeSchedule = schedule.map((step) => ({
    ...step,
    targetRps: Math.min(step.targetRps, effectiveMaxRps),
    concurrency: Math.min(step.concurrency, effectiveMaxConcurrency),
  }));

  let aborted = false;
  let abortReason: string | undefined;
  const startTime = performance.now();

  // Execute each ramp step
  for (let i = 0; i < safeSchedule.length; i++) {
    const step = safeSchedule[i];
    console.log(`Executing ramp step ${i + 1}/${safeSchedule.length}: ${step.concurrency} concurrent, ${step.targetRps} RPS`);

    const result = await executeRampStep(safeEndpoints, scan_run_id, step, i + 1);
    stepResults.push(result.metrics);

    if (result.shouldAbort) {
      aborted = true;
      abortReason = result.abortReason;
      console.log(`Ramp aborted at step ${i + 1}: ${abortReason}`);
      break;
    }

    // Small cooldown between steps
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const totalDurationMs = performance.now() - startTime;

  // Store metrics
  await storeRampMetrics(supabase, scan_run_id, stepResults);

  // Analyze results
  const kneePoint = detectKneePoint(stepResults);
  const recommendedLimits = calculateRecommendedLimits(stepResults, kneePoint);
  const failureHypotheses = generateFailureHypotheses(stepResults);

  // Calculate summary
  const peakRps = Math.max(...stepResults.map((s) => s.actualRps), 0);
  const peakConcurrency = Math.max(...stepResults.map((s) => s.concurrency), 0);
  const lastStep = stepResults[stepResults.length - 1];

  return {
    success: !aborted,
    aborted,
    abortReason,
    stepResults,
    kneePoint,
    recommendedLimits,
    failureHypotheses,
    notTested,
    summary: {
      totalSteps: safeSchedule.length,
      completedSteps: stepResults.length,
      peakRps,
      peakConcurrency,
      finalErrorRate: lastStep?.errorRate || 0,
      totalDurationMs: Math.round(totalDurationMs),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: WorkerInput = await req.json();

    // Validate input
    if (!input.scan_run_id || !input.endpoints_to_test || input.endpoints_to_test.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: scan_run_id and endpoints_to_test" }),
        { status: 400, headers: jsonHeaders }
      );
    }

     // ============================================
     // SERVER-SIDE ENTITLEMENT RE-CHECK
     // Workers must verify gating before running
     // ============================================
     const { data: gatingCheck, error: gatingError } = await supabase
       .rpc("can_run_gated_task", {
         p_scan_run_id: input.scan_run_id,
         p_task_type: "load_ramp_full", // Check for full ramp permissions
       });
 
     if (gatingError) {
       console.error("Gating check error:", gatingError);
       return new Response(
         JSON.stringify({ success: false, error: "Failed to verify entitlements" }),
          { status: 500, headers: jsonHeaders }
       );
     }
 
     const gating = gatingCheck?.[0];
     if (!gating) {
       return new Response(
         JSON.stringify({ success: false, error: "Scan run not found" }),
         { status: 404, headers: jsonHeaders }
       );
     }
 
     console.log(`[LOAD-RAMP] Gating check: tier=${gating.tier_name}, allowed=${gating.allowed}, reason=${gating.reason}`);
 
     // Apply entitlement-enforced limits
     const entitlementMaxConcurrency = gating.max_concurrency || 2;
     const entitlementMaxRps = gating.max_rps || 10;
 
    // Enforce absolute safety limits
    const safeInput: WorkerInput = {
      ...input,
       max_rps: Math.min(input.max_rps || 10, entitlementMaxRps, 50), // Cap by entitlement AND absolute limit
       target_concurrency: Math.min(input.target_concurrency || 5, entitlementMaxConcurrency, 20), // Cap by entitlement AND absolute limit
      environment_gating: input.environment_gating || {
        environment: "production",
        userApprovedProduction: false,
        allowFullRamp: false,
      },
      do_not_test_routes: input.do_not_test_routes || [],
    };
 
     // If gating disallows and this is a full ramp, skip or limit
     if (!gating.allowed && input.ramp_schedule && input.ramp_schedule.length > 3) {
       console.log(`[LOAD-RAMP] Full ramp not allowed: ${gating.reason}. Limiting to light ramp.`);
       // Limit to 3 steps max (light ramp)
       safeInput.ramp_schedule = input.ramp_schedule.slice(0, 3);
     }

    const result = await runLoadRamp(supabase, safeInput);

    return new Response(JSON.stringify(result), {
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("Load ramp worker error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
