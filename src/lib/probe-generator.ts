/**
 * Probe generator — liveness/readiness/startup probes with timing
 * explanations.
 */

export type ProbeKind = "liveness" | "readiness" | "startup";
export type ProbeMechanism = "httpGet" | "tcpSocket" | "exec" | "grpc";

export interface ProbeInput {
  kind: ProbeKind;
  mechanism: ProbeMechanism;
  path?: string;
  port?: number;
  scheme?: "HTTP" | "HTTPS";
  host?: string;
  command?: string; // for exec
  grpcPort?: number;
  grpcService?: string;
  periodSeconds: number;
  timeoutSeconds: number;
  failureThreshold: number;
  initialDelaySeconds: number;
  successThreshold?: number;
}

export interface ProbeOutput {
  yaml: string;
  warnings: string[];
  explanations: string[];
}

const DEFAULTS: Record<ProbeKind, Omit<ProbeInput, "kind" | "mechanism">> = {
  liveness: { periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 3, initialDelaySeconds: 0 },
  readiness: { periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 3, initialDelaySeconds: 0 },
  startup: { periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 30, initialDelaySeconds: 0 },
};

export function defaultProbeInput(kind: ProbeKind): ProbeInput {
  return {
    kind,
    mechanism: "httpGet",
    path: kind === "readiness" ? "/ready" : "/healthz",
    port: 8080,
    ...DEFAULTS[kind],
    successThreshold: kind === "readiness" ? 1 : undefined,
  };
}

export function buildProbe(input: ProbeInput): ProbeOutput {
  const warnings: string[] = [];
  const explanations: string[] = [];
  const key = `${input.kind}Probe`;

  const lines = [`${key}:`];

  switch (input.mechanism) {
    case "httpGet":
      lines.push(
        "  httpGet:",
        `    path: ${input.path || "/healthz"}`,
        `    port: ${input.port ?? 8080}`,
      );
      if (input.scheme === "HTTPS") lines.push("    scheme: HTTPS");
      if (input.host) lines.push(`    host: ${input.host}`);
      break;
    case "tcpSocket":
      lines.push("  tcpSocket:", `    port: ${input.port ?? 8080}`);
      break;
    case "exec":
      lines.push(
        "  exec:",
        "    command:",
        ...(input.command?.trim()
          ? input.command
              .split(/\s+/)
              .map((c) => `      - ${JSON.stringify(c)}`)
          : ['      - "cat"', '      - "/tmp/healthy"']),
      );
      break;
    case "grpc":
      lines.push(
        "  grpc:",
        `    port: ${input.grpcPort ?? input.port ?? 9000}`,
      );
      if (input.grpcService) lines.push(`    service: ${input.grpcService}`);
      break;
  }

  if (input.initialDelaySeconds > 0) {
    lines.push(`  initialDelaySeconds: ${input.initialDelaySeconds}`);
  }
  lines.push(`  periodSeconds: ${input.periodSeconds}`);
  lines.push(`  timeoutSeconds: ${input.timeoutSeconds}`);
  if (input.successThreshold && input.successThreshold > 1) {
    lines.push(`  successThreshold: ${input.successThreshold}`);
  }
  lines.push(`  failureThreshold: ${input.failureThreshold}`);

  // ── Explanations per probe kind ──
  const detectTime = input.periodSeconds * input.failureThreshold;
  switch (input.kind) {
    case "liveness":
      explanations.push(
        `Liveness failure restarts the container. Detection latency ≈ periodSeconds × failureThreshold = ${detectTime}s (plus initialDelay).`,
        "Liveness probes should test process liveness only — a failing dependency (DB down) should fail readiness, not liveness, or you'll restart healthy containers in a loop.",
      );
      if (input.mechanism === "exec") {
        warnings.push(
          "exec probes spawn a process in the container on every check — expensive at scale. Prefer httpGet/tcpSocket when possible.",
        );
      }
      if (input.path && /ready|health.*dep|db|database/i.test(input.path)) {
        warnings.push(
          `Endpoint "${input.path}" sounds like it checks dependencies — liveness on dependency health causes restart storms during outages. Keep liveness shallow.`,
        );
      }
      break;
    case "readiness":
      explanations.push(
        "Readiness failure removes the pod from Service endpoints — traffic stops, but the container keeps running (no restart).",
        `With periodSeconds=${input.periodSeconds} and failureThreshold=${input.failureThreshold}, a degraded pod exits rotation in ≈${detectTime}s.`,
      );
      break;
    case "startup":
      explanations.push(
        `Startup probe gives the container up to ${detectTime}s to boot before liveness applies — for slow-starting apps (JVM warmup, migrations).`,
        "While the startup probe runs, liveness and readiness are disabled. It only needs to succeed once.",
      );
      if (input.failureThreshold < 10) {
        warnings.push(
          `failureThreshold=${input.failureThreshold} only allows ${detectTime}s of startup — typical startup probes use 30–60 for genuinely slow apps.`,
        );
      }
      break;
  }

  if (input.timeoutSeconds >= input.periodSeconds) {
    warnings.push(
      `timeoutSeconds (${input.timeoutSeconds}) ≥ periodSeconds (${input.periodSeconds}) — probes can overlap; each check should finish well before the next starts.`,
    );
  }
  if (input.mechanism === "httpGet" && input.port && input.port > 65535) {
    warnings.push("Port > 65535 is invalid.");
  }

  return { yaml: lines.join("\n") + "\n", warnings, explanations };
}
