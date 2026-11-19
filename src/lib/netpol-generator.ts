/**
 * NetworkPolicy generator — ingress/egress rules with selector
 * explanations.
 */

export interface NetpolPeer {
  type: "podSelector" | "namespaceSelector" | "namespaceAndPod" | "ipBlock";
  podLabels?: string; // "app=web" or "app=web,tier=front"
  nsLabels?: string;
  cidr?: string;
}

export interface NetpolPort {
  port: string; // number or name
  protocol: "TCP" | "UDP";
}

export interface NetpolInput {
  name: string;
  namespace: string;
  podSelector: string; // labels this policy applies to
  ingress: { peers: NetpolPeer[]; ports: NetpolPort[] }[];
  egress: { peers: NetpolPeer[]; ports: NetpolPort[] }[];
  allowDnsEgress: boolean;
}

export interface NetpolOutput {
  yaml: string;
  warnings: string[];
  explanations: string[];
}

/** Parse "k=v,k2=v2" label strings into YAML mapping lines. */
function labelsYaml(labels: string, indent: number): string[] {
  const pad = " ".repeat(indent);
  return labels
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq === -1) return `${pad}${pair}: ""`;
      return `${pad}${pair.slice(0, eq).trim()}: ${pair.slice(eq + 1).trim()}`;
    });
}

function peerYaml(peer: NetpolPeer): string[] {
  const lines: string[] = [];
  switch (peer.type) {
    case "podSelector":
      lines.push("      - podSelector:", "          matchLabels:");
      lines.push(...labelsYaml(peer.podLabels || "app=web", 12));
      break;
    case "namespaceSelector":
      lines.push("      - namespaceSelector:", "          matchLabels:");
      lines.push(...labelsYaml(peer.nsLabels || "kubernetes.io/metadata.name=prod", 12));
      break;
    case "namespaceAndPod":
      lines.push(
        "      - namespaceSelector:",
        "          matchLabels:",
        ...labelsYaml(peer.nsLabels || "kubernetes.io/metadata.name=prod", 12),
        "        podSelector:",
        "          matchLabels:",
        ...labelsYaml(peer.podLabels || "app=web", 12),
      );
      break;
    case "ipBlock":
      lines.push("      - ipBlock:", `          cidr: ${peer.cidr || "10.0.0.0/8"}`);
      break;
  }
  return lines;
}

function portYaml(ports: NetpolPort[]): string[] {
  return ports
    .filter((p) => p.port.trim() !== "")
    .map((p) =>
      `      - protocol: ${p.protocol}\n        port: ${/^\d+$/.test(p.port) ? p.port : `"${p.port}"`}`,
    );
}

export function buildNetpol(input: NetpolInput): NetpolOutput {
  const warnings: string[] = [];
  const explanations: string[] = [];

  const hasIngress = input.ingress.some((r) => r.peers.length > 0);
  const hasEgress =
    input.egress.some((r) => r.peers.length > 0) || input.allowDnsEgress;

  const policyTypes: string[] = [];
  if (hasIngress) policyTypes.push("Ingress");
  if (hasEgress) policyTypes.push("Egress");

  if (policyTypes.length === 0) {
    warnings.push(
      "No rules defined — this policy selects pods but allows nothing, which is rarely what you want. Add an ingress or egress rule.",
    );
  }
  if (hasEgress && !input.allowDnsEgress && !input.egress.some((r) =>
    r.ports.some((p) => p.port === "53"))) {
    warnings.push(
      "Egress rules without a DNS rule (port 53 to kube-dns) will break name resolution inside selected pods.",
    );
  }
  if (!hasIngress && hasEgress) {
    explanations.push(
      "This policy only restricts egress — inbound traffic to selected pods stays unrestricted.",
    );
  }

  explanations.push(
    `podSelector (${input.podSelector || "app=web"}) chooses which pods this policy applies to — empty selector {} would select ALL pods in the namespace.`,
    "Once a pod is selected by ANY NetworkPolicy, all non-listed traffic is denied (default-deny within the listed directions).",
    "CNI support required: NetworkPolicy is enforced by the cluster's CNI plugin (Calico, Cilium, …), not by Kubernetes itself.",
  );

  const lines = [
    "apiVersion: networking.k8s.io/v1",
    "kind: NetworkPolicy",
    "metadata:",
    `  name: ${input.name || "netpol"}`,
    `  namespace: ${input.namespace || "default"}`,
    "spec:",
    "  podSelector:",
    "    matchLabels:",
    ...labelsYaml(input.podSelector || "app=web", 6),
    `  policyTypes: [${policyTypes.map((t) => `"${t}"`).join(", ") || '"Ingress"'}]`,
  ];

  if (hasIngress) {
    lines.push("  ingress:");
    for (const rule of input.ingress.filter((r) => r.peers.length > 0)) {
      lines.push("    - from:");
      for (const peer of rule.peers) lines.push(...peerYaml(peer));
      const ports = portYaml(rule.ports);
      if (ports.length) {
        lines.push("      ports:", ...ports);
      }
    }
  }

  if (input.allowDnsEgress || input.egress.some((r) => r.peers.length > 0)) {
    lines.push("  egress:");
    if (input.allowDnsEgress) {
      lines.push(
        "    # Allow DNS to kube-system/kube-dns",
        "    - to:",
        "      - namespaceSelector:",
        "          matchLabels:",
        "            kubernetes.io/metadata.name: kube-system",
        "      ports:",
        "        - protocol: UDP",
        "          port: 53",
      );
    }
    for (const rule of input.egress.filter((r) => r.peers.length > 0)) {
      lines.push("    - to:");
      for (const peer of rule.peers) lines.push(...peerYaml(peer));
      const ports = portYaml(rule.ports);
      if (ports.length) lines.push("      ports:", ...ports);
    }
  }

  return { yaml: lines.join("\n") + "\n", warnings, explanations };
}
