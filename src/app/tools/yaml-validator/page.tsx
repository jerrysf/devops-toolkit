import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { YamlValidatorTool } from "@/components/yaml-validator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "YAML Validator — Free Online Tool",
  description:
    "Validate and format YAML in your browser with precise error locations. No upload — your YAML never leaves your machine.",
  alternates: { canonical: absoluteUrl("/tools/yaml-validator") },
};

export default function YamlValidatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "YAML Validator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          YAML Validator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Paste YAML to check its syntax and see a formatted version.
          Everything runs locally in your browser — nothing is sent to a
          server.
        </p>
      </header>

      <YamlValidatorTool />

      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="What this tool does and doesn't check">
          <p>
            This validates <strong>YAML syntax</strong>: indentation, document
            structure, anchors, and scalar parsing. It does{" "}
            <strong>not</strong> perform semantic Kubernetes validation — it
            can't tell you whether a Deployment spec is complete or a field
            name is valid for a given API version. For that, use{" "}
            <code>kubectl apply --dry-run=server</code> against a real cluster,
            or a schema validator like kubeconform.
          </p>
        </Callout>
        <div className="prose prose-invert mt-6 max-w-none text-sm text-muted-foreground dark:prose-invert">
          <h2 className="text-base font-medium text-foreground">
            Common YAML mistakes this catches
          </h2>
          <ul>
            <li>Tabs instead of spaces — YAML forbids tab indentation.</li>
            <li>Inconsistent indent depth in nested mappings.</li>
            <li>Unquoted values like <code>yes</code>, <code>on</code>, or version numbers being parsed as booleans/floats.</li>
            <li>Duplicate keys in a mapping.</li>
            <li>A missing space after the <code>:</code> in key-value pairs.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
