/**
 * Kubernetes manifest structural validation — runs entirely in the
 * browser on already-parsed YAML documents.
 *
 * Scope (stated honestly in the UI): this validates the *shape* of a
 * manifest — required fields, common structural mistakes, deprecated
 * API versions for a stated target release. It is NOT a full
 * OpenAPI-schema validator (that's kubeconform/kubeval or
 * `kubectl apply --dry-run=server` territory).
 */

import { loadAll, YAMLException } from "js-yaml";

export const K8S_TARGET_VERSION = "1.34";

export type IssueSeverity = "error" | "warning" | "info";

export interface ManifestIssue {
  /** 0-based document index. */
  docIndex: number;
  /** 1-based line in the source, when locatable. */
  line?: number;
  severity: IssueSeverity;
  /** Dotted path to the offending/missing field. */
  path?: string;
  message: string;
}

export interface ResourceSummary {
  docIndex: number;
  apiVersion: string;
  kind: string;
  name: string;
}

export interface ManifestReport {
  syntaxValid: boolean;
  syntaxError?: { message: string; line?: number };
  documentCount: number;
  resources: ResourceSummary[];
  issues: ManifestIssue[];
}

// ── Deprecated / removed API versions ────────────────────────────────

interface Deprecation {
  apiVersion: string;
  kinds?: string[]; // if set, only these kinds are deprecated
  removedIn: string;
  replacement: string;
}

const DEPRECATED_APIS: Deprecation[] = [
  { apiVersion: "apps/v1beta1", removedIn: "1.16", replacement: "apps/v1" },
  { apiVersion: "apps/v1beta2", removedIn: "1.16", replacement: "apps/v1" },
  { apiVersion: "extensions/v1beta1", removedIn: "1.16–1.22", replacement: "apps/v1, networking.k8s.io/v1, or policy/v1 depending on kind" },
  { apiVersion: "networking.k8s.io/v1beta1", removedIn: "1.22", replacement: "networking.k8s.io/v1" },
  { apiVersion: "batch/v1beta1", kinds: ["CronJob"], removedIn: "1.25", replacement: "batch/v1" },
  { apiVersion: "policy/v1beta1", kinds: ["PodDisruptionBudget"], removedIn: "1.25", replacement: "policy/v1" },
  { apiVersion: "policy/v1beta1", kinds: ["PodSecurityPolicy"], removedIn: "1.25", replacement: "Pod Security Admission (built-in)" },
  { apiVersion: "autoscaling/v2beta1", removedIn: "1.26", replacement: "autoscaling/v2" },
  { apiVersion: "autoscaling/v2beta2", removedIn: "1.26", replacement: "autoscaling/v2" },
  { apiVersion: "admissionregistration.k8s.io/v1beta1", removedIn: "1.22", replacement: "admissionregistration.k8s.io/v1" },
  { apiVersion: "apiextensions.k8s.io/v1beta1", removedIn: "1.22", replacement: "apiextensions.k8s.io/v1" },
  { apiVersion: "apiregistration.k8s.io/v1beta1", removedIn: "1.22", replacement: "apiregistration.k8s.io/v1" },
  { apiVersion: "rbac.authorization.k8s.io/v1alpha1", removedIn: "1.22", replacement: "rbac.authorization.k8s.io/v1" },
  { apiVersion: "rbac.authorization.k8s.io/v1beta1", removedIn: "1.22", replacement: "rbac.authorization.k8s.io/v1" },
  { apiVersion: "scheduling.k8s.io/v1beta1", removedIn: "1.22", replacement: "scheduling.k8s.io/v1" },
  { apiVersion: "certificates.k8s.io/v1beta1", removedIn: "1.22", replacement: "certificates.k8s.io/v1" },
  { apiVersion: "coordination.k8s.io/v1beta1", removedIn: "1.22", replacement: "coordination.k8s.io/v1" },
  { apiVersion: "storage.k8s.io/v1beta1", removedIn: "1.22", replacement: "storage.k8s.io/v1" },
  { apiVersion: "flowcontrol.apiserver.k8s.io/v1beta1", removedIn: "1.29", replacement: "flowcontrol.apiserver.k8s.io/v1" },
  { apiVersion: "flowcontrol.apiserver.k8s.io/v1beta2", removedIn: "1.32", replacement: "flowcontrol.apiserver.k8s.io/v1" },
];

/** Expected apiVersion for common kinds — mismatches produce warnings. */
const KIND_API: Record<string, string> = {
  Deployment: "apps/v1",
  StatefulSet: "apps/v1",
  DaemonSet: "apps/v1",
  ReplicaSet: "apps/v1",
  Pod: "v1",
  Service: "v1",
  ConfigMap: "v1",
  Secret: "v1",
  ServiceAccount: "v1",
  Namespace: "v1",
  PersistentVolume: "v1",
  PersistentVolumeClaim: "v1",
  Job: "batch/v1",
  CronJob: "batch/v1",
  Ingress: "networking.k8s.io/v1",
  IngressClass: "networking.k8s.io/v1",
  NetworkPolicy: "networking.k8s.io/v1",
  Role: "rbac.authorization.k8s.io/v1",
  RoleBinding: "rbac.authorization.k8s.io/v1",
  ClusterRole: "rbac.authorization.k8s.io/v1",
  ClusterRoleBinding: "rbac.authorization.k8s.io/v1",
  HorizontalPodAutoscaler: "autoscaling/v2",
  PodDisruptionBudget: "policy/v1",
  StorageClass: "storage.k8s.io/v1",
  PriorityClass: "scheduling.k8s.io/v1",
  CustomResourceDefinition: "apiextensions.k8s.io/v1",
};

// ── Path helpers ─────────────────────────────────────────────────────

function getPath(obj: unknown, path: string): unknown {
  let cur = obj;
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isNonEmptyArray(v: unknown): v is unknown[] {
  return Array.isArray(v) && v.length > 0;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// ── Document line ranges (approximate, split on '---' separators) ────

interface DocRange {
  start: number; // 0-based line index
  end: number;
}

export function docRanges(source: string): DocRange[] {
  const lines = source.split("\n");
  const ranges: DocRange[] = [];
  let start = 0;
  lines.forEach((line, i) => {
    if (/^---\s*$/.test(line)) {
      if (i > start) ranges.push({ start, end: i - 1 });
      start = i + 1;
    }
  });
  ranges.push({ start, end: lines.length - 1 });
  return ranges;
}

/** First line inside the doc range matching `^\s*key:` — 1-based. */
function locateKey(source: string, range: DocRange, key: string): number | undefined {
  const lines = source.split("\n");
  const re = new RegExp(`^\\s*${key}:`);
  for (let i = range.start; i <= Math.min(range.end, lines.length - 1); i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return undefined;
}

// ── Per-kind structural rules ────────────────────────────────────────

interface Rule {
  /** Dotted path whose presence is required. */
  path: string;
  message: string;
  /** Only flag when the value is missing OR not a non-empty array. */
  array?: boolean;
}

const KIND_RULES: Record<string, Rule[]> = {
  Pod: [
    { path: "spec.containers", array: true, message: "spec.containers must be a non-empty list" },
  ],
  Deployment: [
    { path: "spec.selector.matchLabels", message: "spec.selector.matchLabels is required (apps/v1)" },
    { path: "spec.template", message: "spec.template (pod template) is required" },
  ],
  StatefulSet: [
    { path: "spec.selector.matchLabels", message: "spec.selector.matchLabels is required" },
    { path: "spec.template", message: "spec.template is required" },
    { path: "spec.serviceName", message: "spec.serviceName is required for StatefulSet" },
  ],
  DaemonSet: [
    { path: "spec.selector.matchLabels", message: "spec.selector.matchLabels is required" },
    { path: "spec.template", message: "spec.template is required" },
  ],
  ReplicaSet: [
    { path: "spec.selector.matchLabels", message: "spec.selector.matchLabels is required" },
    { path: "spec.template", message: "spec.template is required" },
  ],
  Service: [
    { path: "spec.ports", array: true, message: "spec.ports must define at least one port" },
  ],
  Job: [
    { path: "spec.template", message: "spec.template is required" },
  ],
  CronJob: [
    { path: "spec.schedule", message: "spec.schedule (cron expression) is required" },
    { path: "spec.jobTemplate", message: "spec.jobTemplate is required" },
  ],
  PersistentVolumeClaim: [
    { path: "spec.accessModes", array: true, message: "spec.accessModes must be a non-empty list" },
    { path: "spec.resources.requests.storage", message: "spec.resources.requests.storage is required" },
  ],
  PersistentVolume: [
    { path: "spec.capacity.storage", message: "spec.capacity.storage is required" },
    { path: "spec.accessModes", array: true, message: "spec.accessModes must be a non-empty list" },
  ],
  Ingress: [
    { path: "spec", message: "spec is required (rules or defaultBackend)" },
  ],
  Role: [
    { path: "rules", array: true, message: "rules must be a non-empty list" },
  ],
  ClusterRole: [
    { path: "rules", array: true, message: "rules must be a non-empty list" },
  ],
  RoleBinding: [
    { path: "roleRef", message: "roleRef is required" },
    { path: "subjects", array: true, message: "subjects must be a non-empty list" },
  ],
  ClusterRoleBinding: [
    { path: "roleRef", message: "roleRef is required" },
    { path: "subjects", array: true, message: "subjects must be a non-empty list" },
  ],
  HorizontalPodAutoscaler: [
    { path: "spec.scaleTargetRef", message: "spec.scaleTargetRef is required" },
    { path: "spec.minReplicas", message: "spec.minReplicas is required" },
    { path: "spec.maxReplicas", message: "spec.maxReplicas is required" },
  ],
  PodDisruptionBudget: [
    { path: "spec.selector", message: "spec.selector is required" },
  ],
  NetworkPolicy: [
    { path: "spec.podSelector", message: "spec.podSelector is required" },
  ],
};

/** Kinds whose pod template holds containers to check. */
const TEMPLATED_KINDS = new Set([
  "Deployment",
  "StatefulSet",
  "DaemonSet",
  "ReplicaSet",
  "Job",
  "CronJob",
]);

function containerIssues(
  containers: unknown,
  basePath: string,
  docIndex: number,
): ManifestIssue[] {
  const issues: ManifestIssue[] = [];
  if (!isNonEmptyArray(containers)) {
    issues.push({
      docIndex,
      severity: "error",
      path: basePath,
      message: `${basePath} must be a non-empty list of containers`,
    });
    return issues;
  }
  containers.forEach((c, i) => {
    if (!isObj(c)) {
      issues.push({
        docIndex,
        severity: "error",
        path: `${basePath}[${i}]`,
        message: "container entry is not an object",
      });
      return;
    }
    if (!isNonEmptyString(c.name)) {
      issues.push({
        docIndex,
        severity: "error",
        path: `${basePath}[${i}].name`,
        message: "container needs a name",
      });
    }
    if (!isNonEmptyString(c.image)) {
      issues.push({
        docIndex,
        severity: "error",
        path: `${basePath}[${i}].image`,
        message: "container needs an image",
      });
    }
  });
  return issues;
}

// ── Main analyzer ────────────────────────────────────────────────────

export function analyzeManifests(source: string): ManifestReport {
  const report: ManifestReport = {
    syntaxValid: false,
    documentCount: 0,
    resources: [],
    issues: [],
  };

  if (source.trim() === "") {
    report.syntaxError = { message: "Input is empty" };
    return report;
  }

  // Stage 1: YAML syntax.
  let docs: unknown[];
  try {
    docs = [];
    loadAll(source, (d) => docs.push(d));
  } catch (err) {
    if (err instanceof YAMLException) {
      const mark = (err as YAMLException & { mark?: { line: number } }).mark;
      report.syntaxError = {
        message: err.reason ?? err.message,
        line: mark ? mark.line + 1 : undefined,
      };
    } else {
      report.syntaxError = {
        message: err instanceof Error ? err.message : "Unknown parse error",
      };
    }
    return report;
  }

  report.syntaxValid = true;
  const realDocs = docs.filter((d) => d !== null && d !== undefined);
  report.documentCount = realDocs.length;
  const ranges = docRanges(source);

  // Stage 2: structural checks per document.
  realDocs.forEach((doc, i) => {
    const range = ranges[Math.min(i, ranges.length - 1)];

    if (!isObj(doc)) {
      report.issues.push({
        docIndex: i,
        severity: "error",
        message: "Document is not a YAML mapping — a manifest must be an object",
      });
      return;
    }

    const apiVersion = doc.apiVersion;
    const kind = doc.kind;
    const name = getPath(doc, "metadata.name");

    if (!isNonEmptyString(apiVersion)) {
      report.issues.push({
        docIndex: i,
        severity: "error",
        path: "apiVersion",
        message: "apiVersion is missing or empty",
      });
    }
    if (!isNonEmptyString(kind)) {
      report.issues.push({
        docIndex: i,
        severity: "error",
        path: "kind",
        message: "kind is missing or empty",
      });
    }
    if (!isNonEmptyString(name)) {
      report.issues.push({
        docIndex: i,
        severity: "error",
        path: "metadata.name",
        line: locateKey(source, range, "metadata"),
        message: "metadata.name is missing or empty",
      });
    }
    if (isNonEmptyString(apiVersion) && isNonEmptyString(kind)) {
      report.resources.push({
        docIndex: i,
        apiVersion,
        kind,
        name: isNonEmptyString(name) ? name : "(unnamed)",
      });
    } else {
      report.issues.push({
        docIndex: i,
        severity: "info",
        message:
          "Document doesn't look like a Kubernetes resource (missing apiVersion/kind) — skipping structural checks",
      });
      return;
    }

    // Deprecated API check.
    const dep = DEPRECATED_APIS.find(
      (d) =>
        d.apiVersion === apiVersion && (!d.kinds || d.kinds.includes(kind)),
    );
    if (dep) {
      report.issues.push({
        docIndex: i,
        severity: "warning",
        path: "apiVersion",
        line: locateKey(source, range, "apiVersion"),
        message: `${apiVersion} ${kind} was removed in Kubernetes ${dep.removedIn} — use ${dep.replacement}`,
      });
    } else {
      // apiVersion sanity for known kinds.
      const expected = KIND_API[kind];
      if (expected && expected !== apiVersion) {
        report.issues.push({
          docIndex: i,
          severity: "warning",
          path: "apiVersion",
          line: locateKey(source, range, "apiVersion"),
          message: `${kind} is usually ${expected}, not "${apiVersion}" — verify this apiVersion exists on your cluster`,
        });
      }
    }

    // Unknown kind note (info only — CRDs are legitimate).
    if (!(kind in KIND_API) && !dep) {
      report.issues.push({
        docIndex: i,
        severity: "info",
        message: `Unknown kind "${kind}" — skipping built-in checks (may be a CRD)`,
      });
    }

    // Kind-specific required fields.
    const rules = KIND_RULES[kind] ?? [];
    for (const rule of rules) {
      const v = getPath(doc, rule.path);
      const ok = rule.array ? isNonEmptyArray(v) : v !== undefined && v !== null;
      if (!ok) {
        report.issues.push({
          docIndex: i,
          severity: "error",
          path: rule.path,
          message: rule.message,
        });
      }
    }

    // Container checks.
    if (kind === "Pod") {
      issues_push(containerIssues(getPath(doc, "spec.containers"), "spec.containers", i));
    } else if (TEMPLATED_KINDS.has(kind)) {
      const containerPath =
        kind === "CronJob"
          ? "spec.jobTemplate.spec.template.spec.containers"
          : "spec.template.spec.containers";
      const templatePresent =
        kind === "CronJob"
          ? getPath(doc, "spec.jobTemplate") !== undefined
          : getPath(doc, "spec.template") !== undefined;
      if (templatePresent) {
        issues_push(containerIssues(getPath(doc, containerPath), containerPath, i));
      }
      // Selector/template label match — the classic Deployment bug.
      if (kind !== "Job" && kind !== "CronJob") {
        const selector = getPath(doc, "spec.selector.matchLabels");
        const podLabels = getPath(doc, "spec.template.metadata.labels");
        if (isObj(selector) && isObj(podLabels)) {
          const mismatched = Object.entries(selector).filter(
            ([k, v]) => podLabels[k] !== v,
          );
          if (mismatched.length > 0) {
            report.issues.push({
              docIndex: i,
              severity: "error",
              path: "spec.template.metadata.labels",
              line: locateKey(source, range, "labels"),
              message: `pod template labels don't match selector: ${mismatched
                .map(([k]) => k)
                .join(", ")} — the controller will reject this`,
            });
          }
        }
      }
    }

    function issues_push(list: ManifestIssue[]) {
      report.issues.push(...list);
    }
  });

  return report;
}
