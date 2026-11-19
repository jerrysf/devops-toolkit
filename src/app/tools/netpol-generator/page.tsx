import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NetpolGeneratorTool } from "@/components/netpol-generator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes NetworkPolicy Generator — Free Online Tool",
  description:
    "Generate ingress and egress NetworkPolicy YAML with selector explanations and default-deny guidance. Runs entirely in your browser.",
  alternates: { canonical: absoluteUrl("/tools/netpol-generator") },
};

export default function NetpolGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "NetworkPolicy Generator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          NetworkPolicy Generator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build ingress and egress policies with pod/namespace selectors and
          IP blocks — with explanations of how default-deny and DNS egress
          actually work.
        </p>
      </header>
      <NetpolGeneratorTool />
      <div className="mt-10 max-w-3xl">
        <Callout type="warning" title="NetworkPolicy needs a CNI that enforces it">
          <p>
            NetworkPolicy is enforced by your cluster's CNI plugin (Calico,
            Cilium, Weave, …) — not by Kubernetes itself. If your CNI doesn't
            implement it, the policy applies cleanly and does nothing. Verify
            with your platform team which plugin your cluster runs.
          </p>
        </Callout>
      </div>
    </div>
  );
}
