import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Monitor } from "lucide-react";
import { tools } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free DevOps Tools",
  description:
    "Free browser-based tools for DevOps engineers: YAML validator, cron expression generator, and more. No signup, no upload.",
  alternates: { canonical: absoluteUrl("/tools") },
};

export default function ToolsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Free DevOps Tools
        </h1>
        <p className="mt-3 text-muted-foreground">
          Small, focused utilities that run entirely in your browser. Your
          input is never uploaded to a server — you can verify that in your
          network tab.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <tool.icon className="size-5" />
            </span>
            <span>
              <span className="flex items-center gap-2 font-medium">
                {tool.title}
                {tool.tag && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {tool.tag}
                  </span>
                )}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {tool.description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop app promo */}
      <Link
        href="/resources"
        className="group mt-10 flex items-start gap-4 rounded-xl border border-primary/40 bg-primary/5 p-6 transition-colors hover:border-primary/60"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Monitor className="size-5" />
        </span>
        <span>
          <span className="flex items-center gap-2 font-medium">
            K8s Desktop — a real cluster viewer, in development
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Browser tools are great until you need live cluster state. K8s
            Desktop is our read-only cluster viewer: contexts, namespaces,
            pods, logs — using your existing kubeconfig, with no write paths.
          </span>
        </span>
      </Link>
    </div>
  );
}
