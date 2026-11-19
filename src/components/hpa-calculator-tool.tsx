"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { GeneratorShell } from "@/components/generator-shell";
import { calcHpa, type HpaInput } from "@/lib/hpa-calculator";
import { trackEvent } from "@/lib/analytics";

export function HpaCalculatorTool() {
  const [input, setInput] = useState<HpaInput>({
    targetUtilization: 70,
    cpuRequestM: 200,
    observedAvgM: 300,
    observedPeakM: 800,
    minReplicas: 2,
    maxReplicas: 10,
  });

  useEffect(() => {
    trackEvent("tool_opened", { tool: "hpa-calculator" });
  }, []);

  const out = calcHpa(input);
  const set = <K extends keyof HpaInput>(k: K, v: HpaInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));
  const num = (v: string) => Number(v) || 0;

  const fields: { key: keyof HpaInput; label: string; hint: string }[] = [
    { key: "targetUtilization", label: "Target CPU utilization (%)", hint: "averageUtilization" },
    { key: "cpuRequestM", label: "CPU request per pod (millicores)", hint: "e.g. 200 = 0.2 cores" },
    { key: "observedAvgM", label: "Observed avg usage (m)", hint: "from kubectl top / metrics" },
    { key: "observedPeakM", label: "Observed peak usage (m)", hint: "worst-case burst" },
    { key: "minReplicas", label: "minReplicas", hint: "floor" },
    { key: "maxReplicas", label: "maxReplicas", hint: "ceiling" },
  ];

  return (
    <GeneratorShell
      yaml={out.yaml}
      warnings={out.warnings}
      explanations={[
        `Current utilization vs request: ${out.currentUtilization ?? "—"}%`,
        `Estimated replicas at average load: ${out.desiredReplicasNow} · at peak: ${out.desiredReplicasPeak}`,
        ...out.explanations,
      ]}
      form={
        <>
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Enter your workload's CPU request and <em>observed</em> usage
            (from <code>kubectl top pod</code> or your metrics system). The
            HPA scales on utilization <em>relative to requests</em> — the
            math below models the formula, it doesn't size your app.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </label>
                <Input
                  type="number"
                  value={input[f.key]}
                  onChange={(e) => set(f.key, num(e.target.value))}
                  placeholder={f.hint}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </>
      }
    />
  );
}
