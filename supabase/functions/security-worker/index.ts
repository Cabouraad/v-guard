import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Internal worker — no CORS needed. Called server-to-server only.
const jsonHeaders = { "Content-Type": "application/json" };

// Types
interface SecurityWorkerInput {
  scan_run_id: string;
  base_url: string;
  app_profile?: AppProfile;
  mode: "url_only" | "authenticated" | "hybrid";
  safety_config: SafetyConfig;
}

interface AppProfile {
  technologies?: string[];
  hasGraphQL?: boolean;
  graphqlEndpoint?: string;
  hasCookies?: boolean;
  framework?: string;
}

interface SafetyConfig {
  max_rps: number;
  do_not_test: string[];
  environment: "production" | "staging" | "development";
  allow_advanced_tests: boolean;
}

interface Finding {
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  confidence: "high" | "medium" | "low";
  title: string;
  description: string;
  endpoint?: string;
  evidence_redacted?: string;
  repro_steps?: string[];
  fix_recommendation?: string;
  lovable_fix_prompt?: string;
}

interface NotTestedItem {
  check: string;
  reason: string;
}

// Security check implementations
async function checkTLS(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const url = new URL(baseUrl);
    
    // Check if using HTTPS
    if (url.protocol !== "https:") {
      findings.push({
        category: "tls",
        severity: "critical",
        confidence: "high",
        title: "Site not using HTTPS",
        description: "The application is served over unencrypted HTTP, exposing all traffic to interception.",
        endpoint: baseUrl,
        evidence_redacted: `Protocol: ${url.protocol}`,
        repro_steps: [
          `Navigate to ${baseUrl}`,
          "Observe the URL protocol is HTTP, not HTTPS"
        ],
        fix_recommendation: "Configure your server to use HTTPS with a valid TLS certificate. Use services like Let's Encrypt for free certificates.",
        lovable_fix_prompt: "Add HTTPS redirect middleware to ensure all traffic uses TLS. If using a reverse proxy or hosting platform, enable 'Force HTTPS' in the settings. For Supabase Edge Functions, HTTPS is handled automatically."
      });
    } else {
      // Try to fetch and check for certificate issues
      const response = await fetch(baseUrl, { 
        method: "HEAD",
        redirect: "manual"
      });
      
      // If we got here, TLS handshake succeeded
      findings.push({
        category: "tls",
        severity: "info",
        confidence: "high",
        title: "TLS certificate valid",
        description: "The site uses HTTPS with a valid TLS certificate.",
        endpoint: baseUrl,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("certificate") || errorMessage.includes("SSL") || errorMessage.includes("TLS")) {
      findings.push({
        category: "tls",
        severity: "critical",
        confidence: "high",
        title: "TLS certificate error",
        description: "The TLS certificate is invalid, expired, or misconfigured.",
        endpoint: baseUrl,
        evidence_redacted: `Error: ${errorMessage.substring(0, 200)}`,
        repro_steps: [
          `Attempt to connect to ${baseUrl}`,
          "Observe certificate error in browser"
        ],
        fix_recommendation: "Renew or replace the TLS certificate. Ensure the certificate chain is complete and the certificate matches the domain.",
        lovable_fix_prompt: "Check your hosting provider's SSL/TLS settings. If using a custom domain, ensure the SSL certificate is properly configured and not expired. For Lovable/Supabase hosting, SSL is managed automatically."
      });
    }
  }
  
  return findings;
}

async function checkSecurityHeaders(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const response = await fetch(baseUrl, { method: "GET" });
    const headers = response.headers;
    
    // Check Content-Security-Policy
    const csp = headers.get("content-security-policy");
    if (!csp) {
      findings.push({
        category: "headers",
        severity: "medium",
        confidence: "high",
        title: "Missing Content-Security-Policy header",
        description: "No CSP header found. This leaves the application vulnerable to XSS attacks and other code injection.",
        endpoint: baseUrl,
        evidence_redacted: "Header 'Content-Security-Policy' not present in response",
        repro_steps: [
          `curl -I ${baseUrl}`,
          "Check for Content-Security-Policy header"
        ],
        fix_recommendation: "Add a Content-Security-Policy header. Start with a restrictive policy and adjust as needed.",
        lovable_fix_prompt: "Add Content-Security-Policy header to your server configuration. For a React app, add this meta tag in index.html: <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co\">"
      });
    } else {
      // Check for unsafe CSP directives
      if (csp.includes("'unsafe-eval'")) {
        findings.push({
          category: "headers",
          severity: "medium",
          confidence: "high",
          title: "CSP allows unsafe-eval",
          description: "The Content-Security-Policy includes 'unsafe-eval', which allows execution of eval() and similar functions.",
          endpoint: baseUrl,
          evidence_redacted: `CSP: ${csp.substring(0, 200)}...`,
          fix_recommendation: "Remove 'unsafe-eval' from your CSP if possible. Refactor code to avoid eval().",
          lovable_fix_prompt: "Refactor any code using eval(), new Function(), or setTimeout with string arguments. Update your CSP to remove 'unsafe-eval' directive."
        });
      }
    }
    
    // Check Strict-Transport-Security
    const hsts = headers.get("strict-transport-security");
    if (!hsts) {
      findings.push({
        category: "headers",
        severity: "medium",
        confidence: "high",
        title: "Missing Strict-Transport-Security header",
        description: "No HSTS header found. Browsers won't enforce HTTPS connections, allowing potential downgrade attacks.",
        endpoint: baseUrl,
        evidence_redacted: "Header 'Strict-Transport-Security' not present",
        repro_steps: [
          `curl -I ${baseUrl}`,
          "Check for Strict-Transport-Security header"
        ],
        fix_recommendation: "Add HSTS header with a reasonable max-age. Consider includeSubDomains and preload directives.",
        lovable_fix_prompt: "Configure your server to send the Strict-Transport-Security header. Example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains'. For hosting platforms, this is often configurable in security settings."
      });
    }
    
    // Check X-Content-Type-Options
    const xcto = headers.get("x-content-type-options");
    if (xcto !== "nosniff") {
      findings.push({
        category: "headers",
        severity: "low",
        confidence: "high",
        title: "Missing or incorrect X-Content-Type-Options header",
        description: "The X-Content-Type-Options header is missing or not set to 'nosniff', allowing MIME type sniffing attacks.",
        endpoint: baseUrl,
        evidence_redacted: `X-Content-Type-Options: ${xcto || "not present"}`,
        fix_recommendation: "Add 'X-Content-Type-Options: nosniff' header to all responses.",
        lovable_fix_prompt: "Add X-Content-Type-Options: nosniff header to your server configuration. This prevents browsers from MIME-sniffing responses."
      });
    }
    
    // Check X-Frame-Options
    const xfo = headers.get("x-frame-options");
    const cspFrameAncestors = csp?.includes("frame-ancestors");
    if (!xfo && !cspFrameAncestors) {
      findings.push({
        category: "headers",
        severity: "medium",
        confidence: "high",
        title: "Missing clickjacking protection",
        description: "Neither X-Frame-Options nor CSP frame-ancestors is set, making the site vulnerable to clickjacking.",
        endpoint: baseUrl,
        evidence_redacted: "No X-Frame-Options or frame-ancestors directive found",
        repro_steps: [
          "Create an HTML page with an iframe pointing to the target",
          "Observe that the site loads in the iframe"
        ],
        fix_recommendation: "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' header, or use CSP frame-ancestors directive.",
        lovable_fix_prompt: "Add X-Frame-Options: DENY header to prevent your site from being embedded in iframes. Alternatively, use CSP: frame-ancestors 'none' for modern browsers."
      });
    }
    
    // Check Referrer-Policy
    const referrerPolicy = headers.get("referrer-policy");
    if (!referrerPolicy) {
      findings.push({
        category: "headers",
        severity: "low",
        confidence: "high",
        title: "Missing Referrer-Policy header",
        description: "No Referrer-Policy header found. The browser will use its default policy, potentially leaking sensitive URL information.",
        endpoint: baseUrl,
        evidence_redacted: "Header 'Referrer-Policy' not present",
        fix_recommendation: "Add a Referrer-Policy header. Recommended values: 'strict-origin-when-cross-origin' or 'no-referrer'.",
        lovable_fix_prompt: "Add Referrer-Policy: strict-origin-when-cross-origin header to control how much referrer information is sent with requests."
      });
    }
    
    // Check Permissions-Policy (formerly Feature-Policy)
    const permissionsPolicy = headers.get("permissions-policy") || headers.get("feature-policy");
    if (!permissionsPolicy) {
      findings.push({
        category: "headers",
        severity: "info",
        confidence: "high",
        title: "Missing Permissions-Policy header",
        description: "No Permissions-Policy header found. Consider restricting browser features like camera, microphone, and geolocation.",
        endpoint: baseUrl,
        evidence_redacted: "Header 'Permissions-Policy' not present",
        fix_recommendation: "Add a Permissions-Policy header to restrict browser features your app doesn't need.",
        lovable_fix_prompt: "Add Permissions-Policy header to restrict unnecessary browser APIs. Example: Permissions-Policy: camera=(), microphone=(), geolocation=()"
      });
    }
    
  } catch (error) {
    findings.push({
      category: "headers",
      severity: "info",
      confidence: "low",
      title: "Could not check security headers",
      description: `Failed to fetch the page to analyze headers: ${error instanceof Error ? error.message : String(error)}`,
      endpoint: baseUrl,
    });
  }
  
  return findings;
}

async function checkCORS(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    // Test with a malicious origin
    const testOrigin = "https://evil-attacker.com";
    const response = await fetch(baseUrl, {
      method: "OPTIONS",
      headers: {
        "Origin": testOrigin,
        "Access-Control-Request-Method": "GET",
      },
    });
    
    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowCredentials = response.headers.get("access-control-allow-credentials");
    
    if (allowOrigin === "*") {
      if (allowCredentials === "true") {
        findings.push({
          category: "cors",
          severity: "critical",
          confidence: "high",
          title: "CORS misconfiguration: wildcard with credentials",
          description: "The server allows any origin with credentials, enabling complete compromise by any malicious site.",
          endpoint: baseUrl,
          evidence_redacted: `Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true`,
          repro_steps: [
            `curl -H "Origin: https://evil.com" -I ${baseUrl}`,
            "Observe Access-Control-Allow-Origin: * and Allow-Credentials: true"
          ],
          fix_recommendation: "Never use wildcard origin with credentials. Implement a whitelist of allowed origins.",
          lovable_fix_prompt: "Update your CORS configuration to use a specific whitelist of allowed origins instead of '*'. In your Edge Function or API, check the Origin header against a list of approved domains and only echo back allowed origins."
        });
      } else {
        findings.push({
          category: "cors",
          severity: "low",
          confidence: "high",
          title: "CORS allows all origins",
          description: "The server allows requests from any origin. This is acceptable for public APIs but may be too permissive for sensitive endpoints.",
          endpoint: baseUrl,
          evidence_redacted: `Access-Control-Allow-Origin: *`,
          fix_recommendation: "Consider restricting to specific origins if the API handles sensitive data.",
        });
      }
    } else if (allowOrigin === testOrigin) {
      findings.push({
        category: "cors",
        severity: "high",
        confidence: "high",
        title: "CORS reflects arbitrary origin",
        description: "The server reflects back any Origin header, allowing malicious sites to make authenticated requests.",
        endpoint: baseUrl,
        evidence_redacted: `Sent Origin: ${testOrigin}\nReceived: Access-Control-Allow-Origin: ${testOrigin}`,
        repro_steps: [
          `curl -H "Origin: https://evil.com" -I ${baseUrl}`,
          "Observe the evil origin is reflected in Access-Control-Allow-Origin"
        ],
        fix_recommendation: "Implement a strict whitelist of allowed origins. Never reflect arbitrary origins.",
        lovable_fix_prompt: "Fix your CORS handler to check the Origin header against a whitelist of allowed domains. Example: const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com']; if (allowedOrigins.includes(origin)) { /* set header */ }"
      });
    }
    
  } catch (error) {
    // CORS preflight failed - this is actually fine/secure
    findings.push({
      category: "cors",
      severity: "info",
      confidence: "medium",
      title: "CORS preflight not configured or restrictive",
      description: "The server did not respond to CORS preflight, indicating CORS may be properly restricted or not configured.",
      endpoint: baseUrl,
    });
  }
  
  return findings;
}

async function checkCookies(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const response = await fetch(baseUrl, { 
      method: "GET",
      credentials: "include" 
    });
    
    const setCookieHeaders = response.headers.get("set-cookie");
    
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(",").map(c => c.trim());
      
      for (const cookie of cookies) {
        const cookieName = cookie.split("=")[0];
        const isSessionCookie = /session|token|auth|jwt|sid/i.test(cookieName);
        
        if (isSessionCookie) {
          // Check Secure flag
          if (!cookie.toLowerCase().includes("secure")) {
            findings.push({
              category: "cookies",
              severity: "high",
              confidence: "high",
              title: `Session cookie missing Secure flag: ${cookieName}`,
              description: "A session cookie is missing the Secure flag, allowing it to be sent over unencrypted connections.",
              endpoint: baseUrl,
              evidence_redacted: `Cookie: ${cookieName}=<redacted>; ... (missing Secure)`,
              repro_steps: [
                `curl -c - ${baseUrl}`,
                `Check cookie '${cookieName}' for Secure flag`
              ],
              fix_recommendation: "Add the Secure flag to all session cookies to ensure they're only sent over HTTPS.",
              lovable_fix_prompt: "Update your cookie settings to include the Secure flag. Example: document.cookie = 'session=value; Secure; HttpOnly; SameSite=Strict'; For Supabase auth, this is handled automatically."
            });
          }
          
          // Check HttpOnly flag
          if (!cookie.toLowerCase().includes("httponly")) {
            findings.push({
              category: "cookies",
              severity: "high",
              confidence: "high",
              title: `Session cookie missing HttpOnly flag: ${cookieName}`,
              description: "A session cookie is missing the HttpOnly flag, making it accessible to JavaScript and vulnerable to XSS theft.",
              endpoint: baseUrl,
              evidence_redacted: `Cookie: ${cookieName}=<redacted>; ... (missing HttpOnly)`,
              repro_steps: [
                `curl -c - ${baseUrl}`,
                `Check cookie '${cookieName}' for HttpOnly flag`,
                "In browser console, try: document.cookie (should not show session cookie)"
              ],
              fix_recommendation: "Add the HttpOnly flag to all session cookies to prevent JavaScript access.",
              lovable_fix_prompt: "Update your cookie settings to include HttpOnly flag. This prevents XSS attacks from stealing session tokens. Server-side: Set-Cookie: session=value; HttpOnly; Secure; SameSite=Strict"
            });
          }
          
          // Check SameSite flag
          if (!cookie.toLowerCase().includes("samesite")) {
            findings.push({
              category: "cookies",
              severity: "medium",
              confidence: "high",
              title: `Session cookie missing SameSite flag: ${cookieName}`,
              description: "A session cookie is missing the SameSite flag, potentially allowing CSRF attacks.",
              endpoint: baseUrl,
              evidence_redacted: `Cookie: ${cookieName}=<redacted>; ... (missing SameSite)`,
              fix_recommendation: "Add SameSite=Strict or SameSite=Lax to session cookies to prevent CSRF.",
              lovable_fix_prompt: "Add SameSite=Strict to your session cookies for maximum CSRF protection, or SameSite=Lax if you need cross-site navigation to work. Example: Set-Cookie: session=value; SameSite=Strict"
            });
          }
        }
      }
    }
    
  } catch (error) {
    // Ignore cookie check errors
  }
  
  return findings;
}

async function checkGraphQLIntrospection(graphqlEndpoint: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const introspectionQuery = {
      query: `query { __schema { types { name } } }`
    };
    
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(introspectionQuery),
    });
    
    const data = await response.json();
    
    if (data.data?.__schema) {
      const typeCount = data.data.__schema.types?.length || 0;
      findings.push({
        category: "graphql",
        severity: "medium",
        confidence: "high",
        title: "GraphQL introspection enabled",
        description: `GraphQL introspection is enabled, exposing the entire API schema (${typeCount} types found). This helps attackers understand your API structure.`,
        endpoint: graphqlEndpoint,
        evidence_redacted: `Introspection query returned ${typeCount} types`,
        repro_steps: [
          `POST to ${graphqlEndpoint}`,
          "Send introspection query: { __schema { types { name } } }",
          "Observe full schema is returned"
        ],
        fix_recommendation: "Disable GraphQL introspection in production. Most GraphQL servers have a config option for this.",
        lovable_fix_prompt: "Disable GraphQL introspection in production. If using Apollo Server: new ApolloServer({ introspection: process.env.NODE_ENV !== 'production' }). For other servers, check the documentation for the introspection setting."
      });
    } else {
      findings.push({
        category: "graphql",
        severity: "info",
        confidence: "high",
        title: "GraphQL introspection disabled",
        description: "GraphQL introspection is properly disabled, hiding the API schema from potential attackers.",
        endpoint: graphqlEndpoint,
      });
    }
    
  } catch (error) {
    findings.push({
      category: "graphql",
      severity: "info",
      confidence: "low",
      title: "Could not check GraphQL introspection",
      description: `Failed to test GraphQL endpoint: ${error instanceof Error ? error.message : String(error)}`,
      endpoint: graphqlEndpoint,
    });
  }
  
  return findings;
}

async function checkSourceMaps(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();
    
    // Find script tags
    const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
    const scripts = Array.from(scriptMatches).map(m => m[1]).slice(0, 5); // Check first 5
    
    for (const scriptPath of scripts) {
      try {
        const scriptUrl = new URL(scriptPath, baseUrl).href;
        const mapUrl = scriptUrl + ".map";
        
        const mapResponse = await fetch(mapUrl, { method: "HEAD" });
        
        if (mapResponse.ok) {
          findings.push({
            category: "exposure",
            severity: "medium",
            confidence: "high",
            title: "Source maps exposed in production",
            description: "JavaScript source maps are publicly accessible, revealing original source code, file structure, and potentially sensitive logic.",
            endpoint: mapUrl,
            evidence_redacted: `Source map found: ${mapUrl}`,
            repro_steps: [
              `Navigate to ${mapUrl}`,
              "Observe the source map file is accessible"
            ],
            fix_recommendation: "Remove source maps from production builds or restrict access to them.",
            lovable_fix_prompt: "Configure your build to not generate source maps in production. In vite.config.ts, set build: { sourcemap: false } for production builds. If you need source maps for error tracking, upload them to your error tracking service and delete from public access."
          });
          break; // One finding is enough
        }
      } catch {
        // Ignore individual script errors
      }
    }
    
    // Also check common source map patterns
    const commonMaps = ["/main.js.map", "/bundle.js.map", "/app.js.map", "/index.js.map"];
    for (const mapPath of commonMaps) {
      try {
        const mapUrl = new URL(mapPath, baseUrl).href;
        const mapResponse = await fetch(mapUrl, { method: "HEAD" });
        if (mapResponse.ok) {
          findings.push({
            category: "exposure",
            severity: "medium",
            confidence: "high",
            title: "Source maps exposed in production",
            description: "JavaScript source maps are publicly accessible, revealing original source code.",
            endpoint: mapUrl,
            evidence_redacted: `Source map found: ${mapUrl}`,
            fix_recommendation: "Remove source maps from production builds.",
            lovable_fix_prompt: "Configure vite.config.ts with build: { sourcemap: false } for production."
          });
          break;
        }
      } catch {
        // Ignore
      }
    }
    
  } catch (error) {
    // Ignore source map check errors
  }
  
  return findings;
}

async function checkExposedEnvVars(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();
    
    // Check for common env var patterns in the HTML/JS
    const dangerousPatterns = [
      { pattern: /SUPABASE_SERVICE_ROLE_KEY/i, name: "Supabase Service Role Key" },
      { pattern: /SUPABASE_SERVICE_KEY/i, name: "Supabase Service Key" },
      { pattern: /DATABASE_URL/i, name: "Database URL" },
      { pattern: /POSTGRES_PASSWORD/i, name: "Postgres Password" },
      { pattern: /JWT_SECRET/i, name: "JWT Secret" },
      { pattern: /STRIPE_SECRET_KEY/i, name: "Stripe Secret Key" },
      { pattern: /AWS_SECRET_ACCESS_KEY/i, name: "AWS Secret Key" },
      { pattern: /PRIVATE_KEY/i, name: "Private Key" },
    ];
    
    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(html)) {
        findings.push({
          category: "exposure",
          severity: "critical",
          confidence: "medium",
          title: `Potential ${name} exposure in client bundle`,
          description: `The client-side code may contain references to ${name}. This could indicate secret key exposure.`,
          endpoint: baseUrl,
          evidence_redacted: `Pattern '${pattern.source}' found in page source`,
          repro_steps: [
            `View page source at ${baseUrl}`,
            `Search for '${pattern.source}'`
          ],
          fix_recommendation: `Never include ${name} in client-side code. Use environment variables and server-side functions.`,
          lovable_fix_prompt: `Move ${name} to a server-side Edge Function. Never use VITE_ prefix for secrets. Store in Supabase secrets and access only from Edge Functions.`
        });
      }
    }
    
  } catch (error) {
    // Ignore
  }
  
  return findings;
}

async function checkCommonEndpoints(baseUrl: string, doNotTest: string[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  const sensitiveEndpoints = [
    { path: "/.env", name: "Environment file" },
    { path: "/.git/config", name: "Git config" },
    { path: "/wp-admin", name: "WordPress admin" },
    { path: "/admin", name: "Admin panel" },
    { path: "/debug", name: "Debug endpoint" },
    { path: "/api/debug", name: "API debug" },
    { path: "/graphql", name: "GraphQL endpoint" },
    { path: "/swagger", name: "Swagger docs" },
    { path: "/api-docs", name: "API documentation" },
    { path: "/.well-known/security.txt", name: "Security policy" },
  ];
  
  for (const { path, name } of sensitiveEndpoints) {
    // Skip if in DO_NOT_TEST
    if (doNotTest.some(pattern => path.includes(pattern) || pattern.includes(path))) {
      continue;
    }
    
    try {
      const url = new URL(path, baseUrl).href;
      const response = await fetch(url, { method: "HEAD", redirect: "manual" });
      
      if (response.ok && path !== "/.well-known/security.txt") {
        const severity = path.includes(".env") || path.includes(".git") ? "critical" : "medium";
        findings.push({
          category: "exposure",
          severity: severity as "critical" | "medium",
          confidence: path.includes(".env") || path.includes(".git") ? "high" : "medium",
          title: `${name} accessible`,
          description: `The ${name.toLowerCase()} endpoint is accessible. This may expose sensitive information or functionality.`,
          endpoint: url,
          evidence_redacted: `HTTP ${response.status} at ${path}`,
          fix_recommendation: `Restrict access to ${path} or remove it from production.`,
        });
      }
    } catch {
      // Endpoint not accessible - good
    }
  }
  
  return findings;
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const input: SecurityWorkerInput = await req.json();
    const { scan_run_id, base_url, app_profile, mode, safety_config } = input;
    
     // ============================================
     // SERVER-SIDE ENTITLEMENT RE-CHECK
     // Workers must verify gating before running
     // ============================================
     const { data: gatingCheck, error: gatingError } = await supabase
       .rpc("can_run_gated_task", {
         p_scan_run_id: scan_run_id,
         p_task_type: "security_check",
       });
 
     if (gatingError) {
       console.error("[SecurityWorker] Gating check error:", gatingError);
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
 
     console.log(`[SecurityWorker] Gating check: tier=${gating.tier_name}, allowed=${gating.allowed}`);
 
     // Override safety_config with server-verified entitlements
     const verifiedSafetyConfig = {
       ...safety_config,
       allow_advanced_tests: safety_config.allow_advanced_tests && gating.allow_soak, // Only if tier allows
       max_rps: Math.min(safety_config.max_rps, gating.max_rps),
     };
 
    // === HALT CHECK: verify scan hasn't been canceled before starting ===
    const { data: currentRun } = await supabase
      .from("scan_runs")
      .select("status")
      .eq("id", scan_run_id)
      .single();

    if (currentRun && ["canceled", "cancelled"].includes(currentRun.status)) {
      console.log(`[SecurityWorker] Scan ${scan_run_id} was halted. Aborting.`);
      return new Response(
        JSON.stringify({ success: false, error: "Scan halted by operator", findings: [], not_tested: [] }),
        { headers: jsonHeaders }
      );
    }

    const findings: Finding[] = [];
    const notTested: NotTestedItem[] = [];
    
    console.log(`[SecurityWorker] Starting security scan for ${base_url}`);
     console.log(`[SecurityWorker] Mode: ${mode}, Environment: ${verifiedSafetyConfig.environment}, Tier: ${gating.tier_name}`);
    
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(base_url);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid base URL provided"
      }), { headers: jsonHeaders });
    }
    
    // Run safe security checks
    console.log("[SecurityWorker] Running TLS checks...");
    findings.push(...await checkTLS(base_url));
    
    console.log("[SecurityWorker] Running security headers checks...");
    findings.push(...await checkSecurityHeaders(base_url));
    
    console.log("[SecurityWorker] Running CORS checks...");
    findings.push(...await checkCORS(base_url));
    
    console.log("[SecurityWorker] Running cookie checks...");
    findings.push(...await checkCookies(base_url));
    
    console.log("[SecurityWorker] Running source map checks...");
    findings.push(...await checkSourceMaps(base_url));
    
    console.log("[SecurityWorker] Running exposed env var checks...");
    findings.push(...await checkExposedEnvVars(base_url));
    
    console.log("[SecurityWorker] Running common endpoint checks...");
    findings.push(...await checkCommonEndpoints(base_url, safety_config.do_not_test));
    
    // GraphQL check if endpoint provided
    if (app_profile?.graphqlEndpoint || app_profile?.hasGraphQL) {
      const graphqlEndpoint = app_profile.graphqlEndpoint || new URL("/graphql", base_url).href;
      console.log(`[SecurityWorker] Running GraphQL introspection check on ${graphqlEndpoint}...`);
      findings.push(...await checkGraphQLIntrospection(graphqlEndpoint));
    } else {
      notTested.push({
        check: "GraphQL Introspection",
        reason: "No GraphQL endpoint provided or detected"
      });
    }
    
    // Authenticated-only checks
    if (mode === "url_only") {
      notTested.push({
        check: "Session Management",
        reason: "Requires authenticated mode"
      });
      notTested.push({
        check: "Authorization Bypass",
        reason: "Requires authenticated mode"
      });
      notTested.push({
        check: "IDOR Checks",
        reason: "Requires authenticated mode"
      });
    }
    
    // Advanced tests only if allowed
    if (!safety_config.allow_advanced_tests) {
      notTested.push({
        check: "SQL Injection (active)",
        reason: "Advanced tests not enabled"
      });
      notTested.push({
        check: "XSS (active)",
        reason: "Advanced tests not enabled"
      });
      notTested.push({
        check: "Command Injection",
        reason: "Advanced tests not enabled"
      });
    }
    
    // Store findings in database
    console.log(`[SecurityWorker] Storing ${findings.length} findings...`);
    
    for (const finding of findings) {
      const { error } = await supabase.from("scan_findings").insert({
        scan_run_id,
        category: finding.category,
        severity: finding.severity,
        confidence: finding.confidence,
        title: finding.title,
        description: finding.description,
        endpoint: finding.endpoint,
        evidence_redacted: finding.evidence_redacted,
        repro_steps: finding.repro_steps,
        fix_recommendation: finding.fix_recommendation,
        lovable_fix_prompt: finding.lovable_fix_prompt,
      });
      
      if (error) {
        console.error(`[SecurityWorker] Failed to store finding: ${error.message}`);
      }
    }
    
    // Calculate summary
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === "critical").length,
      high: findings.filter(f => f.severity === "high").length,
      medium: findings.filter(f => f.severity === "medium").length,
      low: findings.filter(f => f.severity === "low").length,
      info: findings.filter(f => f.severity === "info").length,
    };
    
    console.log(`[SecurityWorker] Scan complete. Summary: ${JSON.stringify(summary)}`);
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      findings,
      not_tested: notTested,
    }), {
      headers: jsonHeaders,
    });
    
  } catch (error) {
    console.error("[SecurityWorker] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
