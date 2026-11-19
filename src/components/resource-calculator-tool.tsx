"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  formatCpu,
  formatMemory,
  parseCpu,
  parseMemory,
  summarizeWorkload,
  type ContainerSpec,
} from "@/lib/resources";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function StatCell({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-lg",
          strong ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ResourceCalculatorTool() {
  const [containers, setContainers] = useState<ContainerSpec[]>([
    { name: "app", cpuRequest: "100m", cpuLimit: "500m", memoryRequest: "128Mi", memoryLimit: "512Mi" },
  ]);
  const [replicas, setReplicas] = useState(2);

  // Unit converter playground
  const [cpuInput, setCpuInput] = useState("250m");
  const [memInput, setMemInput] = useState("1Gi");

  useEffect(() => {
    trackEvent("tool_opened", { tool: "resource-calculator" });
  }, []);

  const summary = summarizeWorkload(containers, Math.max(1, replicas));
  const cpuParsed = parseCpu(cpuInput);
  const memParsed = parseMemory(memInput);

  const update = (i: number, patch: Partial<ContainerSpec>) =>
    setContainers((list) =>
      list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );

  return (
    <div className="space-y-8">
      {/* Containers table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Containers in the pod</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setContainers((l) => [
                ...l,
                { name: `container-${l.length + 1}`, cpuRequest: "100m", memoryRequest: "128Mi" },
              ])
            }
          >
            <Plus className="mr-1 size-3.5" /> Add container
          </Button>
        </div>

        <div className="space-y-3">
          {containers.map((c, i) => (
            <div
              key={i}
              className="grid items-end gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1.2fr_repeat(4,1fr)_auto]"
            >
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                <Input
                  value={c.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
              </div>
              {(
                [
                  ["cpuRequest", "CPU req"],
                  ["cpuLimit", "CPU limit"],
                  ["memoryRequest", "Mem req"],
                  ["memoryLimit", "Mem limit"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                  <Input
                    value={c[key] ?? ""}
                    onChange={(e) => update(i, { [key]: e.target.value })}
                    placeholder="—"
                    className="h-8 font-mono text-xs"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={containers.length === 1}
                onClick={() => setContainers((l) => l.filter((_, idx) => idx !== i))}
                aria-label="Remove container"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Replicas</label>
          <Input
            type="number"
            min={1}
            value={replicas}
            onChange={(e) => setReplicas(Number(e.target.value) || 1)}
            className="w-20 font-mono"
          />
          <span className="text-xs text-muted-foreground">
            init containers excluded — they don't run concurrently with app containers
          </span>
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="mb-3 text-sm font-medium">
          Workload totals ({replicas} replica{replicas === 1 ? "" : "s"})
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCell
            label="CPU requests (schedulable)"
            value={formatCpu(summary.totals.cpuRequest)}
            strong
          />
          <StatCell
            label="Memory requests (schedulable)"
            value={formatMemory(summary.totals.memoryRequest)}
            strong
          />
          <StatCell
            label="CPU limits"
            value={formatCpu(summary.totals.cpuLimit)}
          />
          <StatCell
            label="Memory limits"
            value={formatMemory(summary.totals.memoryLimit)}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Per replica: {formatCpu(summary.perReplica.cpuRequest)} CPU request,{" "}
          {formatMemory(summary.perReplica.memoryRequest)} memory request. The
          scheduler uses <em>requests</em> to place pods — a node must have that
          much unreserved capacity.
        </p>

        {summary.errors.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {summary.errors.map((e, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-sm text-red-200"
              >
                <XCircle className="mt-0.5 size-4 shrink-0" /> {e}
              </li>
            ))}
          </ul>
        )}
        {summary.warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {summary.warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-sm text-amber-200"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unit converter */}
      <div>
        <p className="mb-3 text-sm font-medium">Unit conversions</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              CPU quantity
            </label>
            <Input
              value={cpuInput}
              onChange={(e) => setCpuInput(e.target.value)}
              className="font-mono"
            />
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {cpuParsed.ok ? (
                <>
                  = <span className="text-foreground">{cpuParsed.value}m</span>
                  {" = "}
                  <span className="text-foreground">
                    {(cpuParsed.value! / 1000).toFixed(3)} cores
                  </span>
                </>
              ) : (
                <span className="text-red-300">{cpuParsed.error}</span>
              )}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              1 core = 1000m. Requests are scheduled; limits cap throttling.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Memory quantity
            </label>
            <Input
              value={memInput}
              onChange={(e) => setMemInput(e.target.value)}
              className="font-mono"
            />
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {memParsed.ok ? (
                <>
                  ={" "}
                  <span className="text-foreground">
                    {memParsed.value!.toLocaleString()} bytes
                  </span>{" "}
                  ({formatMemory(memParsed.value!)})
                </>
              ) : (
                <span className="text-red-300">{memParsed.error}</span>
              )}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Mi/Gi are binary (1Mi = 1,048,576); M/G are decimal (1M =
              1,000,000). Mixing them causes subtle sizing errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
