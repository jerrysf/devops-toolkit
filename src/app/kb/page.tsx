import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { KbSearch } from "@/components/kb-search";
import { kbCategories, kbItemsFor } from "@/data/kb";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "DevOps and SRE knowledge base — Kubernetes troubleshooting guides, incident workflows, command references, and diagnostic tools.",
  alternates: { canonical: absoluteUrl("/kb") },
};

export default function KbIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ title: "Knowledge Base" }]} />
      <header className="mb-8 mt-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Knowledge Base
        </h1>
        <p className="mt-3 text-muted-foreground">
          Guides, references, and tools organized by discipline. Search across
          everything, or browse a category.
        </p>
      </header>

      <div className="mb-10">
        <KbSearch />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kbCategories.map((cat) => {
          const count = kbItemsFor(cat.slug).length;
          return (
            <Link
              key={cat.slug}
              href={`/kb/${cat.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <cat.icon className="size-5" />
              </span>
              <h2 className="mt-3 flex items-center gap-2 font-medium">
                {cat.title}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cat.description}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {count > 0 ? `${count} item${count === 1 ? "" : "s"}` : "in development"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
