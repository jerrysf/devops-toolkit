import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Hammer } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { resources } from "@/data/resources";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resources — Runbooks, Checklists, Templates",
  description:
    "Downloadable DevOps resources: troubleshooting runbooks, production checklists, incident response templates. Free and premium.",
  alternates: { canonical: absoluteUrl("/resources") },
};

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ title: "Resources" }]} />
      <header className="mb-10 mt-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-3 text-muted-foreground">
          Downloadable runbooks, checklists, and templates. Free items
          download directly — no account required. Premium items show their
          contents before you buy anything.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {resources.map((r) => (
          <div
            key={r.slug}
            className="flex flex-col rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium">{r.title}</h2>
              <span
                className={
                  r.tier === "free"
                    ? "shrink-0 rounded-full border border-emerald-500/40 px-2.5 py-0.5 text-xs text-emerald-300"
                    : "shrink-0 rounded-full border border-primary/50 px-2.5 py-0.5 text-xs text-primary"
                }
              >
                {r.tier === "free" ? "Free" : (r.price ?? "Premium")}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
            <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
              {r.contents.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-primary">·</span> {c}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {r.status === "live" && r.cta === "download" && (
                <a
                  href={r.href}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
                >
                  <Download className="size-4" /> Download (markdown)
                </a>
              )}
              {r.status === "live" && r.cta === "page" && (
                <Link
                  href={r.href!}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  View product <ArrowRight className="size-4" />
                </Link>
              )}
              {r.status === "planned" && (
                <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">
                  <Hammer className="size-4" /> In development — contents shown
                  are the planned scope
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
