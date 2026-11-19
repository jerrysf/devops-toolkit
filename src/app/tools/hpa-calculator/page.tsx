import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { HpaCalculatorTool } from "@/components/hpa-calculator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes HPA Calculator — Free Online Tool",
  description:
    "Model HPA replica counts from CPU requests and observed usage. Generates autoscaling/v2 YAML. Estimates only — not a sizing rule.",
  alternates: { canonical: absoluteUrl("/tools/hpa-calculator") },
};

export default function HpaCalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "HPA Calculator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          HPA Calculator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Model how the HorizontalPodAutoscaler will react to your observed
          CPU usage, and generate the autoscaling/v2 manifest.
        </p>
      </header>
      <HpaCalculatorTool />
      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="Estimates, not sizing">
          <p>
            This models the HPA's arithmetic — it can't tell you whether CPU
            is even the right metric for your workload. Memory-bound apps,
            connection-limited services, and queue consumers often need custom
            metrics. Always validate against real traffic patterns.
          </p>
        </Callout>
      </div>
    </div>
  );
}
