"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratorShell } from "@/components/generator-shell";
import {
  buildRbac,
  COMMON_RESOURCES,
  VERB_OPTIONS,
  type RbacInput,
} from "@/lib/rbac-generator";
import { trackEvent } from "@/lib/analytics";

const field =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring";

export function RbacGeneratorTool() {
  const [input, setInput] = useState<RbacInput>({
    name: "pod-reader",
    namespace: "default",
    scope: "namespaced",
    rules: [{ apiGroup: "", resources: "pods", verbs: ["get", "list"] }],
    bindTo: { kind: "ServiceAccount", name: "app-sa" },
  });

  useEffect(() => {
    trackEvent("tool_opened", { tool: "rbac-generator" });
  }, []);

  const out = buildRbac(input);
  const set = <K extends keyof RbacInput>(k: K, v: RbacInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const setRule = (i: number, patch: Partial<RbacInput["rules"][0]>) =>
    setInput((s) => ({
      ...s,
      rules: s.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    }));

  return (
    <GeneratorShell
      yaml={out.yaml}
      warnings={out.warnings}
      form={
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={input.name} onChange={(e) => set("name", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Scope</label>
              <select value={input.scope} onChange={(e) => set("scope", e.target.value as RbacInput["scope"])} className={field}>
                <option value="namespaced">Namespaced (Role)</option>
                <option value="cluster">Cluster-wide (ClusterRole)</option>
              </select>
            </div>
            {input.scope === "namespaced" && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Namespace</label>
                <Input value={input.namespace} onChange={(e) => set("namespace", e.target.value)} className="font-mono" />
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Rules</p>
              <Button variant="outline" size="sm" onClick={() => setInput((s) => ({ ...s, rules: [...s.rules, { apiGroup: "", resources: "", verbs: [] }] }))}>
                <Plus className="mr-1 size-3.5" /> Add rule
              </Button>
            </div>
            <div className="space-y-3">
              {input.rules.map((r, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
                    <Input value={r.apiGroup} onChange={(e) => setRule(i, { apiGroup: e.target.value })} placeholder='apiGroup ("" for core)' className="h-8 font-mono text-xs" />
                    <div>
                      <Input value={r.resources} onChange={(e) => setRule(i, { resources: e.target.value })} placeholder="pods, configmaps" list="rbac-resources" className="h-8 font-mono text-xs" />
                      <datalist id="rbac-resources">
                        {COMMON_RESOURCES.map((r2) => <option key={r2} value={r2} />)}
                      </datalist>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={input.rules.length === 1} onClick={() => setInput((s) => ({ ...s, rules: s.rules.filter((_, j) => j !== i) }))} aria-label="Remove rule">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {VERB_OPTIONS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setRule(i, {
                            verbs: r.verbs.includes(v)
                              ? r.verbs.filter((x) => x !== v)
                              : [...r.verbs, v],
                          })
                        }
                        className={`rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
                          r.verbs.includes(v)
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Bind to</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={input.bindTo.kind}
                onChange={(e) => set("bindTo", { ...input.bindTo, kind: e.target.value as RbacInput["bindTo"]["kind"] })}
                className={field}
              >
                <option value="ServiceAccount">ServiceAccount</option>
                <option value="User">User</option>
                <option value="Group">Group</option>
              </select>
              <Input
                value={input.bindTo.name}
                onChange={(e) => set("bindTo", { ...input.bindTo, name: e.target.value })}
                placeholder="subject name"
                className="font-mono"
              />
              {input.bindTo.kind === "ServiceAccount" && (
                <Input
                  value={input.bindTo.namespace ?? ""}
                  onChange={(e) => set("bindTo", { ...input.bindTo, namespace: e.target.value })}
                  placeholder="sa namespace"
                  className="font-mono"
                />
              )}
            </div>
          </div>
        </>
      }
    />
  );
}
