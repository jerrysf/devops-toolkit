/**
 * Kubernetes CronJob YAML generator.
 */

import { describeCron, parseCronExpression } from "@/lib/cron";

export interface CronJobInput {
  name: string;
  namespace: string;
  schedule: string;
  timeZone?: string;
  concurrencyPolicy: "Allow" | "Forbid" | "Replace";
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit: number;
  failedJobsHistoryLimit: number;
  image: string;
  command?: string;
  restartPolicy: "OnFailure" | "Never";
  suspend: boolean;
}

export interface CronJobOutput {
  yaml: string;
  warnings: string[];
  valid: boolean;
  scheduleDescription?: string;
}

export function buildCronJob(input: CronJobInput): CronJobOutput {
  const warnings: string[] = [];
  const cron = parseCronExpression(input.schedule);
  if (!cron.ok) {
    warnings.push(
      `Schedule "${input.schedule}" isn't a valid 5-field cron: ${cron.errors[0]?.message ?? "parse error"}`,
    );
  }
  if (input.concurrencyPolicy === "Allow") {
    warnings.push(
      "concurrencyPolicy: Allow means overlapping runs — make sure the job is idempotent and safe to run concurrently.",
    );
  }
  if (input.failedJobsHistoryLimit === 0 && input.successfulJobsHistoryLimit === 0) {
    warnings.push("Both history limits are 0 — you'll have no completed/failed Jobs left to debug.");
  }

  const cmd = input.command?.trim();
  const cmdLines = cmd
    ? cmd.split(/\s+/).map((c) => `              - ${JSON.stringify(c)}`)
    : ['              - "echo"', '              - "hello"'];

  const yaml = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${input.name || "example-cronjob"}
  namespace: ${input.namespace || "default"}
spec:
  schedule: "${input.schedule}"${input.timeZone ? `\n  timeZone: "${input.timeZone}"` : ""}
  concurrencyPolicy: ${input.concurrencyPolicy}${input.startingDeadlineSeconds ? `\n  startingDeadlineSeconds: ${input.startingDeadlineSeconds}` : ""}
  successfulJobsHistoryLimit: ${input.successfulJobsHistoryLimit}
  failedJobsHistoryLimit: ${input.failedJobsHistoryLimit}
  suspend: ${input.suspend}
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: ${input.name || "job"}
              image: ${input.image || "busybox:1.36"}
              command:
${cmdLines.join("\n")}
          restartPolicy: ${input.restartPolicy}
`;

  const scheduleDescription = cron.ok ? describeCron(cron.fields) : undefined;

  return { yaml, warnings, valid: cron.ok, scheduleDescription };
}
