"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { GeneratorShell } from "@/components/generator-shell";
import {
  buildCronJob,
  type CronJobInput,
} from "@/lib/cronjob-generator";
import { trackEvent } from "@/lib/analytics";

const field =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring";

export function CronJobGeneratorTool() {
  const [input, setInput] = useState<CronJobInput>({
    name: "nightly-backup",
    namespace: "default",
    schedule: "0 2 * * *",
    concurrencyPolicy: "Forbid",
    successfulJobsHistoryLimit: 3,
    failedJobsHistoryLimit: 1,
    image: "registry.example.com/backup:1.2.0",
    command: "/app/backup --full",
    restartPolicy: "OnFailure",
    suspend: false,
  });

  useEffect(() => {
    trackEvent("tool_opened", { tool: "cronjob-generator" });
  }, []);

  const out = buildCronJob(input);
  const set = <K extends keyof CronJobInput>(k: K, v: CronJobInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));
  const num = (v: string) => Number(v) || 0;

  return (
    <GeneratorShell
      yaml={out.yaml}
      warnings={out.warnings}
      explanations={[
        ...(out.scheduleDescription ? [`Schedule: ${out.scheduleDescription}`] : []),
        "Kubernetes CronJobs use the cluster's timezone unless spec.timeZone is set (supported since K8s 1.27).",
        "concurrencyPolicy: Forbid skips a run if the previous is still running; Replace kills the old one. Allow overlaps — only safe for idempotent jobs.",
      ]}
      form={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={input.name} onChange={(e) => set("name", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Namespace</label>
              <Input value={input.namespace} onChange={(e) => set("namespace", e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Schedule (cron)</label>
              <Input value={input.schedule} onChange={(e) => set("schedule", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Timezone (optional)</label>
              <Input value={input.timeZone ?? ""} onChange={(e) => set("timeZone", e.target.value || undefined)} placeholder="America/New_York" className="font-mono" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Concurrency</label>
              <select value={input.concurrencyPolicy} onChange={(e) => set("concurrencyPolicy", e.target.value as CronJobInput["concurrencyPolicy"])} className={field}>
                <option value="Allow">Allow</option>
                <option value="Forbid">Forbid</option>
                <option value="Replace">Replace</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Success history</label>
              <Input type="number" min={0} value={input.successfulJobsHistoryLimit} onChange={(e) => set("successfulJobsHistoryLimit", num(e.target.value))} className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Failed history</label>
              <Input type="number" min={0} value={input.failedJobsHistoryLimit} onChange={(e) => set("failedJobsHistoryLimit", num(e.target.value))} className="font-mono" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Start deadline (s, optional)</label>
              <Input type="number" min={0} value={input.startingDeadlineSeconds ?? ""} onChange={(e) => set("startingDeadlineSeconds", e.target.value ? num(e.target.value) : undefined)} placeholder="—" className="font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Restart policy</label>
              <select value={input.restartPolicy} onChange={(e) => set("restartPolicy", e.target.value as CronJobInput["restartPolicy"])} className={field}>
                <option value="OnFailure">OnFailure</option>
                <option value="Never">Never</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Image</label>
            <Input value={input.image} onChange={(e) => set("image", e.target.value)} className="font-mono" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Command (space-separated)</label>
            <Input value={input.command ?? ""} onChange={(e) => set("command", e.target.value)} className="font-mono" />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={input.suspend} onChange={(e) => set("suspend", e.target.checked)} className="size-3.5" />
            suspend: true — deploy paused (no new jobs scheduled)
          </label>
        </>
      }
    />
  );
}
