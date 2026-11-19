import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { allSimScenarios } from "@/data/simulator";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kubernetes Troubleshooting Simulator",
  description:
    "Practice diagnosing Kubernetes incidents in a safe, browser-based simulator. Deterministic mock clusters — CrashLoopBackOff, ImagePullBackOff, Pod Pending, Node NotReady, DNS failures.",
  alternates: { canonical: absoluteUrl("/simulator") },
};

const difficultyStyle: Record<string, string> = {
  beginner: "border-emerald-500/40 text-emerald-300",
  intermediate: "border-amber-500/40 text-amber-300",
  advanced: "border-red-500/40 text-red-300",
};

export default function SimulatorIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ title: "Simulator" }]} />
      <header className="mb-8 mt-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Troubleshooting Simulator
        </h1>
        <p className="mt-3 text-muted-foreground">
          Practice real diagnostic workflows against deterministic mock
          clusters — the same kubectl commands, the same reasoning, zero risk.
          Read-only simulation: nothing executes against real infrastructure
          and no credentials are involved.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {allSimScenarios.map((s) => (
          <Link
            key={s.slug}
            href={`/simulator/${s.slug}`}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Terminal className="size-5" />
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs capitalize",
                  difficultyStyle[s.difficulty],
                )}
              >
                {s.difficulty}
              </span>
            </div>
            <h2 className="mt-4 flex items-center gap-2 font-medium">
              {s.title}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.brief}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
