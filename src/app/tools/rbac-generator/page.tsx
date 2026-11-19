import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RbacGeneratorTool } from "@/components/rbac-generator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes RBAC Generator — Free Online Tool",
  description:
    "Generate Role, ClusterRole, RoleBinding, and ClusterRoleBinding YAML with least-privilege warnings. Free, runs entirely in your browser.",
  alternates: { canonical: absoluteUrl("/tools/rbac-generator") },
};

export default function RbacGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "RBAC Generator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          RBAC Generator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build Roles, ClusterRoles, and bindings with guided least-privilege
          warnings. Nothing is sent anywhere — this runs in your browser.
        </p>
      </header>
      <RbacGeneratorTool />
      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="Least privilege, by default">
          <p>
            The warnings flag wildcard resources/verbs, secrets access, and
            cluster-scope write permissions — the three most common RBAC
            over-permissioning mistakes. Start with <code>get</code>,{" "}
            <code>list</code>, <code>watch</code>; add write verbs only where
            the workload genuinely needs them.
          </p>
        </Callout>
      </div>
    </div>
  );
}
