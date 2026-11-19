/**
 * Educational Kubernetes troubleshooting simulator.
 *
 * Parses a controlled subset of kubectl and executes it against a
 * deterministic mock cluster. No real cluster, no exec, no writes —
 * modifying commands are rejected with an explanation.
 */

// ── Mock cluster types ───────────────────────────────────────────────

export interface SimContainerState {
  name: string;
  image: string;
  ready: boolean;
  state: string; // Running / Waiting (CrashLoopBackOff) / Terminated ...
  reason?: string;
  exitCode?: number;
  restartCount: number;
}

export interface SimPod {
  name: string;
  namespace: string;
  node?: string;
  status: string; // Running / Pending / CrashLoopBackOff / ImagePullBackOff ...
  ready: string; // "0/1"
  restarts: number;
  age: string;
  ip?: string;
  labels: Record<string, string>;
  containers: SimContainerState[];
  logs: { current: string; previous?: string };
  conditions?: string[];
  spec?: Record<string, string>; // key facts shown in describe (image, requests…)
  events: string[]; // raw "Type Reason Message" lines
}

export interface SimNode {
  name: string;
  status: string; // Ready / NotReady
  roles: string;
  age: string;
  version: string;
  conditions: string[];
  events: string[];
  allocatable?: string;
  taints?: string[];
}

export interface SimDeploy {
  name: string;
  namespace: string;
  ready: string; // "0/3"
  upToDate: number;
  available: number;
  age: string;
  images: string;
  events: string[];
}

export interface SimService {
  name: string;
  namespace: string;
  type: string;
  clusterIp: string;
  ports: string;
  endpoints: string[]; // empty = no endpoints
}

export interface SimGeneric {
  kind: string; // resource plural, e.g. "secrets", "configmaps", "pvc"
  singular: string;
  items: { name: string; namespace: string; columns: [string, string][] }[];
  header: [string, ...string[]]; // e.g. ["NAME","TYPE","DATA","AGE"]
  describe?: Record<string, string>;
}

export interface SimCluster {
  context: string;
  nodes: SimNode[];
  pods: SimPod[];
  deployments: SimDeploy[];
  services: SimService[];
  generic: SimGeneric[];
  events: { namespace: string; lines: string[] };
}

export interface DiagnosisOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface SimScenario {
  slug: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  brief: string; // what the user is told
  welcome: string[]; // terminal lines printed on start
  cluster: SimCluster;
  hints: string[];
  diagnosis: DiagnosisOption[];
  walkthrough: { command: string; why: string }[];
}

// ── Command parsing ──────────────────────────────────────────────────

export interface ParsedCommand {
  kind:
    | "help" | "hint" | "clear" | "exit"
    | "get" | "describe" | "logs" | "top" | "context"
    | "unsupported-write" | "unsupported" | "empty" | "error";
  resource?: string;
  name?: string;
  namespace?: string;
  allNamespaces?: boolean;
  container?: string;
  output?: string;
  previous?: boolean;
  tail?: number;
  selector?: string;
  error?: string;
  raw: string;
}

const WRITE_VERBS = new Set([
  "apply", "create", "delete", "edit", "patch", "replace", "scale",
  "drain", "cordon", "uncordon", "taint", "label", "annotate", "rollout",
]);

const KNOWN_VERBS = new Set(["get", "describe", "logs", "top", "exec", "port-forward", "cp", "config", "version", "api-resources", "cluster-info", ...WRITE_VERBS]);

/** Minimal shell-ish tokenizer: splits on unquoted whitespace, strips
 * quote chars, and concatenates embedded quoted segments the way a shell
 * does (jsonpath='{...}' → jsonpath={...}). */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  let has = false;
  for (const ch of input) {
    if (inSingle) {
      if (ch === "'") inSingle = false;
      else cur += ch;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      else cur += ch;
      continue;
    }
    if (ch === "'") { inSingle = true; has = true; continue; }
    if (ch === '"') { inDouble = true; has = true; continue; }
    if (/\s/.test(ch)) {
      if (cur !== "" || has) { tokens.push(cur); cur = ""; has = false; }
      continue;
    }
    cur += ch;
    has = true;
  }
  if (cur !== "" || has) tokens.push(cur);
  return tokens;
}

export function parseCommand(raw: string): ParsedCommand {
  const input = raw.trim();
  if (input === "") return { kind: "empty", raw };
  const tokens = tokenize(input);
  const cmd = tokens[0];

  if (cmd === "help") return { kind: "help", raw };
  if (cmd === "hint") return { kind: "hint", raw };
  if (cmd === "clear") return { kind: "clear", raw };
  if (cmd === "exit" || cmd === "quit") return { kind: "exit", raw };

  if (cmd !== "kubectl") {
    if (cmd === "k") {
      // common alias — accept it
      tokens[0] = "kubectl";
    } else {
      return {
        kind: "error",
        error: `command not found: ${cmd} — this terminal only supports a subset of kubectl (try 'help')`,
        raw,
      };
    }
  }

  const verb = tokens[1];
  if (!verb) {
    return {
      kind: "error",
      error: "kubectl controls the Kubernetes cluster manager.\nTry 'kubectl get pods' or 'help' for supported commands.",
      raw,
    };
  }
  if (!KNOWN_VERBS.has(verb)) {
    return {
      kind: "error",
      error: `Error: unknown command "${verb}" for "kubectl"`,
      raw,
    };
  }
  if (WRITE_VERBS.has(verb)) {
    return { kind: "unsupported-write", raw, resource: tokens[2] };
  }
  if (verb === "config" && tokens[2] === "current-context") {
    return { kind: "context", raw };
  }
  if (verb === "version") {
    return { kind: "context", raw };
  }
  if (verb === "exec" || verb === "port-forward" || verb === "cp") {
    return {
      kind: "unsupported",
      error: `'kubectl ${verb}' isn't supported in this simulation — there's no real cluster to connect to. Try logs, describe, get, top, or events.`,
      raw,
    };
  }
  if (verb === "api-resources" || verb === "cluster-info") {
    return { kind: "unsupported", error: `'kubectl ${verb}' isn't needed here — this simulation has one cluster with a fixed resource set.`, raw };
  }

  // get / describe / logs / top — parse positional + flags
  const out: ParsedCommand = {
    kind: verb as "get" | "describe" | "logs" | "top",
    raw,
  };
  const positionals: string[] = [];
  for (let i = 2; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "-n" || t === "--namespace") {
      out.namespace = tokens[++i];
    } else if (t.startsWith("--namespace=")) {
      out.namespace = t.slice(12);
    } else if (t === "-A" || t === "--all-namespaces") {
      out.allNamespaces = true;
    } else if (t === "-c" || t === "--container") {
      out.container = tokens[++i];
    } else if (t === "-o" || t === "--output") {
      out.output = tokens[++i];
    } else if (t.startsWith("-o")) {
      out.output = t.slice(2) || tokens[++i];
    } else if (t === "--previous" || t === "-p") {
      out.previous = true;
    } else if (t === "--tail" || t === "--tail-lines") {
      out.tail = Number(tokens[++i]);
    } else if (t.startsWith("--tail=")) {
      out.tail = Number(t.slice(7));
    } else if (t === "-l" || t === "--selector") {
      out.selector = tokens[++i];
    } else if (t === "-f" || t === "--follow" || t === "-w" || t === "--watch") {
      return { kind: "unsupported", error: `the '${t}' flag streams forever in a real terminal — not supported in the simulator`, raw };
    } else if (t.startsWith("-")) {
      return { kind: "error", error: `unknown flag: ${t}`, raw };
    } else {
      positionals.push(t);
    }
  }

  // Split "pods/web-123" into resource+name.
  if (positionals[0]) {
    if (positionals[0].includes("/")) {
      const [res, name] = positionals[0].split("/", 2);
      out.resource = res;
      out.name = name;
    } else {
      out.resource = positionals[0];
      out.name = positionals[1];
    }
  }
  if (out.namespace === undefined) out.namespace = "default";
  return out;
}

// ── Aliases ──────────────────────────────────────────────────────────

const RESOURCE_ALIASES: Record<string, string> = {
  pod: "pods", po: "pods",
  deployment: "deployments", deploy: "deployments",
  service: "services", svc: "services",
  node: "nodes", no: "nodes",
  event: "events", ev: "events",
  namespace: "namespaces", ns: "namespaces",
  secret: "secrets",
  configmap: "configmaps", cm: "configmaps",
  pvc: "persistentvolumeclaims", persistentvolumeclaim: "persistentvolumeclaims",
  all: "all",
};

function canon(res: string | undefined): string | undefined {
  if (!res) return res;
  return RESOURCE_ALIASES[res] ?? res;
}

// ── Output rendering ─────────────────────────────────────────────────

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str + "  " : str + " ".repeat(w - str.length + 2);
}

function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const fmt = (cells: string[]) =>
    cells.map((c, i) => pad(c, widths[i])).join("").trimEnd();
  return [fmt(header), ...rows.map(fmt)].join("\n");
}

// ── Executor ─────────────────────────────────────────────────────────

export function execute(parsed: ParsedCommand, cluster: SimCluster): string {
  switch (parsed.kind) {
    case "empty":
      return "";
    case "error":
      return parsed.error!;
    case "context":
      return parsed.raw.includes("version")
        ? "Client Version: v1.31.0 (simulated)\nServer Version: v1.31.0 (simulated)"
        : cluster.context;
    case "unsupported":
      return parsed.error!;
    case "unsupported-write":
      return `This simulation is read-only — 'kubectl ${parsed.raw.trim().split(/\s+/)[1]}' would change real cluster state, and there's no real cluster here.\nDiagnosis only: use get, describe, logs, top, and events to find the root cause, then submit your diagnosis.`;
    case "help":
      return HELP;
    case "hint":
      return "__HINT__";
    case "clear":
      return "__CLEAR__";
    case "exit":
      return "__EXIT__";
    case "top":
      return simTop(parsed, cluster);
    case "get":
      return simGet(parsed, cluster);
    case "describe":
      return simDescribe(parsed, cluster);
    case "logs":
      return simLogs(parsed, cluster);
  }
}

const HELP = `Supported commands (educational simulation — not a real cluster):

  kubectl get <resource> [name] [-n ns] [-A] [-o wide|yaml] [-l sel]
      resources: pods, nodes, deployments, services, events, all, and
      scenario-specific resources (secrets, configmaps, pvc...)
  kubectl describe <resource> <name> [-n ns]
  kubectl logs <pod> [-n ns] [-c container] [--previous] [--tail=N]
  kubectl top pod|node
  kubectl config current-context

  hint     — get a nudge (costs score)
  clear    — clear the terminal
  exit     — back to scenario list

Modifying commands (apply/delete/edit/scale/exec...) are rejected —
this is diagnosis practice, not a live cluster.`;

function simGet(p: ParsedCommand, c: SimCluster): string {
  const res = canon(p.resource);
  if (!res) return "error: you must specify a resource type, e.g. 'kubectl get pods'";

  switch (res) {
    case "pods":
      return getPods(p, c);
    case "nodes":
      return getNodes(p, c);
    case "deployments":
      return getDeployments(p, c);
    case "services":
      return getServices(p, c);
    case "events":
      return getEvents(p, c);
    case "namespaces":
      return table(
        ["NAME", "STATUS", "AGE"],
        [["default", "Active", "47d"], ["kube-system", "Active", "47d"]],
      );
    case "all":
      return [
        getDeployments(p, c),
        "",
        getPods(p, c),
        "",
        getServices(p, c),
      ].join("\n");
    default: {
      const gen = c.generic.find((g) => g.kind === res || g.singular === res);
      if (!gen) return `error: the server doesn't have a resource type "${res}"`;
      const items = p.allNamespaces ? gen.items : gen.items.filter((i) => i.namespace === p.namespace);
      const named = p.name ? items.filter((i) => i.name === p.name) : items;
      if (named.length === 0) {
        return `No resources found in ${p.namespace} namespace.`;
      }
      const cols = gen.header;
      const rows = named.map((i) => [i.name, ...i.columns.map((x) => x[1])]);
      const hdr = [...cols];
      return table(hdr, rows);
    }
  }
}

function podRow(p: SimPod, wide: boolean): string[] {
  const base = [p.name, p.ready, p.status, String(p.restarts), p.age];
  if (wide) base.push(p.ip ?? "<none>", p.node ?? "<none>");
  return base;
}

function getPods(p: ParsedCommand, c: SimCluster): string {
  let pods = p.allNamespaces ? c.pods : c.pods.filter((x) => x.namespace === p.namespace);
  if (p.name) pods = pods.filter((x) => x.name === p.name);
  if (p.selector) {
    const [k, v] = p.selector.split("=");
    pods = pods.filter((x) => x.labels[k] === v);
  }
  const wide = p.output === "wide";

  if (p.output === "yaml") {
    if (!p.name || pods.length === 0) {
      return p.name
        ? `Error from server (NotFound): pods "${p.name}" not found`
        : "# (simplified YAML output — full manifests only in real kubectl)";
    }
    return podYaml(pods[0]);
  }

  if (pods.length === 0) {
    if (p.name) return `Error from server (NotFound): pods "${p.name}" not found`;
    return `No resources found in ${p.namespace} namespace.`;
  }
  const header = ["NAME", "READY", "STATUS", "RESTARTS", "AGE"];
  if (wide) header.push("IP", "NODE");
  return table(header, pods.map((x) => podRow(x, wide)));
}

function podYaml(p: SimPod): string {
  const lines = [
    "apiVersion: v1",
    "kind: Pod",
    "metadata:",
    `  name: ${p.name}`,
    `  namespace: ${p.namespace}`,
    "  labels:",
    ...Object.entries(p.labels).map(([k, v]) => `    ${k}: ${v}`),
    "spec:",
    "  containers:",
    ...p.containers.flatMap((c) => [
      `    - name: ${c.name}`,
      `      image: ${c.image}`,
    ]),
    "status:",
    `  phase: ${p.status === "Running" ? "Running" : p.status}`,
    "  containerStatuses:",
    ...p.containers.flatMap((c) => [
      `    - name: ${c.name}`,
      `      ready: ${c.ready}`,
      `      restartCount: ${c.restartCount}`,
      `      state: ${c.state}${c.reason ? ` (${c.reason})` : ""}${c.exitCode !== undefined ? `, exitCode: ${c.exitCode}` : ""}`,
    ]),
  ];
  return lines.join("\n");
}

function getNodes(p: ParsedCommand, c: SimCluster): string {
  const nodes = p.name ? c.nodes.filter((n) => n.name === p.name) : c.nodes;
  if (nodes.length === 0) {
    return `Error from server (NotFound): nodes "${p.name}" not found`;
  }
  return table(
    ["NAME", "STATUS", "ROLES", "AGE", "VERSION"],
    nodes.map((n) => [n.name, n.status, n.roles, n.age, n.version]),
  );
}

function getDeployments(p: ParsedCommand, c: SimCluster): string {
  let ds = p.allNamespaces ? c.deployments : c.deployments.filter((d) => d.namespace === p.namespace);
  if (p.name) ds = ds.filter((d) => d.name === p.name);
  if (ds.length === 0) {
    return p.name
      ? `Error from server (NotFound): deployments "${p.name}" not found`
      : `No resources found in ${p.namespace} namespace.`;
  }
  return table(
    ["NAME", "READY", "UP-TO-DATE", "AVAILABLE", "AGE"],
    ds.map((d) => [d.name, d.ready, String(d.upToDate), String(d.available), d.age]),
  );
}

function getServices(p: ParsedCommand, c: SimCluster): string {
  let svcs = p.allNamespaces ? c.services : c.services.filter((s) => s.namespace === p.namespace);
  if (p.name) svcs = svcs.filter((s) => s.name === p.name);
  if (svcs.length === 0) return `No resources found in ${p.namespace} namespace.`;
  return table(
    ["NAME", "TYPE", "CLUSTER-IP", "PORT(S)", "AGE"],
    svcs.map((s) => [s.name, s.type, s.clusterIp, s.ports, "47d"]),
  );
}

function getEvents(p: ParsedCommand, c: SimCluster): string {
  const ns = p.allNamespaces ? undefined : p.namespace;
  if (ns && c.events.namespace !== ns) {
    return `No events found in ${p.namespace} namespace.`;
  }
  return c.events.lines.join("\n");
}

function simDescribe(p: ParsedCommand, c: SimCluster): string {
  const res = canon(p.resource);
  if (!res) return "error: you must specify a resource type";
  if (!p.name && res !== "nodes") {
    return `error: name is required — 'kubectl describe ${res} <name>'`;
  }
  switch (res) {
    case "pods": {
      const pod = c.pods.find((x) => x.name === p.name && (p.allNamespaces || x.namespace === p.namespace));
      if (!pod) return `Error from server (NotFound): pods "${p.name}" not found`;
      return describePod(pod);
    }
    case "nodes": {
      const node = p.name ? c.nodes.find((n) => n.name === p.name) : c.nodes[0];
      if (!node) return `Error from server (NotFound): nodes "${p.name}" not found`;
      return describeNode(node);
    }
    case "deployments": {
      const d = c.deployments.find((x) => x.name === p.name && x.namespace === p.namespace);
      if (!d) return `Error from server (NotFound): deployments "${p.name}" not found`;
      return describeDeployment(d);
    }
    case "services": {
      const s = c.services.find((x) => x.name === p.name && x.namespace === p.namespace);
      if (!s) return `Error from server (NotFound): services "${p.name}" not found`;
      return [
        `Name:              ${s.name}`,
        `Namespace:         ${s.namespace}`,
        `Type:              ${s.type}`,
        `ClusterIP:         ${s.clusterIp}`,
        `Port:              ${s.ports}`,
        `Endpoints:         ${s.endpoints.length ? s.endpoints.join(",") : "<none>"}`,
        "Events:            <none>",
      ].join("\n");
    }
    default: {
      const gen = c.generic.find((g) => g.kind === res || g.singular === res);
      if (gen) {
        const item = gen.items.find((i) => i.name === p.name);
        if (!item) return `Error from server (NotFound): ${gen.kind} "${p.name}" not found`;
        return gen.describe?.[item.name] ?? `Name: ${item.name}\nNamespace: ${item.namespace}\n${item.columns.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
      }
      return `error: the server doesn't have a resource type "${res}"`;
    }
  }
}

function describePod(p: SimPod): string {
  const lines = [
    `Name:             ${p.name}`,
    `Namespace:        ${p.namespace}`,
    `Node:             ${p.node ?? "<none>"}`,
    `Status:           ${p.status}`,
    `IP:               ${p.ip ?? "<none>"}`,
    `Labels:           ${Object.entries(p.labels).map(([k, v]) => `${k}=${v}`).join(",")}`,
    "Containers:",
    ...p.containers.flatMap((c) => [
      `  ${c.name}:`,
      `    Image:        ${c.image}`,
      `    Ready:        ${c.ready}`,
      `    State:        ${c.state}${c.reason ? ` (${c.reason})` : ""}`,
      `    Restart Count: ${c.restartCount}`,
      ...(c.exitCode !== undefined ? [`    Last Exit Code: ${c.exitCode}`] : []),
    ]),
  ];
  if (p.spec && Object.keys(p.spec).length) {
    lines.push("", "Spec details:");
    for (const [k, v] of Object.entries(p.spec)) lines.push(`  ${k}: ${v}`);
  }
  if (p.conditions?.length) {
    lines.push("", "Conditions:", ...p.conditions.map((c) => `  ${c}`));
  }
  if (p.events.length) {
    lines.push("", "Events:", ...p.events.map((e) => `  ${e}`));
  }
  return lines.join("\n");
}

function describeNode(n: SimNode): string {
  return [
    `Name:               ${n.name}`,
    `Roles:              ${n.roles}`,
    `Version:            ${n.version}`,
    "",
    "Conditions:",
    ...n.conditions.map((c) => `  ${c}`),
    ...(n.allocatable ? ["", "Allocatable:", `  ${n.allocatable}`] : []),
    ...(n.taints?.length ? ["", "Taints:", ...n.taints.map((t) => `  ${t}`)] : []),
    "",
    "Events:",
    ...(n.events.length ? n.events.map((e) => `  ${e}`) : ["  <none>"]),
  ].join("\n");
}

function describeDeployment(d: SimDeploy): string {
  return [
    `Name:               ${d.name}`,
    `Namespace:          ${d.namespace}`,
    `Replicas:           ${d.ready}`,
    `Available:          ${d.available}`,
    `Pod Images:         ${d.images}`,
    "",
    "Events:",
    ...(d.events.length ? d.events.map((e) => `  ${e}`) : ["  <none>"]),
  ].join("\n");
}

function simLogs(p: ParsedCommand, c: SimCluster): string {
  // `logs <name>` → p.resource holds the pod name; `logs pods/<name>` and
  // `logs pod <name>` → p.name holds it.
  const name = p.name ?? (canon(p.resource) === "pods" ? undefined : p.resource);

  const pod = c.pods.find((x) => x.name === name && (p.allNamespaces || x.namespace === p.namespace));
  if (!pod) {
    return name
      ? `Error from server (NotFound): pods "${name}" not found`
      : "error: expected 'logs POD_NAME' or 'logs TYPE/NAME'";
  }
  if (p.container && !pod.containers.some((ct) => ct.name === p.container)) {
    return `Error from server (BadRequest): container ${p.container} is not valid for pod ${pod.name}`;
  }
  let log = p.previous ? pod.logs.previous : pod.logs.current;
  if (p.previous && log === undefined) {
    return `Error from server (BadRequest): previous terminated container "${pod.containers[0].name}" in pod "${pod.name}" not found`;
  }
  log ??= "";
  if (p.tail !== undefined && !Number.isNaN(p.tail)) {
    const lines = log.split("\n");
    log = lines.slice(-Math.max(0, p.tail)).join("\n");
  }
  return log || "(no log output)";
}

function simTop(p: ParsedCommand, c: SimCluster): string {
  const res = canon(p.resource);
  if (res === "nodes") {
    return table(
      ["NAME", "CPU(cores)", "CPU%", "MEMORY(bytes)", "MEMORY%"],
      c.nodes.map((n) => {
        const busy = n.status === "Ready" ? "38" : "0";
        return [n.name, "380m", busy, "2145Mi", n.status === "Ready" ? "54" : "0"];
      }),
    );
  }
  // pods
  const pods = c.pods.filter((x) => x.status === "Running" && (p.allNamespaces || x.namespace === p.namespace));
  if (pods.length === 0) return "No resources found — only Running pods report metrics.";
  return table(
    ["NAME", "CPU(cores)", "MEMORY(bytes)"],
    pods.map((x) => [x.name, "12m", "84Mi"]),
  );
}
