import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CronGeneratorTool } from "@/components/cron-generator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cron Expression Generator — Free Online Tool",
  description:
    "Build and validate standard 5-field cron expressions with plain-English explanations, next run times, and common presets.",
  alternates: { canonical: absoluteUrl("/tools/cron-generator") },
};

export default function CronGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Tools", href: "/tools" },
          { title: "Cron Generator" },
        ]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cron Expression Generator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Write a standard five-field cron expression and see exactly what it
          means, when it runs next, and whether it's valid — before you paste
          it into a crontab or CronJob.
        </p>
      </header>

      <CronGeneratorTool />

      <div className="mt-10 max-w-3xl space-y-4">
        <Callout type="info" title="Standard cron vs. Kubernetes CronJob">
          <p>
            Kubernetes CronJobs use the same 5-field format shown here, and{" "}
            <code>.spec.schedule</code> accepts exactly this syntax. Two
            differences to know: a CronJob's schedule is interpreted in the{" "}
            <strong>kube-controller-manager's timezone</strong> (unless you set{" "}
            <code>.spec.timeZone</code>, available since Kubernetes 1.27), and
            CronJob supports the non-standard macros <code>@hourly</code>,{" "}
            <code>@daily</code>, <code>@weekly</code>, <code>@monthly</code>,{" "}
            <code>@yearly</code> which this tool doesn't generate.
          </p>
        </Callout>
        <Callout type="warning" title="Scheduler differences exist">
          This tool validates the standard Vixie/POSIX 5-field format used by
          most crontabs and Kubernetes. Other schedulers differ: systemd timers
          use their own syntax, AWS EventBridge uses 6-field expressions, and
          Quartz adds seconds and year fields. Always check your scheduler's
          documentation — a valid expression here may not be valid everywhere.
        </Callout>
      </div>
    </div>
  );
}
