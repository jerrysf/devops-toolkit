import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ManifestValidatorTool } from "@/components/manifest-validator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";
import { K8S_TARGET_VERSION } from "@/lib/k8s-manifest";

export const metadata: Metadata = {
  title: "Kubernetes Manifest Validator — Free Online Tool",
  description:
    "Validate Kubernetes manifests in your browser: required fields, structural checks, deprecated API versions. Multi-document YAML, runs entirely locally.",
  alternates: { canonical: absoluteUrl("/tools/manifest-validator") },
};

export default function ManifestValidatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Tools", href: "/tools" },
          { title: "Manifest Validator" },
        ]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kubernetes Manifest Validator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Check Deployments, Services, Jobs, RBAC, and more for missing
          required fields, structural mistakes, and deprecated API versions —
          targeted at Kubernetes {K8S_TARGET_VERSION}. Everything runs in your
          browser; manifests are never uploaded.
        </p>
      </header>

      <ManifestValidatorTool />

      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="What this tool validates">
          <p>
            This performs <strong>structural validation</strong>: YAML syntax,
            required top-level fields (<code>apiVersion</code>,{" "}
            <code>kind</code>, <code>metadata.name</code>), kind-specific
            required fields (selectors, pod templates, ports, rules), container
            name/image presence, selector↔label mismatches, and API versions
            removed before Kubernetes {K8S_TARGET_VERSION}.
          </p>
          <p className="mt-2">
            It does <strong>not</strong> validate against full OpenAPI schemas
            — it won't catch a misspelled field name or an enum typo. For
            schema-grade validation use <code>kubeconform</code>,{" "}
            <code>kubectl apply --dry-run=client</code>, or{" "}
            <code>--dry-run=server</code> against a real cluster.
          </p>
        </Callout>
      </div>
    </div>
  );
}
