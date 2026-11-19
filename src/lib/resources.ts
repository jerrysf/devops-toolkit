/**
 * Kubernetes resource unit conversion + workload request/limit math.
 *
 * CPU:  1 core = 1000 millicores. "250m" = 0.25 cores.
 * Memory: binary (Mi/Gi, powers of 1024) and decimal (M/G, powers of
 * 1000) are different units — Kubernetes accepts both.
 */

export interface ParseResult {
  ok: boolean;
  value?: number; // millicores for CPU, bytes for memory
  error?: string;
}

// ── CPU ─────────────────────────────────────────────────────────────

/** Parse a Kubernetes CPU quantity to millicores. */
export function parseCpu(input: string): ParseResult {
  const s = input.trim();
  const m = /^(\d+(?:\.\d+)?)(m?)$/.exec(s);
  if (!m) {
    return { ok: false, error: `"${input}" isn't a valid CPU value — use forms like 250m, 0.5, or 2` };
  }
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "CPU can't be negative" };
  }
  const millicores = m[2] === "m" ? n : n * 1000;
  return { ok: true, value: Math.round(millicores * 1000) / 1000 };
}

/** Format millicores compactly: 250 → "250m", 1500 → "1.5". */
export function formatCpu(millicores: number): string {
  if (millicores === 0) return "0";
  if (millicores >= 1000 && millicores % 1000 === 0) return `${millicores / 1000}`;
  if (millicores >= 1000) return `${millicores / 1000}`;
  return `${millicores}m`;
}

// ── Memory ──────────────────────────────────────────────────────────

const MEM_UNITS: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  K: 1000,
  M: 1000 ** 2,
  G: 1000 ** 3,
  T: 1000 ** 4,
};

/** Parse a Kubernetes memory quantity to bytes. */
export function parseMemory(input: string): ParseResult {
  const s = input.trim();
  const m = /^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti|K|M|G|T)?$/.exec(s);
  if (!m) {
    return {
      ok: false,
      error: `"${input}" isn't a valid memory value — use forms like 128Mi, 1Gi, 512M, or a plain byte count`,
    };
  }
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "Memory can't be negative" };
  }
  const multiplier = m[2] ? MEM_UNITS[m[2]] : 1;
  return { ok: true, value: Math.round(n * multiplier) };
}

/** Format bytes to the largest clean binary unit. */
export function formatMemory(bytes: number): string {
  if (bytes === 0) return "0";
  const units = [
    { u: "Ti", n: 1024 ** 4 },
    { u: "Gi", n: 1024 ** 3 },
    { u: "Mi", n: 1024 ** 2 },
    { u: "Ki", n: 1024 },
  ];
  for (const { u, n } of units) {
    if (bytes >= n && bytes % n === 0) return `${bytes / n}${u}`;
  }
  for (const { u, n } of units) {
    if (bytes >= n) return `${(bytes / n).toFixed(2)}${u}`;
  }
  return `${bytes}`;
}

// ── Workload totals ─────────────────────────────────────────────────

export interface ContainerSpec {
  name: string;
  cpuRequest?: string;
  cpuLimit?: string;
  memoryRequest?: string;
  memoryLimit?: string;
}

export interface WorkloadSummary {
  replicas: number;
  perReplica: {
    cpuRequest: number;
    cpuLimit: number;
    memoryRequest: number;
    memoryLimit: number;
  };
  totals: {
    cpuRequest: number;
    cpuLimit: number;
    memoryRequest: number;
    memoryLimit: number;
  };
  warnings: string[];
  errors: string[];
}

export function summarizeWorkload(
  containers: ContainerSpec[],
  replicas: number,
): WorkloadSummary {
  const warnings: string[] = [];
  const errors: string[] = [];

  const acc = { cpuRequest: 0, cpuLimit: 0, memoryRequest: 0, memoryLimit: 0 };
  let cpuLimitSet = false;
  let memLimitSet = false;

  for (const c of containers) {
    const label = c.name || "(unnamed container)";

    const parseField = (
      raw: string | undefined,
      parser: (s: string) => ParseResult,
      field: string,
    ): number | null => {
      if (raw === undefined || raw.trim() === "") return null;
      const r = parser(raw);
      if (!r.ok) {
        errors.push(`${label}: ${r.error} (${field})`);
        return null;
      }
      return r.value!;
    };

    const cpuReq = parseField(c.cpuRequest, parseCpu, "cpu request");
    const cpuLim = parseField(c.cpuLimit, parseCpu, "cpu limit");
    const memReq = parseField(c.memoryRequest, parseMemory, "memory request");
    const memLim = parseField(c.memoryLimit, parseMemory, "memory limit");

    if (cpuReq === null && cpuLim === null) {
      warnings.push(`${label}: no CPU request or limit — the scheduler can't place it intelligently`);
    }
    if (memReq === null && memLim === null) {
      warnings.push(`${label}: no memory request or limit — unbounded memory is the top cause of node pressure`);
    }
    if (cpuReq === null) warnings.push(`${label}: no CPU request — scheduling ignores this container's CPU needs`);
    if (memReq === null) warnings.push(`${label}: no memory request`);
    if (memLim === null) warnings.push(`${label}: no memory limit — a leak can OOM the node`);

    if (cpuReq !== null && cpuLim !== null && cpuLim < cpuReq) {
      warnings.push(`${label}: CPU limit below request — Kubernetes will reject or throttle oddly`);
    }
    if (memReq !== null && memLim !== null && memLim < memReq) {
      errors.push(`${label}: memory limit (${formatMemory(memLim)}) below request (${formatMemory(memReq)}) — this pod can never schedule`);
    }

    if (cpuReq !== null) acc.cpuRequest += cpuReq;
    if (cpuLim !== null) {
      acc.cpuLimit += cpuLim;
      cpuLimitSet = true;
    }
    if (memReq !== null) acc.memoryRequest += memReq;
    if (memLim !== null) {
      acc.memoryLimit += memLim;
      memLimitSet = true;
    }
  }

  if (replicas > 1 && !memLimitSet) {
    warnings.push("replicas > 1 with no memory limits multiplies OOM risk");
  }
  if (replicas > 1 && !cpuLimitSet) {
    warnings.push("replicas > 1 with no CPU limits — one busy replica can starve neighbors");
  }

  const totals = {
    cpuRequest: acc.cpuRequest * replicas,
    cpuLimit: acc.cpuLimit * replicas,
    memoryRequest: acc.memoryRequest * replicas,
    memoryLimit: acc.memoryLimit * replicas,
  };

  return {
    replicas,
    perReplica: acc,
    totals,
    warnings,
    errors,
  };
}
