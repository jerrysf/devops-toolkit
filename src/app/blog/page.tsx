import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { publishedArticles } from "@/data/articles";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog — Kubernetes & DevOps Guides",
  description:
    "Practical Kubernetes troubleshooting guides and DevOps engineering articles.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Technical deep-dives on running Kubernetes in production. New
          troubleshooting guides land here first — the library currently
          contains our launch guides, with more in progress.
        </p>
      </header>

      <div className="space-y-4">
        {publishedArticles.map((a) => (
          <Link
            key={a.slug}
            href={`/kubernetes/${a.slug}`}
            className="group block rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <h2 className="text-lg font-medium group-hover:text-primary">
              {a.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {a.readingTimeMinutes} min read · Reviewed {a.lastReviewed}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
