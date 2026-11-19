"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { GeneratorShell } from "@/components/generator-shell";
import {
  buildProbe,
  defaultProbeInput,
  type ProbeInput,
  type ProbeKind,
  type ProbeMechanism,
} from "@/lib/probe-generator";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring";

const KINDS: { value: ProbeKind; label: string; hint: string }[] = [
  { value: "liveness", label: "Liveness", hint: "restart on failure" },
  { value: "readiness", label: "Readiness", hint: "remove from endpoints" },
  { value: "startup", label: "Startup", hint: "grace for slow boots" },
];

export function ProbeGeneratorTool() {
  const [input, setInput] = useState<ProbeInput>(defaultProbeInput("liveness"));

  useEffect(() => {
    trackEvent("tool_opened", { tool: "probe-generator" });
  }, []);

  const out = buildProbe(input);
  const set = <K extends keyof ProbeInput>(k: K, v: ProbeInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const num = (v: string) => Number(v) || 0;

  return (
    <GeneratorShell
      yaml={out.yaml}
      warnings={out.warnings}
      explanations={out.explanations}
      form={
        <>
          <div>
            <p className="mb-2 text-sm font-medium">Probe type</p>
            <div className="flex gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  title={k.hint}
                  onClick={() => setInput(defaultProbeInput(k.value))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    input.kind === k.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Mechanism</p>
            <div className="flex flex-wrap gap-1.5">
              {(["httpGet", "tcpSocket", "exec", "grpc"] as ProbeMechanism[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("mechanism", m)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors",
                    input.mechanism === m
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {input.mechanism === "httpGet" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Path</label>
                <Input value={input.path ?? ""} onChange={(e) => set("path", e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Port</label>
                <Input type="number" value={input.port ?? 8080} onChange={(e) => set("port", num(e.target.value))} className="font-mono" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Scheme</label>
                <select value={input.scheme ?? "HTTP"} onChange={(e) => set("scheme", e.target.value as "HTTP" | "HTTPS")} className={field}>
                  <option value="HTTP">HTTP</option>
                  <option value="HTTPS">HTTPS</option>
                </select>
              </div>
            </div>
          )}
          {input.mechanism === "tcpSocket" && (
            <div className="max-w-32">
              <label className="mb-1 block text-xs text-muted-foreground">Port</label>
              <Input type="number" value={input.port ?? 8080} onChange={(e) => set("port", num(e.target.value))} className="font-mono" />
            </div>
          )}
          {input.mechanism === "exec" && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Command (space-separated)</label>
              <Input value={input.command ?? ""} onChange={(e) => set("command", e.target.value)} placeholder="cat /tmp/healthy" className="font-mono" />
            </div>
          )}
          {input.mechanism === "grpc" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">gRPC port</label>
                <Input type="number" value={input.grpcPort ?? 9000} onChange={(e) => set("grpcPort", num(e.target.value))} className="font-mono" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Service (optional)</label>
                <Input value={input.grpcService ?? ""} onChange={(e) => set("grpcService", e.target.value)} className="font-mono" />
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Timing</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["initialDelaySeconds", "Initial delay (s)"],
                  ["periodSeconds", "Period (s)"],
                  ["timeoutSeconds", "Timeout (s)"],
                  ["failureThreshold", "Failures before action"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    min={0}
                    value={input[key]}
                    onChange={(e) => set(key, num(e.target.value))}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      }
    />
  );
}
