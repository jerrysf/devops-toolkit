import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProbeGeneratorTool } from "@/components/probe-generator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes Probe Generator — Free Online Tool",
  description:
    "Generate liveness, readiness, and startup probe YAML — httpGet, tcpSocket, exec, grpc — with timing explanations and common-mistake warnings.",
  alternates: { canonical: absoluteUrl("/tools/probe-generator") },
};

export default function ProbeGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "Probe Generator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Probe Generator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build liveness, readiness, and startup probes with correct timing
          semantics — and warnings for the mistakes that cause restart storms
          and traffic blackholes.
        </p>
      </header>
      <ProbeGeneratorTool />
      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="Liveness ≠ readiness">
          <p>
            The classic probe mistake: pointing liveness at a dependency-heavy
            endpoint (DB check, /ready). When the dependency hiccups, kubelet
            restarts every healthy container in a cascade. Keep liveness
            shallow (is the process alive?) and put dependency checks in
            readiness.
          </p>
        </Callout>
      </div>
    </div>
  );
}
