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
