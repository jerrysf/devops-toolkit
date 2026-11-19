import { describe, expect, it } from "vitest";
import { buildRbac } from "@/lib/rbac-generator";
import { buildNetpol } from "@/lib/netpol-generator";
import { buildProbe, defaultProbeInput } from "@/lib/probe-generator";
import { calcHpa } from "@/lib/hpa-calculator";
import { buildCronJob } from "@/lib/cronjob-generator";
import { loadAll } from "js-yaml";

function parseDocs(yaml: string) {
  const docs: unknown[] = [];
  loadAll(yaml, (d) => docs.push(d));
  return docs;
}

describe("buildRbac", () => {
  const base = {
    name: "pod-reader",
    namespace: "prod",
    scope: "namespaced" as const,
    rules: [{ apiGroup: "", resources: "pods", verbs: ["get", "list"] }],
    bindTo: { kind: "ServiceAccount" as const, name: "app-sa" },
  };

  it("generates Role + RoleBinding", () => {
    const { yaml } = buildRbac(base);
    const docs = parseDocs(yaml) as { kind: string }[];
    expect(docs.map((d) => d.kind)).toEqual(["Role", "RoleBinding"]);
    expect(yaml).toContain("namespace: prod");
    expect(yaml).toContain('resources:');
    expect(yaml).toContain('"pods"');
  });

  it("generates ClusterRole + ClusterRoleBinding at cluster scope", () => {
    const { yaml } = buildRbac({ ...base, scope: "cluster" });
    const docs = parseDocs(yaml) as { kind: string }[];
    expect(docs.map((d) => d.kind)).toEqual(["ClusterRole", "ClusterRoleBinding"]);
    expect(yaml).not.toContain("namespace: prod\nsubjects");
  });

  it("warns on wildcards", () => {
    const { warnings } = buildRbac({
      ...base,
      rules: [{ apiGroup: "", resources: "*", verbs: ["*"] }],
    });
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.some((w) => w.includes("Wildcard resources"))).toBe(true);
    expect(warnings.some((w) => w.includes("Wildcard verbs"))).toBe(true);
  });

  it("warns on secrets access", () => {
    const { warnings } = buildRbac({
      ...base,
      rules: [{ apiGroup: "", resources: "secrets", verbs: ["get"] }],
    });
    expect(warnings.some((w) => w.includes("secrets"))).toBe(true);
  });

  it("emits valid YAML for every rule", () => {
    const { yaml } = buildRbac({
      ...base,
      rules: [
        { apiGroup: "", resources: "pods, configmaps", verbs: ["get"] },
        { apiGroup: "apps", resources: "deployments", verbs: ["get", "watch"] },
      ],
    });
    expect(() => parseDocs(yaml)).not.toThrow();
  });
});

describe("buildNetpol", () => {
  const base = {
    name: "web-netpol",
    namespace: "prod",
    podSelector: "app=web",
    ingress: [
      {
        peers: [{ type: "podSelector" as const, podLabels: "app=api" }],
        ports: [{ port: "8080", protocol: "TCP" as const }],
      },
    ],
    egress: [],
    allowDnsEgress: false,
  };

  it("generates a valid NetworkPolicy", () => {
    const { yaml } = buildNetpol(base);
    const docs = parseDocs(yaml) as { kind: string; spec: { policyTypes: string[] } }[];
    expect(docs[0].kind).toBe("NetworkPolicy");
    expect(docs[0].spec.policyTypes).toEqual(["Ingress"]);
    expect(yaml).toContain("podSelector:");
    expect(yaml).toContain("port: 8080");
  });

  it("adds DNS egress rule when requested", () => {
    const { yaml } = buildNetpol({ ...base, allowDnsEgress: true });
    expect(yaml).toContain("port: 53");
    expect(yaml).toContain("kube-system");
  });

  it("warns about missing DNS when egress is on", () => {
    const { warnings } = buildNetpol({
      ...base,
      egress: [
        {
          peers: [{ type: "ipBlock" as const, cidr: "10.0.0.0/8" }],
          ports: [],
        },
      ],
    });
    expect(warnings.some((w) => w.includes("DNS"))).toBe(true);
  });

  it("warns when no rules defined", () => {
    const { warnings } = buildNetpol({ ...base, ingress: [] });
    expect(warnings.some((w) => w.includes("No rules"))).toBe(true);
  });
});

describe("buildProbe", () => {
  it("generates httpGet liveness probe", () => {
    const { yaml } = buildProbe({
      ...defaultProbeInput("liveness"),
      path: "/healthz",
      port: 3000,
    });
    expect(yaml).toContain("livenessProbe:");
    expect(yaml).toContain("httpGet:");
    expect(yaml).toContain("path: /healthz");
    expect(yaml).toContain("port: 3000");
  });

  it("generates exec probe with command array", () => {
    const { yaml } = buildProbe({
      ...defaultProbeInput("readiness"),
      mechanism: "exec",
      command: "cat /tmp/ready",
    });
    expect(yaml).toContain("exec:");
    expect(yaml).toContain('"cat"');
    expect(yaml).toContain('"/tmp/ready"');
  });

  it("startup probe warns on low failureThreshold", () => {
    const { warnings } = buildProbe({
      ...defaultProbeInput("startup"),
      failureThreshold: 3,
    });
    expect(warnings.some((w) => w.includes("startup"))).toBe(true);
  });

  it("warns when timeout >= period", () => {
    const { warnings } = buildProbe({
      ...defaultProbeInput("liveness"),
      periodSeconds: 5,
      timeoutSeconds: 5,
    });
    expect(warnings.some((w) => w.includes("timeoutSeconds"))).toBe(true);
  });

  it("explains detection latency", () => {
    const { explanations } = buildProbe({
      ...defaultProbeInput("liveness"),
      periodSeconds: 10,
      failureThreshold: 3,
    });
    expect(explanations.some((e) => e.includes("30s"))).toBe(true);
  });
});

describe("calcHpa", () => {
  const base = {
    targetUtilization: 70,
    cpuRequestM: 200,
    observedAvgM: 300,
    observedPeakM: 800,
    minReplicas: 2,
    maxReplicas: 10,
  };

  it("computes utilization and replica estimates", () => {
    const r = calcHpa(base);
    expect(r.currentUtilization).toBe(150);
    // effective per pod = 140m → avg needs ceil(300/140)=3, peak ceil(800/140)=6
    expect(r.desiredReplicasNow).toBe(3);
    expect(r.desiredReplicasPeak).toBe(6);
  });

  it("warns when usage exceeds request", () => {
    const r = calcHpa(base);
    expect(r.warnings.some((w) => w.includes("exceeds the request"))).toBe(true);
  });

  it("warns when peak needs more than maxReplicas", () => {
    const r = calcHpa({ ...base, maxReplicas: 4 });
    expect(r.warnings.some((w) => w.includes("saturate"))).toBe(true);
    expect(r.desiredReplicasPeak).toBe(4); // clamped
  });

  it("emits valid HPA yaml", () => {
    const r = calcHpa(base);
    const docs = parseDocs(r.yaml) as { kind: string }[];
    expect(docs[0].kind).toBe("HorizontalPodAutoscaler");
  });
});

describe("buildCronJob", () => {
  const base = {
    name: "backup",
    namespace: "prod",
    schedule: "0 2 * * *",
    concurrencyPolicy: "Forbid" as const,
    successfulJobsHistoryLimit: 3,
    failedJobsHistoryLimit: 1,
    image: "backup:1.0",
    command: "/bin/backup --full",
    restartPolicy: "OnFailure" as const,
    suspend: false,
  };

  it("generates valid CronJob YAML", () => {
    const r = buildCronJob(base);
    expect(r.valid).toBe(true);
    const docs = parseDocs(r.yaml) as { kind: string; spec: { schedule: string } }[];
    expect(docs[0].kind).toBe("CronJob");
    expect(docs[0].spec.schedule).toBe("0 2 * * *");
    expect(r.yaml).toContain("concurrencyPolicy: Forbid");
    expect(r.scheduleDescription).toBeTruthy();
  });

  it("flags invalid schedules", () => {
    const r = buildCronJob({ ...base, schedule: "99 * * * *" });
    expect(r.valid).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("warns on Allow concurrency", () => {
    const r = buildCronJob({ ...base, concurrencyPolicy: "Allow" });
    expect(r.warnings.some((w) => w.includes("overlapping"))).toBe(true);
  });
});
