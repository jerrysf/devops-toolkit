import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Hammer, ExternalLink, Monitor } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { resources, desktopTools } from "@/data/resources";
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

      {/* Desktop cluster tools */}
      <section className="mt-16 border-t border-border/60 pt-12">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Monitor className="size-5 text-primary" /> Desktop cluster tools
          </h2>
          <p className="mt-3 text-muted-foreground">
            Prefer a graphical interface over raw kubectl? These tools give
            you a real cluster UI — pods, logs, and resource inspection.
          </p>
        </div>

        {/* Our own app — featured */}
        <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-medium">
                K8s Desktop
                <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[11px] text-primary">
                  ours
                </span>
                <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-[11px] text-amber-300">
                  early preview
                </span>
              </h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                A lightweight read-only cluster viewer built on Electron. It
                uses your existing kubeconfig through kubectl — so SSO and
                exec-credential auth (GKE/EKS/AKS) work out of the box, and
                nothing can modify your cluster.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/jerrysf/k8s-desktop/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
              >
                Download v0.2.0 (macOS) <ArrowRight className="size-4" />
              </a>
              <a
                href="https://github.com/jerrysf/k8s-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary"
              >
                View source <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            <li>· Context switching + namespace browsing</li>
            <li>· Pods, deployments, services, PVCs, ingresses, nodes, events</li>
            <li>· Per-container logs with --previous support</li>
            <li>· Real status detection (CrashLoopBackOff, ImagePullBackOff…)</li>
            <li>· Free tier is read-only; Pro adds actions + port-forward</li>
            <li>· Free download — unsigned macOS (arm64) preview build</li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Prefer an established open-source option? Links go to each project's
          official site — we don't host or mirror binaries.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {desktopTools.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-1.5 font-medium group-hover:text-primary">
                  {t.name}
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </h3>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {t.interface}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {t.description}
              </p>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="text-foreground/80">Best for:</span>{" "}
                  {t.bestFor}
                </p>
                <p>
                  <span className="text-foreground/80">Cost:</span> {t.cost}
                </p>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          These tools connect to real clusters using your kubeconfig — keep
          credentials local, review what each tool does with them, and prefer
          read-only contexts for exploration.
        </p>
      </section>
    </div>
  );
}
