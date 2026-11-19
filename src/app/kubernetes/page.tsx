import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { kubernetesArticles, publishedArticles } from "@/data/articles";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kubernetes Troubleshooting Guides",
  description:
    "Structured troubleshooting guides for common Kubernetes failure modes: CrashLoopBackOff, ImagePullBackOff, NotReady nodes, and more.",
  alternates: { canonical: absoluteUrl("/kubernetes") },
  openGraph: {
    title: "Kubernetes Troubleshooting Guides",
    description:
      "Structured troubleshooting guides for common Kubernetes failure modes.",
  },
};

const referencePages = [
  {
    href: "/kubernetes/kubectl-commands",
    title: "kubectl Command Reference",
    description:
      "The diagnostic commands that matter, organized by what you're trying to learn — with what each flag does.",
  },
  {
    href: "/kubernetes/checklist",
    title: "Incident Response Checklist",
    description:
      "A printable pre-flight checklist for Kubernetes incidents: what to capture first, what to avoid, and how to verify a fix.",
  },
];

export default function KubernetesIndex() {
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kubernetes Troubleshooting Guides
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Practical, verified workflows for the failure modes that wake
          engineers up. Every guide follows the same structure: symptoms,
          likely causes, diagnostics, resolution, and prevention.
        </p>
      </header>

      <h2 className="mb-4 text-lg font-medium">Published guides</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {publishedArticles.map((a) => (
          <Link
            key={a.slug}
            href={`/kubernetes/${a.slug}`}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <h3 className="font-medium group-hover:text-primary">{a.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {a.readingTimeMinutes} min · Reviewed {a.lastReviewed}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-lg font-medium">In progress</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {kubernetesArticles
          .filter((a) => !a.published)
          .map((a) => (
            <div
              key={a.slug}
              className="rounded-xl border border-dashed border-border p-4 opacity-70"
            >
              <h3 className="text-sm font-medium">{a.shortTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.description}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Coming soon
              </p>
            </div>
          ))}
      </div>

      <h2 className="mb-4 mt-12 text-lg font-medium">Reference</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {referencePages.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div>
              <h3 className="font-medium group-hover:text-primary">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.description}
              </p>
            </div>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
