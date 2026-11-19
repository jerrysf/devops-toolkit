import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ResourceCalculatorTool } from "@/components/resource-calculator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes Resource Calculator — Free Online Tool",
  description:
    "Calculate total CPU and memory requests/limits for a workload across containers and replicas. Convert CPU and memory units, catch limit-below-request mistakes.",
  alternates: { canonical: absoluteUrl("/tools/resource-calculator") },
};

export default function ResourceCalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Tools", href: "/tools" },
          { title: "Resource Calculator" },
        ]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kubernetes Resource Calculator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Sum requests and limits across a pod's containers and replicas,
          convert between CPU/memory units, and catch common mistakes like
          limits below requests.
        </p>
      </header>

      <ResourceCalculatorTool />

      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="Estimates, not sizing rules">
          <p>
            This tool does arithmetic and sanity checks — it doesn't tell you
            what your app needs. Right-sized requests come from observed usage
            (e.g. <code>kubectl top</code>, Prometheus metrics, or a VPA
            recommendation), not from generic defaults. Requests determine
            scheduling; limits determine throttling/OOM boundaries.
          </p>
        </Callout>
      </div>
    </div>
  );
}
