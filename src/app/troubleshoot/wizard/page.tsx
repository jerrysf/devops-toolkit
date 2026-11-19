import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wand2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { wizardTrees } from "@/data/wizards";
import { kubernetesArticles } from "@/data/articles";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guided Troubleshooting Wizard",
  description:
    "Interactive Kubernetes diagnosis: answer questions about your symptoms and get guided diagnostic commands.",
  alternates: { canonical: absoluteUrl("/troubleshoot/wizard") },
};

export default function WizardIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { title: "Troubleshoot", href: "/troubleshoot" },
          { title: "Wizard" },
        ]}
      />
      <header className="mt-6 mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <Wand2 className="size-3" /> Guided diagnosis
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Troubleshooting Wizard
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pick the failure mode you're seeing. The wizard asks a few
          targeted questions and points you at the right diagnostics — with
          the commands to run and what to look for.
        </p>
      </header>

      <div className="space-y-3">
        {wizardTrees.map((tree) => {
          const guide = kubernetesArticles.find((a) => a.slug === tree.slug);
          return (
            <Link
              key={tree.slug}
              href={`/troubleshoot/wizard/${tree.slug}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div>
                <h2 className="font-medium group-hover:text-primary">
                  {tree.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tree.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!guide?.published && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    guide in progress
                  </span>
                )}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
