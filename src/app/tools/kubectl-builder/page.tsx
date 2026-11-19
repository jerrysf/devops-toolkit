import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { KubectlBuilderTool } from "@/components/kubectl-builder-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "kubectl Command Builder — Free Online Tool",
  description:
    "Build kubectl commands from structured selections — get, describe, logs, exec, rollout, events, top. Every flag explained, read-only and modifying commands clearly marked.",
  alternates: { canonical: absoluteUrl("/tools/kubectl-builder") },
};

export default function KubectlBuilderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Tools", href: "/tools" },
          { title: "kubectl Builder" },
        ]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          kubectl Command Builder
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Assemble kubectl commands with structured options instead of
          remembering flag order. Each generated flag is explained, and
          commands are marked read-only or modifying.
        </p>
      </header>

      <KubectlBuilderTool />

      <div className="mt-10 max-w-3xl">
        <Callout type="warning" title="Check your context before running">
          <p>
            Generated commands are never executed by this page. Before pasting
            into a terminal, verify you're pointed at the right cluster with{" "}
            <code>kubectl config current-context</code>. Commands marked{" "}
            <strong>modifying</strong> (rollout restart/undo, exec) change live
            state or run inside live containers.
          </p>
        </Callout>
      </div>
    </div>
  );
}
