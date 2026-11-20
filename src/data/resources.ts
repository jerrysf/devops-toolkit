/**
 * Resource catalog — free and premium downloadable products.
 * `status: "live"` items link to a real page/download; `"planned"`
 * items show an honest in-development state (no fake prices/CTAs).
 */

export interface ResourceProduct {
  slug: string;
  title: string;
  description: string;
  contents: string[];
  tier: "free" | "premium";
  status: "live" | "planned";
  /** For live items: where the CTA goes (page or file). */
  href?: string;
  price?: string;
  /** "download" renders a direct-download CTA; "page" links to a landing page. */
  cta?: "download" | "page";
}

export interface DesktopTool {
  name: string;
  description: string;
  bestFor: string;
  interface: "GUI" | "TUI";
  cost: string;
  url: string;
}

/**
 * Third-party Kubernetes desktop tools. Links go to each project's
 * official site/repo — we don't mirror binaries. Order reflects
 * how complete a kubectl replacement each is.
 */
export const desktopTools: DesktopTool[] = [
  {
    name: "Freelens",
    description:
      "Open-source continuation of the classic Lens experience. Full cluster explorer: pods, logs, exec shell, resource editing, Helm releases.",
    bestFor: "Closest drop-in GUI replacement for kubectl",
    interface: "GUI",
    cost: "Free, open source",
    url: "https://github.com/freelensapp/freelens",
  },
  {
    name: "Headlamp",
    description:
      "CNCF sandbox project. Runs as a desktop app or in-cluster. Clean UI for workloads, RBAC, and network resources with a plugin system.",
    bestFor: "Teams wanting a vendor-neutral, extensible UI",
    interface: "GUI",
    cost: "Free, open source",
    url: "https://headlamp.dev",
  },
  {
    name: "OpenLens",
    description:
      "Community builds of Lens core without the proprietary layer. Familiar Lens workflow; requires building or using community binaries.",
    bestFor: "Lens users who want the original codebase",
    interface: "GUI",
    cost: "Free, open source",
    url: "https://github.com/MuhammedKalkan/OpenLens",
  },
  {
    name: "Rancher Desktop",
    description:
      "Desktop Kubernetes + container runtime (k3s). Bundles GUI cluster management with a local dev cluster — useful for learning and testing.",
    bestFor: "Running a local cluster, not managing prod",
    interface: "GUI",
    cost: "Free, open source",
    url: "https://rancherdesktop.io",
  },
  {
    name: "k9s",
    description:
      "Terminal UI for real-time cluster management. Faster than any GUI once learned — watch pods, tail logs, exec, delete, all keyboard-driven.",
    bestFor: "CLI users who want speed without memorizing flags",
    interface: "TUI",
    cost: "Free, open source",
    url: "https://k9scli.io",
  },
];

export const resources: ResourceProduct[] = [
  {
    slug: "kubernetes-toolkit",
    title: "Kubernetes Troubleshooting Toolkit",
    description:
      "The flagship product: structured runbooks, diagnostic workflows, kubectl references, and YAML examples for production pod, node, and networking failures.",
    contents: [
      "Complete runbooks for CrashLoopBackOff, ImagePullBackOff, and Node NotReady",
      "Diagnostic command workflows with expected outputs",
      "kubectl command reference for incidents",
      "YAML examples: probes, image pull secrets, resource limits",
      "Markdown + PDF-friendly formats",
    ],
    tier: "premium",
    status: "live",
    href: "/products/kubernetes-toolkit",
    price: "$39",
    cta: "page",
  },
  {
    slug: "incident-triage-checklist",
    title: "Incident Triage Checklist",
    description:
      "A free one-page triage sheet for the first 15 minutes of a Kubernetes incident — what to check, in what order, and what to record.",
    contents: [
      "First-5-minutes data capture commands",
      "Triage ordering: blast radius before root cause",
      "Escalation and comms checkpoints",
    ],
    tier: "free",
    status: "live",
    href: "/downloads/incident-triage-checklist.md",
    cta: "download",
  },
  {
    slug: "production-readiness-checklist",
    title: "Production Readiness Checklist",
    description:
      "A pre-launch audit checklist covering probes, resources, security contexts, rollout strategy, observability, and runbook requirements.",
    contents: [
      "Health check and probe requirements",
      "Resource requests/limits and capacity checks",
      "Security context and RBAC review",
      "Rollback and observability criteria",
    ],
    tier: "premium",
    status: "planned",
  },
  {
    slug: "kubernetes-audit-checklist",
    title: "Kubernetes Audit Checklist",
    description:
      "A security and configuration audit checklist for existing clusters — RBAC, network policy, admission control, and workload hygiene.",
    contents: [
      "RBAC review walkthrough",
      "NetworkPolicy and ingress exposure checks",
      "Pod security standards assessment",
      "Control plane and etcd hygiene",
    ],
    tier: "premium",
    status: "planned",
  },
  {
    slug: "incident-response-templates",
    title: "Incident Response Templates",
    description:
      "Ready-to-use templates for incident comms, timelines, and postmortems — Slack announcements, status page updates, blameless review docs.",
    contents: [
      "Severity classification matrix",
      "Incident comms templates (internal + external)",
      "Timeline capture worksheet",
      "Blameless postmortem template",
    ],
    tier: "premium",
    status: "planned",
  },
  {
    slug: "sre-oncall-runbook-templates",
    title: "SRE On-call Runbook Templates",
    description:
      "A skeleton for writing service runbooks your on-call rotation will actually use — alert → diagnosis → mitigation → escalation structure.",
    contents: [
      "Runbook page template",
      "Alert-response pattern library",
      "Escalation matrix template",
      "On-call handover checklist",
    ],
    tier: "premium",
    status: "planned",
  },
];
