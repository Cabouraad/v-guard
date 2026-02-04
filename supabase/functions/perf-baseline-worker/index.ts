import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SafetyConfig {
  maxRps: number;
  maxConcurrency: number;
  duration: number; // seconds
  environment: "production" | "staging" | "development";
  doNotTestRoutes: string[];
}

interface CandidateEndpoint {
  url: string;
  method: "GET" | "HEAD";
  name: string;
  priority: number;
}

interface LatencySample {
  endpoint: string;
  latencyMs: number;
  statusCode: number;
  success: boolean;
  timestamp: number;
  error?: string;
}

interface EndpointMetrics {
  endpoint: string;
  samples: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  errorRate: number;
  timeoutRate: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  rps: number;
}

interface ReliabilityFlag {
  type: "timeout_burst" | "error_burst" | "high_latency" | "unstable";
  endpoint: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

interface WorkerInput {
  scan_run_id: string;
  base_url: string;
  candidate_endpoints?: CandidateEndpoint[];
  safety_config: SafetyConfig;
}

interface WorkerOutput {
  success: boolean;
  metrics: EndpointMetrics[];
  reliabilityFlags: ReliabilityFlag[];
  notTested: { endpoint: string; reason: string }[];
  summary: {
    totalEndpoints: number;
    testedEndpoints: number;
    totalSamples: number;
    overallP50Ms: number;
    overallP95Ms: number;
    overallErrorRate: number;
    duration: number;
  };
}

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

// Rate limiter to enforce max RPS
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxRps: number) {
    this.maxTokens = maxRps;
    this.tokens = maxRps;
    this.refillRate = maxRps;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.tokens = 0;
    } else {
      this.tokens -= 1;
    }
  }
}

// Sample a single endpoint
async function sampleEndpoint(
  endpoint: CandidateEndpoint,
  scanRunId: string,
  timeoutMs: number = 10000
): Promise<LatencySample> {
  const startTime = performance.now();
  const timestamp = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "User-Agent": "VibeGuard-PerfWorker/1.0",
        "X-Scan-Run-Id": scanRunId,
        Accept: "text/html,application/json,*/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = performance.now() - startTime;

    return {
      endpoint: endpoint.url,
      latencyMs,
      statusCode: response.status,
      success: response.status >= 200 && response.status < 400,
      timestamp,
    };
  } catch (error) {
    const latencyMs = performance.now() - startTime;
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      endpoint: endpoint.url,
      latencyMs,
      statusCode: isTimeout ? 0 : -1,
      success: false,
      timestamp,
      error: isTimeout ? "timeout" : (error instanceof Error ? error.message : "unknown error"),
    };
  }
}

// Calculate metrics from samples
function calculateMetrics(
  endpoint: string,
  samples: LatencySample[],
  durationSeconds: number
): EndpointMetrics {
  const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
  const successCount = samples.filter((s) => s.success).length;
  const errorCount = samples.filter((s) => !s.success && s.error !== "timeout").length;
  const timeoutCount = samples.filter((s) => s.error === "timeout").length;

  return {
    endpoint,
    samples: samples.length,
    p50Ms: Math.round(percentile(latencies, 50)),
    p95Ms: Math.round(percentile(latencies, 95)),
    p99Ms: Math.round(percentile(latencies, 99)),
    avgMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    minMs: Math.round(Math.min(...latencies)),
    maxMs: Math.round(Math.max(...latencies)),
    errorRate: samples.length > 0 ? (errorCount / samples.length) * 100 : 0,
    timeoutRate: samples.length > 0 ? (timeoutCount / samples.length) * 100 : 0,
    successCount,
    errorCount,
    timeoutCount,
    rps: durationSeconds > 0 ? samples.length / durationSeconds : 0,
  };
}

// Detect reliability issues
function detectReliabilityFlags(
  metrics: EndpointMetrics[],
  samples: Map<string, LatencySample[]>
): ReliabilityFlag[] {
  const flags: ReliabilityFlag[] = [];

  for (const metric of metrics) {
    // High error rate
    if (metric.errorRate > 10) {
      flags.push({
        type: "error_burst",
        endpoint: metric.endpoint,
        description: `Error rate of ${metric.errorRate.toFixed(1)}% exceeds 10% threshold`,
        severity: metric.errorRate > 25 ? "critical" : "warning",
      });
    }

    // High timeout rate
    if (metric.timeoutRate > 5) {
      flags.push({
        type: "timeout_burst",
        endpoint: metric.endpoint,
        description: `Timeout rate of ${metric.timeoutRate.toFixed(1)}% indicates potential availability issues`,
        severity: metric.timeoutRate > 15 ? "critical" : "warning",
      });
    }

    // High latency
    if (metric.p95Ms > 3000) {
      flags.push({
        type: "high_latency",
        endpoint: metric.endpoint,
        description: `P95 latency of ${metric.p95Ms}ms exceeds 3 second threshold`,
        severity: metric.p95Ms > 10000 ? "critical" : "warning",
      });
    }

    // Unstable latency (high variance)
    const variance = metric.maxMs - metric.minMs;
    if (variance > metric.avgMs * 2 && metric.samples >= 5) {
      flags.push({
        type: "unstable",
        endpoint: metric.endpoint,
        description: `High latency variance (${metric.minMs}ms - ${metric.maxMs}ms) indicates unstable performance`,
        severity: "info",
      });
    }

    // Check for error bursts in samples
    const endpointSamples = samples.get(metric.endpoint) || [];
    let consecutiveErrors = 0;
    let maxConsecutiveErrors = 0;

    for (const sample of endpointSamples) {
      if (!sample.success) {
        consecutiveErrors++;
        maxConsecutiveErrors = Math.max(maxConsecutiveErrors, consecutiveErrors);
      } else {
        consecutiveErrors = 0;
      }
    }

    if (maxConsecutiveErrors >= 3) {
      flags.push({
        type: "error_burst",
        endpoint: metric.endpoint,
        description: `Detected ${maxConsecutiveErrors} consecutive failures indicating potential availability issues`,
        severity: maxConsecutiveErrors >= 5 ? "critical" : "warning",
      });
    }
  }

  return flags;
}

// Store metrics to database
async function storeMetrics(
  supabase: ReturnType<typeof createClient>,
  scanRunId: string,
  metrics: EndpointMetrics[]
): Promise<void> {
  const metricsToInsert = metrics.map((m) => ({
    scan_run_id: scanRunId,
    metric_type: "perf_baseline",
    endpoint: m.endpoint,
    p50_ms: m.p50Ms,
    p95_ms: m.p95Ms,
    p99_ms: m.p99Ms,
    rps: m.rps,
    error_rate: m.errorRate,
    timeout_rate: m.timeoutRate,
    sample_count: m.samples,
  }));

  if (metricsToInsert.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("scan_metrics").insert(metricsToInsert);
    if (error) {
      console.error("Failed to store metrics:", error);
    }
  }
}

// Main worker function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runPerfBaseline(
  supabase: any,
  input: WorkerInput
): Promise<WorkerOutput> {
  const { scan_run_id, base_url, candidate_endpoints, safety_config } = input;
  const notTested: { endpoint: string; reason: string }[] = [];
  const allSamples = new Map<string, LatencySample[]>();

  // Build list of endpoints to test
  const endpoints: CandidateEndpoint[] = [];

  // Always test homepage
  endpoints.push({
    url: base_url,
    method: "GET",
    name: "homepage",
    priority: 1,
  });

  // Add candidate endpoints
  if (candidate_endpoints && candidate_endpoints.length > 0) {
    for (const endpoint of candidate_endpoints) {
      if (isDoNotTestRoute(endpoint.url, safety_config.doNotTestRoutes)) {
        notTested.push({
          endpoint: endpoint.url,
          reason: "Excluded by DO_NOT_TEST configuration",
        });
        continue;
      }
      endpoints.push(endpoint);
    }
  }

  // Sort by priority and limit endpoints for safety
  const maxEndpoints = safety_config.environment === "production" ? 5 : 10;
  const sortedEndpoints = endpoints.sort((a, b) => a.priority - b.priority).slice(0, maxEndpoints);

  if (sortedEndpoints.length < endpoints.length) {
    const skipped = endpoints.slice(maxEndpoints);
    for (const ep of skipped) {
      notTested.push({
        endpoint: ep.url,
        reason: `Skipped to stay within ${maxEndpoints} endpoint limit for ${safety_config.environment} environment`,
      });
    }
  }

  // Initialize rate limiter
  const rateLimiter = new RateLimiter(safety_config.maxRps);

  // Calculate samples per endpoint based on duration
  const samplesPerEndpoint = Math.max(
    5,
    Math.min(50, Math.floor((safety_config.duration * safety_config.maxRps) / sortedEndpoints.length))
  );

  const startTime = Date.now();

  // Sample each endpoint
  for (const endpoint of sortedEndpoints) {
    const endpointSamples: LatencySample[] = [];

    for (let i = 0; i < samplesPerEndpoint; i++) {
      // Check duration limit
      if ((Date.now() - startTime) / 1000 >= safety_config.duration) {
        break;
      }

      await rateLimiter.acquire();
      const sample = await sampleEndpoint(endpoint, scan_run_id);
      endpointSamples.push(sample);

      // Small delay between requests to the same endpoint
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    allSamples.set(endpoint.url, endpointSamples);
  }

  const actualDuration = (Date.now() - startTime) / 1000;

  // Calculate metrics for each endpoint
  const metrics: EndpointMetrics[] = [];
  for (const [endpoint, samples] of allSamples) {
    if (samples.length > 0) {
      metrics.push(calculateMetrics(endpoint, samples, actualDuration));
    }
  }

  // Detect reliability flags
  const reliabilityFlags = detectReliabilityFlags(metrics, allSamples);

  // Store metrics to database
  await storeMetrics(supabase, scan_run_id, metrics);

  // Calculate overall summary
  const allLatencies = Array.from(allSamples.values())
    .flat()
    .map((s) => s.latencyMs)
    .sort((a, b) => a - b);

  const totalSamples = allLatencies.length;
  const totalErrors = Array.from(allSamples.values())
    .flat()
    .filter((s) => !s.success).length;

  const summary = {
    totalEndpoints: sortedEndpoints.length + notTested.length,
    testedEndpoints: sortedEndpoints.length,
    totalSamples,
    overallP50Ms: Math.round(percentile(allLatencies, 50)),
    overallP95Ms: Math.round(percentile(allLatencies, 95)),
    overallErrorRate: totalSamples > 0 ? (totalErrors / totalSamples) * 100 : 0,
    duration: Math.round(actualDuration),
  };

  return {
    success: true,
    metrics,
    reliabilityFlags,
    notTested,
    summary,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: WorkerInput = await req.json();

    // Validate input
    if (!input.scan_run_id || !input.base_url || !input.safety_config) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce safety limits
    const safeConfig: SafetyConfig = {
      maxRps: Math.min(input.safety_config.maxRps || 5, 10), // Cap at 10 RPS
      maxConcurrency: Math.min(input.safety_config.maxConcurrency || 2, 5),
      duration: Math.min(input.safety_config.duration || 30, 120), // Cap at 2 minutes
      environment: input.safety_config.environment || "production",
      doNotTestRoutes: input.safety_config.doNotTestRoutes || [],
    };

    const result = await runPerfBaseline(supabase, {
      ...input,
      safety_config: safeConfig,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Perf baseline worker error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
