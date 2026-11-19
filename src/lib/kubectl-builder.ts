/**
 * kubectl command builder — assembles commands from structured inputs
 * and explains every flag. Generates text only; it never executes.
 */

export type SafetyLevel = "readonly" | "modify" | "destructive";

export interface BuilderPart {
  text: string;
  explanation?: string;
}

export interface BuiltCommand {
  command: string;
  parts: BuilderPart[];
  safety: SafetyLevel;
  safetyNote: string;
}

const RESOURCE_TYPES = [
  "pods", "deployments", "services", "nodes", "namespaces", "secrets",
  "configmaps", "pvc", "pv", "ingress", "jobs", "cronjobs",
  "statefulsets", "daemonsets", "events", "serviceaccounts", "roles",
  "rolebindings", "clusterroles", "hpa",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
export { RESOURCE_TYPES };

export interface BuilderInput {
  action:
    | "get" | "describe" | "logs" | "exec"
    | "rollout-status" | "rollout-restart" | "rollout-history" | "rollout-undo"
    | "events" | "top";
  resource: ResourceType;
  name?: string;
  namespace?: string;
  allNamespaces?: boolean;
  selector?: string;   // -l
  container?: string;  // -c
  // action-specific options
  output?: "wide" | "yaml" | "json" | "jsonpath";
  watch?: boolean;
  previous?: boolean;
  follow?: boolean;
  tail?: number;
  since?: string;
  execCommand?: string;
  interactive?: boolean; // -it for exec
}

const ACTION_META: Record<
  BuilderInput["action"],
  { safety: SafetyLevel; note: string }
> = {
  get: { safety: "readonly", note: "Lists resources — safe to run anywhere." },
  describe: { safety: "readonly", note: "Prints resource details and events — safe." },
  logs: { safety: "readonly", note: "Reads container logs — safe." },
  exec: {
    safety: "modify",
    note: "Runs a process inside a live container. The kubectl command itself is read-only, but anything the command does inside affects the running workload.",
  },
  "rollout-status": { safety: "readonly", note: "Watches rollout progress — safe." },
  "rollout-restart": { safety: "modify", note: "Recreates pods through the controller — causes a rolling restart." },
  "rollout-history": { safety: "readonly", note: "Lists rollout revisions — safe." },
  "rollout-undo": { safety: "modify", note: "Reverts to a previous revision — changes running code." },
  events: { safety: "readonly", note: "Reads the event stream — safe." },
  top: { safety: "readonly", note: "Reads live metrics — safe (requires metrics-server)." },
};

const ROLLOUT_KINDS = new Set(["deployments", "statefulsets", "daemonsets"]);

export function buildKubectl(input: BuilderInput): BuiltCommand {
  const meta = ACTION_META[input.action];
  const parts: BuilderPart[] = [{ text: "kubectl", explanation: "Kubernetes CLI" }];

  const add = (text: string, explanation?: string) => parts.push({ text, explanation });
  const resource = input.resource;
  const name = input.name?.trim();
  const ns = input.namespace?.trim();

  const addNs = () => {
    if (input.allNamespaces) add("-A", "all namespaces");
    else if (ns) add(`-n ${ns}`, "target namespace");
  };

  switch (input.action) {
    case "get": {
      add("get", "list resources");
      add(name ? `${resource}/${name}` : resource, name ? "one specific resource" : "resource type");
      addNs();
      if (input.selector) add(`-l ${input.selector}`, "label selector filter");
      if (input.output === "jsonpath") add("-o jsonpath='{...}'", "extract specific fields");
      else if (input.output) add(`-o ${input.output}`, `output format: ${input.output}`);
      if (input.watch) add("-w", "watch for changes (Ctrl+C to stop)");
      break;
    }
    case "describe": {
      add("describe", "details + events for a resource");
      add(name ? `${resource}/${name}` : resource, name ? "one resource" : "all of this type");
      addNs();
      if (input.selector) add(`-l ${input.selector}`, "label selector filter");
      break;
    }
    case "logs": {
      add("logs", "container log output");
      add(name ? `${resource}/${name}` : resource, resource !== "pods" && !name ? "all pods of this workload" : "target");
      addNs();
      if (input.container) add(`-c ${input.container}`, "specific container in a multi-container pod");
      if (input.previous) add("--previous", "logs of the LAST crashed container — key for CrashLoopBackOff");
      if (input.tail !== undefined && input.tail > 0) add(`--tail=${input.tail}`, `last ${input.tail} lines`);
      if (input.since) add(`--since=${input.since}`, "time-bounded logs");
      if (input.follow) add("-f", "stream logs live (Ctrl+C to stop)");
      break;
    }
    case "exec": {
      add("exec", "run a command inside a container");
      if (name) add(name, "target pod");
      else add("<pod>", "target pod name required");
      addNs();
      if (input.container) add(`-c ${input.container}`, "specific container");
      if (input.interactive) add("-it", "interactive TTY — required for shells");
      add("--", "separates kubectl flags from the in-pod command");
      add(input.execCommand?.trim() || "<command>", "command run inside the container");
      break;
    }
    case "rollout-status":
    case "rollout-history":
    case "rollout-restart":
    case "rollout-undo": {
      const sub = input.action.replace("rollout-", "");
      if (!ROLLOUT_KINDS.has(resource)) {
        // kubectl itself errors; still generate but flag it in a part.
        add("rollout", "works on deployments, statefulsets, daemonsets");
      } else {
        add("rollout", "manage rollouts");
      }
      add(sub, {
        status: "watch rollout progress",
        restart: "recreate all pods (rolling)",
        history: "list revisions",
        undo: "revert to previous revision",
      }[sub]);
      add(name ? `${resource}/${name}` : resource, name ? "workload name" : "workload");
      addNs();
      break;
    }
    case "events": {
      add("get", "list events");
      add("events", "the event stream");
      addNs();
      if (input.selector) add(`--field-selector involvedObject.name=${input.selector}`, "events for one object");
      add("--sort-by=.lastTimestamp", "newest last — chronological view");
      break;
    }
    case "top": {
      add("top", "live resource usage (needs metrics-server)");
      add(resource === "pods" ? (name ? `pod ${name}` : "pods") : resource === "nodes" ? "nodes" : resource);
      addNs();
      if (input.container) add("--containers", "per-container breakdown");
      break;
    }
  }

  return {
    command: parts.map((p) => p.text).join(" "),
    parts,
    safety: meta.safety,
    safetyNote: meta.note,
  };
}
