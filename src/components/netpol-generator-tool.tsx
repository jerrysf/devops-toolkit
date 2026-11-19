"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratorShell } from "@/components/generator-shell";
import {
  buildNetpol,
  type NetpolInput,
  type NetpolPeer,
} from "@/lib/netpol-generator";
import { trackEvent } from "@/lib/analytics";

function PeerEditor({
  peer,
  onChange,
  onRemove,
}: {
  peer: NetpolPeer;
  onChange: (p: NetpolPeer) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-muted/20 p-2">
      <select
        value={peer.type}
        onChange={(e) => onChange({ ...peer, type: e.target.value as NetpolPeer["type"] })}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value="podSelector">Pods (same ns)</option>
        <option value="namespaceSelector">Namespaces</option>
        <option value="namespaceAndPod">Ns + Pods</option>
        <option value="ipBlock">IP block</option>
      </select>
      {(peer.type === "podSelector" || peer.type === "namespaceAndPod") && (
        <Input value={peer.podLabels ?? ""} onChange={(e) => onChange({ ...peer, podLabels: e.target.value })} placeholder="pod labels app=x" className="h-7 w-44 font-mono text-xs" />
      )}
      {(peer.type === "namespaceSelector" || peer.type === "namespaceAndPod") && (
        <Input value={peer.nsLabels ?? ""} onChange={(e) => onChange({ ...peer, nsLabels: e.target.value })} placeholder="ns labels kubernetes.io/metadata.name=prod" className="h-7 w-64 font-mono text-xs" />
      )}
      {peer.type === "ipBlock" && (
        <Input value={peer.cidr ?? ""} onChange={(e) => onChange({ ...peer, cidr: e.target.value })} placeholder="10.0.0.0/8" className="h-7 w-36 font-mono text-xs" />
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} aria-label="Remove peer">
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

export function NetpolGeneratorTool() {
  const [input, setInput] = useState<NetpolInput>({
    name: "web-netpol",
    namespace: "default",
    podSelector: "app=web",
    ingress: [
      {
        peers: [{ type: "podSelector", podLabels: "app=api" }],
        ports: [{ port: "8080", protocol: "TCP" }],
      },
    ],
    egress: [],
    allowDnsEgress: true,
  });

  useEffect(() => {
    trackEvent("tool_opened", { tool: "netpol-generator" });
  }, []);

  const out = buildNetpol(input);
  const set = <K extends keyof NetpolInput>(k: K, v: NetpolInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const ruleEditor = (key: "ingress" | "egress", label: string) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            set(key, [
              ...input[key],
              { peers: [{ type: "podSelector" as const, podLabels: "app=x" }], ports: [] },
            ])
          }
        >
          <Plus className="mr-1 size-3.5" /> Add rule
        </Button>
      </div>
      <div className="space-y-3">
        {input[key].map((rule, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Rule {i + 1} — {key === "ingress" ? "from" : "to"}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => set(key, input[key].filter((_, j) => j !== i))} aria-label="Remove rule">
                <Trash2 className="size-3" />
              </Button>
            </div>
            {rule.peers.map((peer, j) => (
              <PeerEditor
                key={j}
                peer={peer}
                onChange={(p) =>
                  set(key, input[key].map((r, ri) => ri === i ? { ...r, peers: r.peers.map((x, pj) => pj === j ? p : x) } : r))
                }
                onRemove={() =>
                  set(key, input[key].map((r, ri) => ri === i ? { ...r, peers: r.peers.filter((_, pj) => pj !== j) } : r))
                }
              />
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => set(key, input[key].map((r, ri) => ri === i ? { ...r, peers: [...r.peers, { type: "podSelector", podLabels: "app=x" }] } : r))}>
              + peer
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ports:</span>
              <Input
                value={rule.ports.map((p) => p.port).join(",")}
                onChange={(e) =>
                  set(key, input[key].map((r, ri) => ri === i ? { ...r, ports: e.target.value.split(",").map((p) => ({ port: p.trim(), protocol: "TCP" as const })).filter((p) => p.port) } : r))
                }
                placeholder="8080, 443"
                className="h-7 w-40 font-mono text-xs"
              />
              <span className="text-xs text-muted-foreground">TCP</span>
            </div>
          </div>
        ))}
        {input[key].length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            No {label} rules — traffic {key === "ingress" ? "into" : "out of"} selected pods is unrestricted in this direction unless another policy selects them.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <GeneratorShell
      yaml={out.yaml}
      warnings={out.warnings}
      explanations={out.explanations}
      form={
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={input.name} onChange={(e) => set("name", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Namespace</label>
              <Input value={input.namespace} onChange={(e) => set("namespace", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Applies to pods</label>
              <Input value={input.podSelector} onChange={(e) => set("podSelector", e.target.value)} placeholder="app=web" className="font-mono" />
            </div>
          </div>
          {ruleEditor("ingress", "Ingress rules (who can reach these pods)")}
          {ruleEditor("egress", "Egress rules (what these pods can reach)")}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={input.allowDnsEgress} onChange={(e) => set("allowDnsEgress", e.target.checked)} className="size-3.5" />
            Allow DNS egress (UDP/TCP 53 to kube-system) — almost always needed
          </label>
        </>
      }
    />
  );
}
