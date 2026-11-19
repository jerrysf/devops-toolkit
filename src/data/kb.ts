/**
 * Knowledge Base taxonomy. Items link to real content — existing
 * guides, tools, simulator scenarios, references — grouped by
 * discipline. Categories with no content yet render an honest
 * "in development" state rather than stub articles.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Boxes,
  Cloud,
  Container,
  Eye,
  FileStack,
  GitBranch,
  TerminalSquare,
  Wrench,
} from "lucide-react";

export interface KbCategory {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface KbItem {
  title: string;
  description: string;
  href: string;
  category: string; // category slug
  type: "guide" | "reference" | "tool" | "wizard" | "simulator" | "checklist";
}

export const kbCategories: KbCategory[] = [
  {
    slug: "kubernetes",
    title: "Kubernetes",
    description:
      "Troubleshooting guides, diagnostic workflows, command references, and practice scenarios.",
    icon: Boxes,
  },
  {
    slug: "sre",
    title: "SRE & Reliability",
    description:
      "Incident response, production readiness, on-call practices, and reliability checklists.",
    icon: AlertTriangle,
  },
  {
    slug: "incident-management",
    title: "Incident Management",
    description:
      "Diagnosis workflows, incident checklists, and structured troubleshooting practice.",
    icon: FileStack,
  },
  {
    slug: "aws",
    title: "AWS",
    description:
      "Cloud troubleshooting and operations content — in development.",
    icon: Cloud,
  },
  {
    slug: "terraform",
    title: "Terraform",
    description:
      "IaC workflows and state troubleshooting — in development.",
    icon: GitBranch,
  },
  {
    slug: "docker",
    title: "Docker",
    description:
      "Container debugging and image troubleshooting — in development.",
    icon: Container,
  },
  {
    slug: "linux",
    title: "Linux",
    description:
      "System diagnosis and performance tooling — in development.",
    icon: TerminalSquare,
  },
  {
    slug: "cicd",
    title: "CI/CD",
    description:
      "Pipeline debugging and deployment automation — in development.",
    icon: Wrench,
  },
  {
    slug: "observability",
    title: "Observability",
    description:
      "Metrics, logging, and alerting practices — in development.",
    icon: Eye,
  },
];

export const kbItems: KbItem[] = [
  // ── Kubernetes ─────────────────────────────────────────────────
  {
    title: "CrashLoopBackOff: Complete Diagnostic Guide",
    description:
      "Symptoms, ranked causes, step-by-step diagnosis, and safe fixes for the most common pod failure.",
    href: "/kubernetes/crashloopbackoff",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "ImagePullBackOff: Complete Diagnostic Guide",
    description:
      "Registry auth, bad tags, and network causes — how to tell them apart from the events.",
    href: "/kubernetes/imagepullbackoff",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "Node NotReady: Complete Diagnostic Guide",
    description:
      "Kubelet heartbeats, conditions, and what NotReady actually means for your pods.",
    href: "/kubernetes/node-not-ready",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "Pod Pending: Complete Diagnostic Guide",
    description:
      "FailedScheduling events decoded — insufficient resources, taints, affinity, and unbound PVCs.",
    href: "/kubernetes/pod-pending",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "OOMKilled: Complete Diagnostic Guide",
    description:
      "Exit code 137, memory limits vs observed usage, and distinguishing leaks from under-provisioning.",
    href: "/kubernetes/oomkilled",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "DNS Resolution: Complete Diagnostic Guide",
    description:
      "CoreDNS health, missing endpoints, NXDOMAIN vs timeout, and ndots search-domain behavior.",
    href: "/kubernetes/dns-resolution",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "PVC Pending: Complete Diagnostic Guide",
    description:
      "StorageClasses, provisioners, and why claims stay unbound — the scheduling blocker behind StatefulSets.",
    href: "/kubernetes/pvc-pending",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "Ingress 502: Complete Diagnostic Guide",
    description:
      "Trace a Bad Gateway through ingress → service → endpoints → container port to the real break.",
    href: "/kubernetes/ingress-502",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "RBAC Forbidden: Complete Diagnostic Guide",
    description:
      "Parse the Forbidden message, use `kubectl auth can-i`, and find the missing verb or binding.",
    href: "/kubernetes/rbac-forbidden",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "Deployment Rollout Failure: Complete Diagnostic Guide",
    description:
      "Stuck rollouts and ProgressDeadlineExceeded — trace to the new ReplicaSet's pods and safely undo.",
    href: "/kubernetes/rollout-stuck",
    category: "kubernetes",
    type: "guide",
  },
  {
    title: "kubectl Command Reference",
    description:
      "The commands you actually use during incidents — organized by task, with safety notes.",
    href: "/kubernetes/kubectl-commands",
    category: "kubernetes",
    type: "reference",
  },
  {
    title: "Manifest Validator",
    description:
      "Structural checks for Kubernetes YAML — required fields, deprecated APIs, selector mismatches.",
    href: "/tools/manifest-validator",
    category: "kubernetes",
    type: "tool",
  },
  {
    title: "kubectl Command Builder",
    description:
      "Assemble kubectl commands from options — every flag explained, read-only vs modifying marked.",
    href: "/tools/kubectl-builder",
    category: "kubernetes",
    type: "tool",
  },
  {
    title: "Resource Calculator",
    description:
      "Sum requests/limits across containers and replicas; convert CPU and memory units.",
    href: "/tools/resource-calculator",
    category: "kubernetes",
    type: "tool",
  },
  // ── SRE & Reliability ──────────────────────────────────────────
  {
    title: "Incident Response Checklist",
    description:
      "A production incident checklist — triage, diagnosis, mitigation, and post-incident steps.",
    href: "/kubernetes/checklist",
    category: "sre",
    type: "checklist",
  },
  {
    title: "Resource Calculator",
    description:
      "Sanity-check requests and limits before they become capacity problems.",
    href: "/tools/resource-calculator",
    category: "sre",
    type: "tool",
  },
  // ── Incident Management ────────────────────────────────────────
  {
    title: "Guided Troubleshooting Wizard",
    description:
      "Answer structured questions to reach a diagnosis path — decision support for live incidents.",
    href: "/troubleshoot/wizard",
    category: "incident-management",
    type: "wizard",
  },
  {
    title: "Practice: CrashLoopBackOff",
    description:
      "Diagnose a crashing deployment against a simulated cluster.",
    href: "/simulator/crashloopbackoff",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: ImagePullBackOff",
    description: "Find why pods can't pull their image.",
    href: "/simulator/imagepullbackoff",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: Pod Pending",
    description: "Trace a scheduling failure to its root cause.",
    href: "/simulator/pod-pending",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: Node NotReady",
    description: "Investigate a node that stopped reporting.",
    href: "/simulator/node-not-ready",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: DNS Resolution Failure",
    description: "NXDOMAIN on a ClusterIP service — find why the record is missing.",
    href: "/simulator/dns-resolution",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: OOMKilled",
    description: "Exit code 137 — find why the container keeps getting killed.",
    href: "/simulator/oomkilled",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: PVC Pending",
    description: "An unbound claim blocks a StatefulSet — trace the StorageClass.",
    href: "/simulator/pvc-pending",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: Ingress 502",
    description: "Follow a Bad Gateway from ingress to the dead container port.",
    href: "/simulator/ingress-502",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: RBAC Forbidden",
    description: "A 403 on the API — find the missing verb or binding.",
    href: "/simulator/rbac-forbidden",
    category: "incident-management",
    type: "simulator",
  },
  {
    title: "Practice: Rollout Failure",
    description: "A deployment stuck mid-rollout — find which new pod blocks it.",
    href: "/simulator/rollout-stuck",
    category: "incident-management",
    type: "simulator",
  },
];

export function getKbCategory(slug: string): KbCategory | undefined {
  return kbCategories.find((c) => c.slug === slug);
}

export function kbItemsFor(category: string): KbItem[] {
  return kbItems.filter((i) => i.category === category);
}

export function searchKb(query: string): KbItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return kbItems;
  return kbItems.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      getKbCategory(i.category)?.title.toLowerCase().includes(q),
  );
}
