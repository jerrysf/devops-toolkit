/**
 * RBAC manifest generator — Role/ClusterRole + bindings with
 * least-privilege warnings.
 */

export type RuleScope = "namespaced" | "cluster";

export interface RbacRule {
  apiGroup: string; // "" for core
  resources: string;
  verbs: string[];
}

export interface RbacInput {
  name: string;
  namespace: string;
  scope: RuleScope;
  rules: RbacRule[];
  bindTo: {
    kind: "ServiceAccount" | "User" | "Group";
    name: string;
    namespace?: string; // ServiceAccount only
  };
}

export interface RbacOutput {
  yaml: string;
  warnings: string[];
}

export const VERB_OPTIONS = [
  "get", "list", "watch", "create", "update", "patch", "delete",
  "deletecollection", "impersonate",
] as const;

export const COMMON_RESOURCES = [
  "pods", "pods/log", "pods/exec", "deployments", "statefulsets",
  "daemonsets", "replicasets", "services", "endpoints", "configmaps",
  "secrets", "persistentvolumeclaims", "events", "namespaces", "nodes",
  "serviceaccounts", "jobs", "cronjobs", "ingresses",
] as const;

const apiGroupFor = (resource: string): string => {
  if (
    ["deployments", "statefulsets", "daemonsets", "replicasets"].includes(resource)
  ) return "apps";
  if (["jobs", "cronjobs"].includes(resource)) return "batch";
  if (resource === "ingresses") return "networking.k8s.io";
  return "";
};

export function suggestApiGroup(resource: string): string {
  return apiGroupFor(resource.split("/")[0]);
}

function yamlList(items: string[], indent: number): string {
  const pad = " ".repeat(indent);
  return items.map((v) => `${pad}- "${v.replace(/"/g, '\\"')}"`).join("\n");
}

export function buildRbac(input: RbacInput): RbacOutput {
  const warnings: string[] = [];
  const roleKind = input.scope === "cluster" ? "ClusterRole" : "Role";
  const bindingKind =
    input.scope === "cluster" ? "ClusterRoleBinding" : "RoleBinding";

  const validRules = input.rules.filter(
    (r) => r.resources.trim() !== "" && r.verbs.length > 0,
  );

  // Least-privilege checks
  const flat = (s: string) => s.replace(/\s/g, "");
  for (const r of validRules) {
    if (flat(r.resources).includes("*")) {
      warnings.push(
        "Wildcard resources (*) grant access to every resource in the API group — narrow the list unless you really mean everything.",
      );
    }
    if (r.verbs.includes("*")) {
      warnings.push(
        "Wildcard verbs (*) include delete and escalate permissions — list the verbs you actually need.",
      );
    }
    if (r.resources.includes("secrets")) {
      warnings.push(
        "Access to secrets exposes credentials/tokens — prefer a dedicated role limited to named secrets where possible.",
      );
    }
    if (
      ["create", "update", "patch", "delete", "*"].some((v) =>
        r.verbs.includes(v),
      ) &&
      input.scope === "cluster"
    ) {
      warnings.push(
        "Write verbs at cluster scope affect every namespace — double-check this needs ClusterRole, not a per-namespace Role.",
      );
    }
  }
  if (validRules.length === 0) {
    warnings.push("No complete rules — add at least one resource + verb pair.");
  }

  const parts: string[] = [];

  // Role/ClusterRole
  const roleLines = [
    "apiVersion: rbac.authorization.k8s.io/v1",
    `kind: ${roleKind}`,
    "metadata:",
    `  name: ${input.name || "my-role"}`,
  ];
  if (input.scope === "namespaced") {
    roleLines.push(`  namespace: ${input.namespace || "default"}`);
  }
  roleLines.push("rules:");
  if (validRules.length === 0) {
    roleLines.push("  # - apiGroups: [\"\"]", "  #   resources: [\"pods\"]", "  #   verbs: [\"get\", \"list\"]");
  }
  for (const r of validRules) {
    roleLines.push(
      `  - apiGroups: ["${r.apiGroup}"]`,
      "    resources:",
      yamlList(
        r.resources.split(",").map((s) => s.trim()).filter(Boolean),
        6,
      ),
      "    verbs:",
      yamlList(r.verbs, 6),
    );
  }
  parts.push(roleLines.join("\n"));

  // Binding
  if (input.bindTo.name.trim()) {
    const b = input.bindTo;
    const bindLines = [
      "apiVersion: rbac.authorization.k8s.io/v1",
      `kind: ${bindingKind}`,
      "metadata:",
      `  name: ${input.name || "my-role"}-binding`,
    ];
    if (input.scope === "namespaced") {
      bindLines.push(`  namespace: ${input.namespace || "default"}`);
    }
    bindLines.push(
      "subjects:",
      `  - kind: ${b.kind}`,
      `    name: ${b.name}`,
    );
    if (b.kind === "ServiceAccount") {
      bindLines.push(`    namespace: ${b.namespace || input.namespace || "default"}`);
    }
    bindLines.push(
      "roleRef:",
      `  kind: ${roleKind}`,
      `  name: ${input.name || "my-role"}`,
      "  apiGroup: rbac.authorization.k8s.io",
    );
    parts.push(bindLines.join("\n"));
  }

  return { yaml: parts.join("\n---\n") + "\n", warnings };
}
