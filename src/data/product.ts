/**
 * The Kubernetes Troubleshooting Toolkit — launch edition.
 *
 * Claims here reflect only what ships today. The catalog grows over
 * time; pricing may change for new buyers but existing customers keep
 * free updates to the edition they purchased.
 */

export const product = {
  id: "KUBERNETES_TOOLKIT",
  slug: "kubernetes-toolkit",
  name: "Kubernetes Troubleshooting Toolkit",
  version: "1.0",
  edition: "Launch Edition",
  priceUsd: 39,
  futureBundlePriceUsd: 79,
  tagline:
    "A field manual for production Kubernetes incidents — structured runbooks, verified commands, and checklists you can use at 3 a.m.",
  contents: [
    "PDF troubleshooting handbook (printable, offline-friendly)",
    "Markdown runbooks covering the most common production failure modes",
    "Annotated kubectl command reference organized by symptom",
    "YAML examples for probes, resources, and common fixes",
    "Printable incident-response checklists",
  ],
  formats: ["PDF", "Markdown", "YAML"],
  runbookCount: 6,
  compatibility: "Kubernetes 1.28+, kubectl 1.28+, any CNCF-conformant cluster",
  faq: [
    {
      q: "What exactly do I get after purchase?",
      a: "An immediate download link from the checkout provider containing a ZIP archive: the PDF handbook, Markdown runbooks, YAML examples, and checklists. Yours to keep — no DRM, no subscription required.",
    },
    {
      q: "Is this a subscription?",
      a: "No. It's a one-time purchase. Updates to the edition you bought are free; a future expanded bundle may be sold separately.",
    },
    {
      q: "Which Kubernetes versions does it cover?",
      a: "Written and verified against Kubernetes 1.28–1.34. The diagnostic workflows apply to older versions too, but specific kubectl output may differ slightly.",
    },
    {
      q: "I'm a beginner. Is this for me?",
      a: "The runbooks assume you can run kubectl and read pod specs. You don't need to be an expert — each guide explains what every command does and why.",
    },
    {
      q: "Can I share it with my team?",
      a: "The license covers one engineer. A team license option is planned; contact us if you need multiple seats now.",
    },
    {
      q: "What if it doesn't help me?",
      a: "There's a 14-day refund policy — see /refund-policy for details.",
    },
  ],
} as const;
