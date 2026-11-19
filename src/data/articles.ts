/**
 * Registry of Kubernetes troubleshooting content.
 *
 * `published` articles have real MDX files under content/kubernetes/
 * and are routed. `comingSoon` entries appear on index pages as
 * "in progress" — they intentionally have no route so nothing
 * pretends to be finished.
 *
 * Taxonomy fields (severity/component/difficulty/symptoms) power the
 * Troubleshooting Center's search and filtering.
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type Component =
  | "pod"
  | "node"
  | "workload"
  | "network"
  | "storage"
  | "scheduling"
  | "image"
  | "dns";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export const severityOrder: Severity[] = ["critical", "high", "medium", "low"];
export const difficultyOrder: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const componentLabels: Record<Component, string> = {
  pod: "Pod runtime",
  node: "Node",
  workload: "Workload",
  network: "Networking",
  storage: "Storage",
  scheduling: "Scheduling",
  image: "Image / Registry",
  dns: "DNS",
};

export interface ArticleMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  severity: Severity;
  component: Component;
  difficulty: Difficulty;
  /** Searchable symptom strings users actually see. */
  symptoms: string[];
  /** Kubernetes versions the guide was verified against. */
  kubernetesVersions: string;
  lastReviewed: string; // ISO date
  readingTimeMinutes: number;
  related: string[]; // slugs
  published: boolean;
  keywords: string[];
}

export const kubernetesArticles: ArticleMeta[] = [
  {
    slug: "crashloopbackoff",
    title: "How to Fix CrashLoopBackOff in Kubernetes",
    shortTitle: "CrashLoopBackOff",
    description:
      "Diagnose and fix CrashLoopBackOff pods: read restart-aware logs, interpret exit codes, and resolve the most common root causes step by step.",
    severity: "high",
    component: "pod",
    difficulty: "beginner",
    symptoms: [
      "pod keeps restarting",
      "CrashLoopBackOff status",
      "back-off restarting failed container",
      "container exits immediately",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 12,
    related: ["imagepullbackoff", "node-not-ready"],
    published: true,
    keywords: ["crashloopbackoff", "pod keeps restarting", "kubectl logs previous"],
  },
  {
    slug: "imagepullbackoff",
    title: "How to Fix ImagePullBackOff and ErrImagePull in Kubernetes",
    shortTitle: "ImagePullBackOff",
    description:
      "Troubleshoot image pull failures: bad tags, private registry authentication, imagePullSecrets, and registry rate limiting.",
    severity: "medium",
    component: "image",
    difficulty: "beginner",
    symptoms: [
      "ImagePullBackOff",
      "ErrImagePull",
      "failed to pull image",
      "pull access denied",
      "manifest unknown",
      "toomanyrequests",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 10,
    related: ["crashloopbackoff", "pod-pending"],
    published: true,
    keywords: ["imagepullbackoff", "errimagepull", "image pull secret"],
  },
  {
    slug: "node-not-ready",
    title: "How to Fix a Kubernetes Node in NotReady State",
    shortTitle: "Node NotReady",
    description:
      "Bring a NotReady node back online: check node conditions, kubelet health, resource pressure, and safely drain when needed.",
    severity: "critical",
    component: "node",
    difficulty: "intermediate",
    symptoms: [
      "node NotReady",
      "KubeletNotReady",
      "DiskPressure",
      "MemoryPressure",
      "pods stuck Terminating",
      "node lost",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 11,
    related: ["crashloopbackoff", "pvc-pending"],
    published: true,
    keywords: ["node notready", "kubelet down", "kubectl describe node"],
  },
  {
    slug: "pod-pending",
    title: "How to Fix a Pod Stuck in Pending",
    shortTitle: "Pod Pending",
    description:
      "Unschedulable pods: insufficient resources, taints, affinity rules, and unbound volumes.",
    severity: "medium",
    component: "scheduling",
    difficulty: "beginner",
    symptoms: [
      "pod Pending",
      "FailedScheduling",
      "Insufficient cpu",
      "Insufficient memory",
      "node affinity",
      "untolerated taint",
      "unbound immediate PersistentVolumeClaims",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["node-not-ready", "pvc-pending"],
    published: true,
    keywords: ["pod pending", "unschedulable"],
  },
  {
    slug: "oomkilled",
    title: "How to Fix OOMKilled Containers",
    shortTitle: "OOMKilled",
    description:
      "Memory limits, exit code 137, and right-sizing requests to stop OOM kills.",
    severity: "high",
    component: "pod",
    difficulty: "intermediate",
    symptoms: [
      "OOMKilled",
      "exit code 137",
      "container killed",
      "memory limit exceeded",
      "pod evicted",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["crashloopbackoff"],
    published: true,
    keywords: ["oomkilled", "exit code 137", "memory limit"],
  },
  {
    slug: "dns-resolution",
    title: "How to Fix DNS Resolution Failures (CoreDNS)",
    shortTitle: "DNS Resolution",
    description:
      "Debug CoreDNS: nxdomain errors, ndots behavior, and upstream resolution failures.",
    severity: "high",
    component: "dns",
    difficulty: "advanced",
    symptoms: [
      "NXDOMAIN",
      "no such host",
      "name resolution failed",
      "dial tcp: lookup",
      "CoreDNS",
      "temporary failure in name resolution",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["crashloopbackoff", "ingress-502"],
    published: true,
    keywords: ["coredns", "nxdomain", "dns lookup failed"],
  },
  {
    slug: "pvc-pending",
    title: "How to Fix a PVC Stuck in Pending",
    shortTitle: "PVC Pending",
    description:
      "Unbound persistent volume claims: storage classes, provisioners, and capacity.",
    severity: "medium",
    component: "storage",
    difficulty: "intermediate",
    symptoms: [
      "pvc Pending",
      "unbound immediate PersistentVolumeClaims",
      "waiting for a volume to be created",
      "failed to provision volume",
      "storageclass not found",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["pod-pending", "node-not-ready"],
    published: true,
    keywords: ["pvc pending", "unbound pvc", "storageclass"],
  },
  {
    slug: "ingress-502",
    title: "How to Fix 502 Bad Gateway from an Ingress",
    shortTitle: "Ingress 502",
    description:
      "Trace 502 errors through ingress controllers to services, endpoints, and pods.",
    severity: "high",
    component: "network",
    difficulty: "advanced",
    symptoms: [
      "502 Bad Gateway",
      "no endpoints",
      "upstream connect error",
      "ingress not working",
      "service unavailable",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["crashloopbackoff", "dns-resolution"],
    published: true,
    keywords: ["ingress 502", "bad gateway", "no endpoints"],
  },
  {
    slug: "rbac-forbidden",
    title: "How to Fix RBAC Forbidden Errors (ServiceAccounts)",
    shortTitle: "RBAC Forbidden",
    description:
      "Decode Forbidden/403 errors: missing RoleBindings, wrong verbs, ServiceAccount typos, and cluster-vs-namespaced scope.",
    severity: "medium",
    component: "workload",
    difficulty: "intermediate",
    symptoms: [
      "Forbidden",
      "cannot get resource",
      "serviceaccount",
      "403",
      "rbac",
      "system:serviceaccount",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["rollout-stuck", "crashloopbackoff"],
    published: true,
    keywords: ["rbac forbidden", "kubectl auth can-i", "serviceaccount permissions"],
  },
  {
    slug: "rollout-stuck",
    title: "How to Fix a Stuck or Failed Deployment Rollout",
    shortTitle: "Rollout Failure",
    description:
      "Stuck rollouts and ProgressDeadlineExceeded: trace to the new ReplicaSet's pods, diagnose the blocker, and safely undo.",
    severity: "high",
    component: "workload",
    difficulty: "intermediate",
    symptoms: [
      "rollout stuck",
      "ProgressDeadlineExceeded",
      "updated replicas are available",
      "rollout status hangs",
      "deployment not rolling out",
    ],
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "2026-11-19",
    readingTimeMinutes: 9,
    related: ["pod-pending", "imagepullbackoff", "crashloopbackoff"],
    published: true,
    keywords: ["rollout stuck", "progressdeadlineexceeded", "rollout undo"],
  },
];

export const publishedArticles = kubernetesArticles.filter((a) => a.published);

export function getArticleMeta(slug: string): ArticleMeta | undefined {
  return kubernetesArticles.find((a) => a.slug === slug && a.published);
}
