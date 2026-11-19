import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CronJobGeneratorTool } from "@/components/cronjob-generator-tool";
import { Callout } from "@/components/callout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes CronJob Generator — Free Online Tool",
  description:
    "Generate valid batch/v1 CronJob YAML — schedule, concurrency policy, deadlines, history limits, job template. Runs in your browser.",
  alternates: { canonical: absoluteUrl("/tools/cronjob-generator") },
};

export default function CronJobGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[{ title: "Tools", href: "/tools" }, { title: "CronJob Generator" }]}
      />
      <header className="mb-8 mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          CronJob Generator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build a complete batch/v1 CronJob manifest — schedule validation,
          concurrency policy, deadlines, and history limits explained.
        </p>
      </header>
      <CronJobGeneratorTool />
      <div className="mt-10 max-w-3xl">
        <Callout type="info" title="Standard cron vs Kubernetes CronJob">
          <p>
            The schedule syntax is the same 5-field format, but Kubernetes
            adds semantics: concurrencyPolicy controls overlap,
            startingDeadlineSeconds bounds lateness, and timeZone (K8s 1.27+)
            overrides the controller's timezone. A schedule valid in cron is
            valid here — the policies around it are not standard cron.
          </p>
        </Callout>
      </div>
    </div>
  );
}
