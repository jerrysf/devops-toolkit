/**
 * Registry of Kubernetes troubleshooting content.
 *
 * `published` articles have real MDX files under content/kubernetes/
 * and are routed. `comingSoon` entries appear on index pages as
 * "in progress" — they intentionally have no route so nothing
 * pretends to be finished.
 */

export interface ArticleMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
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
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "",
    readingTimeMinutes: 0,
    related: ["node-not-ready", "pvc-pending"],
    published: false,
    keywords: ["pod pending", "unschedulable"],
  },
  {
    slug: "oomkilled",
    title: "How to Fix OOMKilled Containers",
    shortTitle: "OOMKilled",
    description:
      "Memory limits, exit code 137, and right-sizing requests to stop OOM kills.",
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "",
    readingTimeMinutes: 0,
    related: ["crashloopbackoff"],
    published: false,
    keywords: ["oomkilled", "exit code 137", "memory limit"],
  },
  {
    slug: "dns-resolution",
    title: "How to Fix DNS Resolution Failures (CoreDNS)",
    shortTitle: "DNS Resolution",
    description:
      "Debug CoreDNS: nxdomain errors, ndots behavior, and upstream resolution failures.",
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "",
    readingTimeMinutes: 0,
    related: ["crashloopbackoff"],
    published: false,
    keywords: ["coredns", "nxdomain", "dns lookup failed"],
  },
  {
    slug: "pvc-pending",
    title: "How to Fix a PVC Stuck in Pending",
    shortTitle: "PVC Pending",
    description:
      "Unbound persistent volume claims: storage classes, provisioners, and capacity.",
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "",
    readingTimeMinutes: 0,
    related: ["pod-pending", "node-not-ready"],
    published: false,
    keywords: ["pvc pending", "unbound pvc", "storageclass"],
  },
  {
    slug: "ingress-502",
    title: "How to Fix 502 Bad Gateway from an Ingress",
    shortTitle: "Ingress 502",
    description:
      "Trace 502 errors through ingress controllers to services, endpoints, and pods.",
    kubernetesVersions: "1.28 – 1.34",
    lastReviewed: "",
    readingTimeMinutes: 0,
    related: ["crashloopbackoff", "dns-resolution"],
    published: false,
    keywords: ["ingress 502", "bad gateway", "no endpoints"],
  },
];

export const publishedArticles = kubernetesArticles.filter((a) => a.published);

export function getArticleMeta(slug: string): ArticleMeta | undefined {
  return kubernetesArticles.find((a) => a.slug === slug && a.published);
}
