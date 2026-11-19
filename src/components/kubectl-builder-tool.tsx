"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { SafetyBadge } from "@/components/safety-badge";
import {
  buildKubectl,
  RESOURCE_TYPES,
  type BuilderInput,
  type ResourceType,
} from "@/lib/kubectl-builder";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ACTIONS: { value: BuilderInput["action"]; label: string; hint: string }[] = [
  { value: "get", label: "get", hint: "list resources" },
  { value: "describe", label: "describe", hint: "details + events" },
  { value: "logs", label: "logs", hint: "container output" },
  { value: "exec", label: "exec", hint: "run inside a container" },
  { value: "rollout-status", label: "rollout status", hint: "watch a deploy" },
  { value: "rollout-restart", label: "rollout restart", hint: "recreate pods" },
  { value: "rollout-history", label: "rollout history", hint: "list revisions" },
  { value: "rollout-undo", label: "rollout undo", hint: "revert revision" },
  { value: "events", label: "events", hint: "incident timeline" },
  { value: "top", label: "top", hint: "live usage" },
];

const ROLLOUT_ACTIONS = new Set([
  "rollout-status", "rollout-restart", "rollout-history", "rollout-undo",
]);
const ROLLOUT_KINDS = new Set(["deployments", "statefulsets", "daemonsets"]);

export function KubectlBuilderTool() {
  const [input, setInput] = useState<BuilderInput>({
    action: "get",
    resource: "pods",
    namespace: "example-ns",
  });

  useEffect(() => {
    trackEvent("tool_opened", { tool: "kubectl-builder" });
  }, []);

  const built = useMemo(() => buildKubectl(input), [input]);

  const set = <K extends keyof BuilderInput>(key: K, value: BuilderInput[K]) =>
    setInput((s) => ({ ...s, [key]: value }));

  const action = input.action;
  const showName = !["events"].includes(action);
  const showSelector = ["get", "describe"].includes(action);
  const showContainer = ["logs", "exec", "top"].includes(action);
  const showOutput = action === "get";
  const logFlags = action === "logs";
  const rolloutBad =
    ROLLOUT_ACTIONS.has(action) && !ROLLOUT_KINDS.has(input.resource);

  const field = "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-6">
      {/* Action picker */}
      <div>
        <p className="mb-2 text-sm font-medium">Action</p>
        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => set("action", a.value)}
              title={a.hint}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors",
                action === a.value
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Resource type
          </label>
          <select
            value={input.resource}
            onChange={(e) => set("resource", e.target.value as ResourceType)}
            className={field}
          >
            {RESOURCE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {showName && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name (optional)
            </label>
            <Input
              value={input.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="web-6c8f9bb-2xklp"
              className="font-mono"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Namespace
          </label>
          <div className="flex gap-2">
            <Input
              value={input.namespace ?? ""}
              onChange={(e) => set("namespace", e.target.value)}
              placeholder="default"
              disabled={input.allNamespaces}
              className="font-mono"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={input.allNamespaces ?? false}
                onChange={(e) => set("allNamespaces", e.target.checked)}
                className="size-3.5"
              />
              -A
            </label>
          </div>
        </div>
        {showSelector && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {action === "events" ? "Object name filter" : "Label selector -l"}
            </label>
            <Input
              value={input.selector ?? ""}
              onChange={(e) => set("selector", e.target.value)}
              placeholder={action === "events" ? "pod-name" : "app=web"}
              className="font-mono"
            />
          </div>
        )}
        {showContainer && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Container -c
            </label>
            <Input
              value={input.container ?? ""}
              onChange={(e) => set("container", e.target.value)}
              placeholder={action === "top" ? "per-container" : "web"}
              className="font-mono"
            />
          </div>
        )}
        {showOutput && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Output -o
            </label>
            <select
              value={input.output ?? ""}
              onChange={(e) =>
                set("output", (e.target.value || undefined) as BuilderInput["output"])
              }
              className={field}
            >
              <option value="">table (default)</option>
              <option value="wide">wide</option>
              <option value="yaml">yaml</option>
              <option value="json">json</option>
              <option value="jsonpath">jsonpath</option>
            </select>
          </div>
        )}
      </div>

      {/* Log flags */}
      {logFlags && (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            { key: "previous" as const, label: "--previous (last crash)" },
            { key: "follow" as const, label: "-f (stream)" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={Boolean(input[f.key])}
                onChange={(e) => set(f.key, e.target.checked)}
                className="size-3.5"
              />
              <span className="font-mono text-xs">{f.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs">--tail=</span>
            <Input
              type="number"
              min={0}
              value={input.tail ?? ""}
              onChange={(e) =>
                set("tail", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="100"
              className="h-7 w-20 font-mono text-xs"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs">--since=</span>
            <Input
              value={input.since ?? ""}
              onChange={(e) => set("since", e.target.value)}
              placeholder="30m"
              className="h-7 w-24 font-mono text-xs"
            />
          </label>
        </div>
      )}

      {action === "get" && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={input.watch ?? false}
            onChange={(e) => set("watch", e.target.checked)}
            className="size-3.5"
          />
          <span className="font-mono text-xs">-w (watch)</span>
        </label>
      )}

      {action === "exec" && (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Command to run inside the pod
            </label>
            <Input
              value={input.execCommand ?? ""}
              onChange={(e) => set("execCommand", e.target.value)}
              placeholder="sh"
              className="font-mono"
            />
          </div>
          <label className="flex items-end gap-2 pb-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={input.interactive ?? true}
              onChange={(e) => set("interactive", e.target.checked)}
              className="size-3.5"
            />
            <span className="font-mono text-xs">-it</span>
          </label>
        </div>
      )}

      {rolloutBad && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          kubectl rollout only works on deployments, statefulsets, and
          daemonsets — {input.resource} will error.
        </p>
      )}

      {/* Output */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Generated command</p>
          <SafetyBadge level={built.safety} />
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-[#0a1224] p-4">
          <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-slate-100">
            {built.command}
          </code>
          <CopyButton text={built.command} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{built.safetyNote}</p>

        <details className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            What each part does
          </summary>
          <ul className="mt-3 space-y-1.5">
            {built.parts.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <code className="shrink-0 font-mono text-primary">{p.text}</code>
                {p.explanation && (
                  <span className="text-muted-foreground">— {p.explanation}</span>
                )}
              </li>
            ))}
          </ul>
        </details>

        <p className="mt-3 text-xs text-muted-foreground">
          Generated commands are never executed — paste them into your own
          terminal after checking the context (
          <code className="font-mono">kubectl config current-context</code>).
        </p>
      </div>
    </div>
  );
}
