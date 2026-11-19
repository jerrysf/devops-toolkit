import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  ShieldCheck,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { ScenarioCard } from "@/components/scenario-card";
import { ProductCta } from "@/components/product-cta";
import { NewsletterForm } from "@/components/newsletter-form";
import { publishedArticles, kubernetesArticles } from "@/data/articles";
import { tools } from "@/data/tools";
import { product } from "@/data/product";

const whyItems = [
  {
    icon: Terminal,
    title: "Commands you can trust",
    text: "Every diagnostic command is explained, marked read-only or mutating, and reviewed against current Kubernetes versions — not scraped from forums.",
  },
  {
    icon: BookOpenCheck,
    title: "Structured runbooks",
    text: "Symptoms → causes → diagnostics → resolution → prevention. The same incident workflow your best on-call engineer follows.",
  },
  {
    icon: ShieldCheck,
    title: "Production-safe by default",
    text: "Destructive operations are flagged, RBAC requirements are called out, and no guide tells you to delete things as a first response.",
  },
  {
    icon: Zap,
    title: "Zero-upload tools",
    text: "Validators and generators run entirely in your browser. Your YAML and cluster details never leave your machine.",
  },
];

const audiences = [
  {
    role: "DevOps Engineers",
    pain: "Own deploy pipelines that break at the worst time and need fast, repeatable diagnostics.",
  },
  {
    role: "Site Reliability Engineers",
    pain: "Carry the pager. Need structured incident response, not a wall of Stack Overflow tabs.",
  },
  {
    role: "Platform Engineers",
    pain: "Support internal developer platforms where every edge case lands on your desk.",
  },
  {
    role: "Kubernetes Engineers",
    pain: "Operate clusters day-to-day and want verified commands instead of tribal knowledge.",
  },
];

export default function Home() {
  const featured = kubernetesArticles.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Wrench className="size-3" /> For DevOps & SRE engineers
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Solve Kubernetes Problems{" "}
              <span className="text-primary">Faster.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Practical troubleshooting workflows, production-ready runbooks,
              and developer tools built for DevOps and SRE engineers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/tools" />} size="lg">
                Explore Free Tools
              </Button>
              <Button
                render={<Link href="/products/kubernetes-toolkit" />}
                size="lg"
                variant="secondary"
              >
                Get the Kubernetes Toolkit
              </Button>
            </div>
          </div>

          {/* Terminal illustration */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="rounded-xl border border-border bg-[#0a1224] shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-red-500/70" />
                <span className="size-2.5 rounded-full bg-amber-500/70" />
                <span className="size-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 font-mono text-xs text-slate-500">
                  kubectl — troubleshooting
                </span>
              </div>
              <div className="space-y-2 p-4 font-mono text-[13px] leading-6">
                <p className="text-slate-500">$ kubectl get pods</p>
                <p className="text-slate-300">
                  web-6c8f9bb-2xklp{" "}
                  <span className="text-red-400">CrashLoopBackOff</span>{" "}
                  <span className="text-slate-500">7 (3m ago)</span>
                </p>
                <p className="mt-3 text-slate-500">
                  $ kubectl logs web-6c8f9bb-2xklp --previous
                </p>
                <p className="text-slate-300">
                  Error: missing required env var{" "}
                  <span className="text-cyan-300">DATABASE_URL</span>
                </p>
                <p className="mt-3 text-emerald-400">
                  ✓ Root cause found in 2 commands
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular scenarios */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Troubleshooting library"
          title="Popular Kubernetes failure modes"
          description="Structured guides for the errors that page you. Each one walks from symptoms to verified resolution."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <ScenarioCard key={a.slug} article={a} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button render={<Link href="/kubernetes" />} variant="outline">
            Browse all guides <ArrowRight />
          </Button>
        </div>
      </section>

      {/* Free tools */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Free tools"
            title="Browser-native DevOps utilities"
            description="No signup, no upload. Everything runs locally on your machine."
          />
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
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {tool.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Why DevOps Toolkit"
          title="Built like an incident review, not a blog"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <item.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-medium">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured product */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <ProductCta />
      </section>

      {/* Who this is for */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Who this is for"
          title="Made for engineers on the hook for uptime"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {audiences.map((a) => (
            <div
              key={a.role}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-medium">{a.role}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.pain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest guides */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Latest guides"
            title="Recently reviewed troubleshooting guides"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedArticles.map((a) => (
              <Link
                key={a.slug}
                href={`/kubernetes/${a.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <h3 className="font-medium group-hover:text-primary">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {a.description}
                </p>
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {a.readingTimeMinutes} min read ·
                  K8s {a.kubernetesVersions}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One purchase. Every 3 a.m. incident gets easier.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The Kubernetes Troubleshooting Toolkit is a one-time $
          {product.priceUsd} purchase — PDF handbook, Markdown runbooks, YAML
          examples, and checklists.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/pricing" />} size="lg">
            See pricing
          </Button>
          <Button
            render={<Link href="/products/kubernetes-toolkit" />}
            size="lg"
            variant="outline"
          >
            What's inside
          </Button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-14 sm:px-6">
          <h2 className="text-xl font-semibold">
            Production incidents, explained weekly.
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            One practical Kubernetes or DevOps deep-dive per week. No spam,
            unsubscribe anytime.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
