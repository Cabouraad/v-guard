import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
type ConfidenceLevel = "high" | "medium" | "low";
type ReadinessStatus = "go" | "caution" | "no-go";

interface ScanFinding {
  id: string;
  category: string;
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

interface ScanMetric {
  id: string;
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

interface ScanArtifact {
  id: string;
  artifact_type: string;
  storage_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ScanRun {
  id: string;
  project_id: string;
  mode: string;
  status: string;
  config: Record<string, unknown>;
  security_score?: number;
  reliability_score?: number;
  started_at?: string;
  ended_at?: string;
  error_message?: string;
}

interface Project {
  id: string;
  name: string;
  base_url: string;
  environment: string;
}

interface TestedItem {
  category: string;
  name: string;
  status: "tested" | "not-tested" | "partial";
  reason?: string;
}

interface ExecutiveSummary {
  securityScore: number;
  reliabilityScore: number;
  readiness: ReadinessStatus;
  readinessReason: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  totalFindings: number;
  scanDuration: string;
  scanMode: string;
  environment: string;
}

interface PerformanceSummary {
  overallP50Ms: number;
  overallP95Ms: number;
  overallP99Ms: number;
  peakRps: number;
  avgErrorRate: number;
  endpointCount: number;
  recommendedMaxRps?: number;
  recommendedMaxConcurrency?: number;
}

interface ReportModel {
  generatedAt: string;
  scanRunId: string;
  projectName: string;
  baseUrl: string;
  executiveSummary: ExecutiveSummary;
  performanceSummary: PerformanceSummary;
  findings: ScanFinding[];
  metrics: ScanMetric[];
  testedItems: TestedItem[];
  notTestedItems: TestedItem[];
  artifacts: ScanArtifact[];
}

// Severity weights for scoring
const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

// Severity sort order
const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const CONFIDENCE_ORDER: Record<ConfidenceLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// Calculate security score based on findings
function calculateSecurityScore(findings: ScanFinding[]): number {
  if (findings.length === 0) return 100;

  let deductions = 0;
  for (const finding of findings) {
    const weight = SEVERITY_WEIGHTS[finding.severity] || 0;
    // Higher confidence = higher deduction
    const confidenceMultiplier = finding.confidence === "high" ? 1 : finding.confidence === "medium" ? 0.7 : 0.4;
    deductions += weight * confidenceMultiplier;
  }

  return Math.max(0, Math.round(100 - deductions));
}

// Calculate reliability score based on metrics
function calculateReliabilityScore(metrics: ScanMetric[]): number {
  if (metrics.length === 0) return 100;

  let score = 100;
  
  for (const metric of metrics) {
    // Penalize high error rates
    if (metric.error_rate && metric.error_rate > 1) {
      score -= Math.min(30, metric.error_rate * 2);
    }
    
    // Penalize high timeout rates
    if (metric.timeout_rate && metric.timeout_rate > 1) {
      score -= Math.min(20, metric.timeout_rate * 3);
    }
    
    // Penalize very high latency
    if (metric.p95_ms && metric.p95_ms > 3000) {
      score -= Math.min(15, (metric.p95_ms - 3000) / 500);
    }
  }

  return Math.max(0, Math.round(score));
}

// Determine readiness status
function determineReadiness(
  securityScore: number,
  reliabilityScore: number,
  findings: ScanFinding[]
): { status: ReadinessStatus; reason: string } {
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHighConfidenceHigh = findings.some(
    (f) => f.severity === "high" && f.confidence === "high"
  );

  if (hasCritical) {
    return {
      status: "no-go",
      reason: "Critical security vulnerabilities detected that require immediate attention",
    };
  }

  if (hasHighConfidenceHigh || securityScore < 50) {
    return {
      status: "no-go",
      reason: "High-severity security issues with high confidence require remediation",
    };
  }

  if (securityScore < 70 || reliabilityScore < 60) {
    return {
      status: "caution",
      reason: "Some security or reliability concerns should be addressed before production",
    };
  }

  if (securityScore >= 85 && reliabilityScore >= 80) {
    return {
      status: "go",
      reason: "Application meets security and reliability standards for production deployment",
    };
  }

  return {
    status: "caution",
    reason: "Minor improvements recommended but application is generally production-ready",
  };
}

// Sort findings by severity then confidence
function sortFindings(findings: ScanFinding[]): ScanFinding[] {
  return [...findings].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
  });
}

// Generate tested/not-tested items from scan tasks and config
function generateTestedItems(
  scanRun: ScanRun,
  findings: ScanFinding[],
  metrics: ScanMetric[]
): { tested: TestedItem[]; notTested: TestedItem[] } {
  const tested: TestedItem[] = [];
  const notTested: TestedItem[] = [];

  // Security checks
  const securityCategories = ["tls", "headers", "cors", "cookies", "auth", "injection", "graphql", "exposure", "config"];
  const testedCategories = new Set(findings.map((f) => f.category));

  for (const category of securityCategories) {
    if (testedCategories.has(category)) {
      tested.push({ category: "security", name: getCategoryDisplayName(category), status: "tested" });
    } else {
      // Check if it was intentionally not tested
      const config = scanRun.config as Record<string, unknown>;
      if (category === "graphql" && !config?.graphqlEndpoint) {
        notTested.push({
          category: "security",
          name: getCategoryDisplayName(category),
          status: "not-tested",
          reason: "No GraphQL endpoint configured",
        });
      } else if (category === "auth" && scanRun.mode === "url_only") {
        notTested.push({
          category: "security",
          name: "Deep authentication testing",
          status: "not-tested",
          reason: "URL-only mode - no credentials provided",
        });
      } else {
        tested.push({ category: "security", name: getCategoryDisplayName(category), status: "tested" });
      }
    }
  }

  // Performance checks
  const hasBaselineMetrics = metrics.some((m) => m.metric_type === "perf_baseline");
  const hasRampMetrics = metrics.some((m) => m.metric_type.startsWith("load_ramp"));
  const hasSoakMetrics = metrics.some((m) => m.metric_type === "soak_test");
  const hasStressMetrics = metrics.some((m) => m.metric_type === "stress_test");

  if (hasBaselineMetrics) {
    tested.push({ category: "performance", name: "Baseline latency sampling", status: "tested" });
  } else {
    notTested.push({
      category: "performance",
      name: "Baseline latency sampling",
      status: "not-tested",
      reason: "Performance baseline task did not complete",
    });
  }

  if (hasRampMetrics) {
    tested.push({ category: "performance", name: "Progressive load ramp", status: "tested" });
  } else {
    notTested.push({
      category: "performance",
      name: "Progressive load ramp",
      status: "not-tested",
      reason: "Load ramp task did not complete",
    });
  }

  if (hasSoakMetrics) {
    tested.push({ category: "performance", name: "Soak test (extended duration)", status: "tested" });
  } else {
    const config = scanRun.config as Record<string, unknown>;
    const env = config?.environment as string;
    if (env === "production") {
      notTested.push({
        category: "performance",
        name: "Soak test",
        status: "not-tested",
        reason: "Soak tests require staging environment or explicit approval",
      });
    }
  }

  if (hasStressMetrics) {
    tested.push({ category: "performance", name: "Stress/recovery test", status: "tested" });
  } else {
    const config = scanRun.config as Record<string, unknown>;
    const env = config?.environment as string;
    if (env === "production") {
      notTested.push({
        category: "performance",
        name: "Stress/recovery test",
        status: "not-tested",
        reason: "Stress tests require staging environment or explicit approval",
      });
    }
  }

  return { tested, notTested };
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    tls: "TLS/HTTPS Configuration",
    headers: "Security Headers",
    cors: "CORS Configuration",
    cookies: "Cookie Security",
    auth: "Authentication",
    injection: "Injection Vulnerabilities",
    graphql: "GraphQL Security",
    exposure: "Sensitive Data Exposure",
    config: "Security Configuration",
    performance: "Performance",
    other: "Other",
  };
  return names[category] || category;
}

// Calculate performance summary
function calculatePerformanceSummary(metrics: ScanMetric[]): PerformanceSummary {
  const baselineMetrics = metrics.filter((m) => m.metric_type === "perf_baseline");
  const rampMetrics = metrics.filter((m) => m.metric_type.startsWith("load_ramp"));

  const allP50 = [...baselineMetrics, ...rampMetrics].map((m) => m.p50_ms || 0).filter((v) => v > 0);
  const allP95 = [...baselineMetrics, ...rampMetrics].map((m) => m.p95_ms || 0).filter((v) => v > 0);
  const allP99 = [...baselineMetrics, ...rampMetrics].map((m) => m.p99_ms || 0).filter((v) => v > 0);
  const allRps = [...baselineMetrics, ...rampMetrics].map((m) => m.rps || 0).filter((v) => v > 0);
  const allErrors = [...baselineMetrics, ...rampMetrics].map((m) => m.error_rate || 0);

  return {
    overallP50Ms: allP50.length > 0 ? Math.round(allP50.reduce((a, b) => a + b, 0) / allP50.length) : 0,
    overallP95Ms: allP95.length > 0 ? Math.round(allP95.reduce((a, b) => a + b, 0) / allP95.length) : 0,
    overallP99Ms: allP99.length > 0 ? Math.round(allP99.reduce((a, b) => a + b, 0) / allP99.length) : 0,
    peakRps: allRps.length > 0 ? Math.round(Math.max(...allRps)) : 0,
    avgErrorRate: allErrors.length > 0 ? Math.round((allErrors.reduce((a, b) => a + b, 0) / allErrors.length) * 100) / 100 : 0,
    endpointCount: new Set(baselineMetrics.map((m) => m.endpoint).filter(Boolean)).size,
  };
}

// Format duration
function formatDuration(startAt?: string, endAt?: string): string {
  if (!startAt || !endAt) return "N/A";
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const durationMs = end - start;
  
  if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  }
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Generate JSON report model
function generateReportModel(
  scanRun: ScanRun,
  project: Project,
  findings: ScanFinding[],
  metrics: ScanMetric[],
  artifacts: ScanArtifact[]
): ReportModel {
  const sortedFindings = sortFindings(findings);
  const securityScore = calculateSecurityScore(findings);
  const reliabilityScore = calculateReliabilityScore(metrics);
  const { status: readiness, reason: readinessReason } = determineReadiness(securityScore, reliabilityScore, findings);
  const { tested, notTested } = generateTestedItems(scanRun, findings, metrics);
  const perfSummary = calculatePerformanceSummary(metrics);

  const severityCounts = {
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
    mediumCount: findings.filter((f) => f.severity === "medium").length,
    lowCount: findings.filter((f) => f.severity === "low").length,
    infoCount: findings.filter((f) => f.severity === "info").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    scanRunId: scanRun.id,
    projectName: project.name,
    baseUrl: project.base_url,
    executiveSummary: {
      securityScore,
      reliabilityScore,
      readiness,
      readinessReason,
      ...severityCounts,
      totalFindings: findings.length,
      scanDuration: formatDuration(scanRun.started_at, scanRun.ended_at),
      scanMode: scanRun.mode,
      environment: project.environment,
    },
    performanceSummary: perfSummary,
    findings: sortedFindings,
    metrics,
    testedItems: tested,
    notTestedItems: notTested,
    artifacts,
  };
}

// Generate HTML report
function generateHtmlReport(model: ReportModel): string {
  const { executiveSummary: es, performanceSummary: ps, findings, testedItems, notTestedItems } = model;

  const readinessColors: Record<ReadinessStatus, string> = {
    go: "#22c55e",
    caution: "#f59e0b",
    "no-go": "#ef4444",
  };

  const severityColors: Record<SeverityLevel, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#2563eb",
    info: "#6b7280",
  };

  const findingsHtml = findings
    .map(
      (f) => `
    <div class="finding ${f.severity}">
      <div class="finding-header">
        <span class="severity-badge" style="background: ${severityColors[f.severity]}">${f.severity.toUpperCase()}</span>
        <span class="confidence-badge">${f.confidence} confidence</span>
        <h3>${escapeHtml(f.title)}</h3>
      </div>
      <p class="description">${escapeHtml(f.description)}</p>
      ${f.endpoint ? `<p class="endpoint"><strong>Endpoint:</strong> <code>${escapeHtml(f.endpoint)}</code></p>` : ""}
      ${f.evidence_redacted ? `
      <div class="evidence">
        <h4>Evidence (Redacted)</h4>
        <pre>${escapeHtml(f.evidence_redacted)}</pre>
      </div>
      ` : ""}
      ${f.repro_steps && f.repro_steps.length > 0 ? `
      <div class="repro-steps">
        <h4>Reproduction Steps</h4>
        <ol>${f.repro_steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
      </div>
      ` : ""}
      ${f.fix_recommendation ? `
      <div class="fix-recommendation">
        <h4>Recommended Fix</h4>
        <p>${escapeHtml(f.fix_recommendation)}</p>
      </div>
      ` : ""}
      ${f.lovable_fix_prompt ? `
      <div class="lovable-prompt">
        <h4>🔧 Lovable Fix Prompt</h4>
        <pre class="prompt-box">${escapeHtml(f.lovable_fix_prompt)}</pre>
        <button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)" class="copy-btn">Copy Prompt</button>
      </div>
      ` : ""}
    </div>
  `
    )
    .join("");

  const testedHtml = testedItems
    .map((t) => `<li class="tested">✓ ${escapeHtml(t.name)}</li>`)
    .join("");

  const notTestedHtml = notTestedItems
    .map((t) => `<li class="not-tested">✗ ${escapeHtml(t.name)}${t.reason ? ` <span class="reason">(${escapeHtml(t.reason)})</span>` : ""}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Report - ${escapeHtml(model.projectName)}</title>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a24;
      --text-primary: #f4f4f5;
      --text-secondary: #a1a1aa;
      --border: #27272a;
      --accent: #8b5cf6;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 2rem;
    }
    
    .container { max-width: 1200px; margin: 0 auto; }
    
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    
    .logo { font-size: 2.5rem; font-weight: bold; color: var(--accent); }
    h1 { font-size: 1.5rem; color: var(--text-secondary); margin-top: 0.5rem; }
    
    .meta {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .executive-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .score-card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid var(--border);
    }
    
    .score-card h3 { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .score-value { font-size: 3rem; font-weight: bold; }
    .score-label { color: var(--text-secondary); font-size: 0.875rem; }
    
    .readiness-card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 3rem;
      border: 1px solid var(--border);
    }
    
    .readiness-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 999px;
      font-weight: bold;
      font-size: 1.25rem;
      text-transform: uppercase;
    }
    
    .readiness-reason { color: var(--text-secondary); margin-top: 1rem; }
    
    .section {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border);
    }
    
    .section h2 {
      color: var(--accent);
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    .finding {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid var(--border);
    }
    
    .finding.critical { border-left-color: #dc2626; }
    .finding.high { border-left-color: #ea580c; }
    .finding.medium { border-left-color: #d97706; }
    .finding.low { border-left-color: #2563eb; }
    .finding.info { border-left-color: #6b7280; }
    
    .finding-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      color: white;
      font-size: 0.75rem;
      font-weight: bold;
    }
    
    .confidence-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      background: var(--bg-primary);
      color: var(--text-secondary);
      font-size: 0.75rem;
    }
    
    .finding h3 { color: var(--text-primary); flex: 1; }
    .description { color: var(--text-secondary); margin-bottom: 1rem; }
    .endpoint code { background: var(--bg-primary); padding: 0.25rem 0.5rem; border-radius: 4px; }
    
    .evidence, .repro-steps, .fix-recommendation, .lovable-prompt {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: 8px;
    }
    
    .evidence h4, .repro-steps h4, .fix-recommendation h4, .lovable-prompt h4 {
      color: var(--accent);
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }
    
    pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.875rem;
    }
    
    .prompt-box {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      border: 1px solid var(--accent);
    }
    
    .copy-btn {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    .copy-btn:hover { opacity: 0.9; }
    
    .coverage-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    
    .coverage-list { list-style: none; }
    .coverage-list li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
    .tested { color: #22c55e; }
    .not-tested { color: #f59e0b; }
    .reason { color: var(--text-secondary); font-size: 0.875rem; }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    
    .metric-item {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    
    .metric-value { font-size: 1.5rem; font-weight: bold; color: var(--accent); }
    .metric-label { font-size: 0.75rem; color: var(--text-secondary); }
    
    .severity-summary {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .severity-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .severity-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    footer {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }
    
    @media (max-width: 768px) {
      .coverage-grid { grid-template-columns: 1fr; }
      .executive-summary { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">🛡️ VibeGuard</div>
      <h1>Security & Performance Report</h1>
      <div class="meta">
        <span><strong>Project:</strong> ${escapeHtml(model.projectName)}</span>
        <span><strong>URL:</strong> ${escapeHtml(model.baseUrl)}</span>
        <span><strong>Generated:</strong> ${new Date(model.generatedAt).toLocaleString()}</span>
      </div>
    </header>

    <section class="executive-summary">
      <div class="score-card">
        <h3>Security Score</h3>
        <div class="score-value" style="color: ${es.securityScore >= 70 ? "#22c55e" : es.securityScore >= 50 ? "#f59e0b" : "#ef4444"}">${es.securityScore}</div>
        <div class="score-label">out of 100</div>
      </div>
      <div class="score-card">
        <h3>Reliability Score</h3>
        <div class="score-value" style="color: ${es.reliabilityScore >= 70 ? "#22c55e" : es.reliabilityScore >= 50 ? "#f59e0b" : "#ef4444"}">${es.reliabilityScore}</div>
        <div class="score-label">out of 100</div>
      </div>
      <div class="score-card">
        <h3>Total Findings</h3>
        <div class="score-value">${es.totalFindings}</div>
        <div class="severity-summary">
          ${es.criticalCount > 0 ? `<span class="severity-item"><span class="severity-dot" style="background: #dc2626"></span>${es.criticalCount} Critical</span>` : ""}
          ${es.highCount > 0 ? `<span class="severity-item"><span class="severity-dot" style="background: #ea580c"></span>${es.highCount} High</span>` : ""}
          ${es.mediumCount > 0 ? `<span class="severity-item"><span class="severity-dot" style="background: #d97706"></span>${es.mediumCount} Medium</span>` : ""}
        </div>
      </div>
      <div class="score-card">
        <h3>Scan Duration</h3>
        <div class="score-value" style="font-size: 1.5rem">${es.scanDuration}</div>
        <div class="score-label">${es.scanMode} mode • ${es.environment}</div>
      </div>
    </section>

    <div class="readiness-card">
      <h2 style="margin-bottom: 1rem;">Deployment Readiness</h2>
      <span class="readiness-badge" style="background: ${readinessColors[es.readiness]}; color: white;">
        ${es.readiness === "go" ? "✓ GO" : es.readiness === "caution" ? "⚠ CAUTION" : "✗ NO-GO"}
      </span>
      <p class="readiness-reason">${escapeHtml(es.readinessReason)}</p>
    </div>

    ${ps.endpointCount > 0 ? `
    <section class="section">
      <h2>📊 Performance Summary</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-value">${ps.overallP50Ms}ms</div>
          <div class="metric-label">P50 Latency</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${ps.overallP95Ms}ms</div>
          <div class="metric-label">P95 Latency</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${ps.overallP99Ms}ms</div>
          <div class="metric-label">P99 Latency</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${ps.peakRps}</div>
          <div class="metric-label">Peak RPS</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${ps.avgErrorRate}%</div>
          <div class="metric-label">Avg Error Rate</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${ps.endpointCount}</div>
          <div class="metric-label">Endpoints Tested</div>
        </div>
      </div>
    </section>
    ` : ""}

    <section class="section">
      <h2>🔍 Security Findings</h2>
      ${findings.length > 0 ? findingsHtml : '<p style="color: var(--text-secondary);">No security findings detected. Great job! 🎉</p>'}
    </section>

    <section class="section">
      <h2>📋 Test Coverage</h2>
      <div class="coverage-grid">
        <div>
          <h3 style="color: #22c55e; margin-bottom: 1rem;">✓ Tested</h3>
          <ul class="coverage-list">${testedHtml || '<li class="tested">All planned checks completed</li>'}</ul>
        </div>
        <div>
          <h3 style="color: #f59e0b; margin-bottom: 1rem;">✗ Not Tested</h3>
          <ul class="coverage-list">${notTestedHtml || '<li style="color: var(--text-secondary);">All applicable checks were performed</li>'}</ul>
        </div>
      </div>
    </section>

    <footer>
      <p>Report generated by VibeGuard Security Scanner</p>
      <p>Scan ID: ${escapeHtml(model.scanRunId)}</p>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { scan_run_id, format = "both" } = await req.json();

    if (!scan_run_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing scan_run_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch scan run with project
    const { data: scanRun, error: scanError } = await supabase
      .from("scan_runs")
      .select("*, projects(*)")
      .eq("id", scan_run_id)
      .maybeSingle();

    if (scanError || !scanRun) {
      return new Response(
        JSON.stringify({ success: false, error: "Scan run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch findings
    const { data: findings } = await supabase
      .from("scan_findings")
      .select("*")
      .eq("scan_run_id", scan_run_id);

    // Fetch metrics
    const { data: metrics } = await supabase
      .from("scan_metrics")
      .select("*")
      .eq("scan_run_id", scan_run_id);

    // Fetch artifacts
    const { data: artifacts } = await supabase
      .from("scan_artifacts")
      .select("*")
      .eq("scan_run_id", scan_run_id);

    const project = scanRun.projects as Project;

    // Generate report model
    const reportModel = generateReportModel(
      scanRun as ScanRun,
      project,
      (findings || []) as ScanFinding[],
      (metrics || []) as ScanMetric[],
      (artifacts || []) as ScanArtifact[]
    );

    // Update scan run with calculated scores
    await supabase
      .from("scan_runs")
      .update({
        security_score: reportModel.executiveSummary.securityScore,
        reliability_score: reportModel.executiveSummary.reliabilityScore,
      })
      .eq("id", scan_run_id);

    // Return based on format
    if (format === "json") {
      return new Response(JSON.stringify({ success: true, report: reportModel }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "html") {
      const html = generateHtmlReport(reportModel);
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Both formats
    const html = generateHtmlReport(reportModel);
    return new Response(
      JSON.stringify({
        success: true,
        report: reportModel,
        html,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Report generator error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
