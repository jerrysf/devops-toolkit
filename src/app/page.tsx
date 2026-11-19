import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  Play,
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
import { HeroTerminal } from "@/components/hero-terminal";
import { StatsStrip } from "@/components/stats-strip";
import { publishedArticles, kubernetesArticles } from "@/data/articles";
import { tools } from "@/data/tools";
import { allSimScenarios } from "@/data/simulator";
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

const featuredToolSlugs = [
  "manifest-validator",
  "kubectl-builder",
  "rbac-generator",
  "cronjob-generator",
];

export default function Home() {
  const featured = kubernetesArticles.filter((a) => a.published).slice(0, 6);
  const featuredTools = featuredToolSlugs
    .map((s) => tools.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
  const previewScenario =
    allSimScenarios.find((s) => s.slug === "crashloopbackoff") ??
    allSimScenarios[0];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Wrench className="size-3" /> For DevOps & SRE engineers
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              It's 3 a.m. and the pod{" "}
              <span className="text-primary">just crashed.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Free tools, guided wizards, and a practice simulator that teach
              you to find the root cause — not to restart things and hope.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/troubleshoot" />} size="lg">
                Start troubleshooting <ArrowRight />
              </Button>
              <Button
                render={<Link href="/simulator" />}
                size="lg"
                variant="secondary"
              >
                <Play /> Try the simulator
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No signup. No cluster access needed. Everything runs locally.
            </p>
          </div>
          <HeroTerminal />
        </div>

        {/* Trust strip */}
        <div className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <StatsStrip
            stats={[
              { value: tools.length, label: "interactive tools" },
              { value: allSimScenarios.length, label: "simulator scenarios" },
              {
                value: publishedArticles.length,
                label: "complete troubleshooting guides",
              },
              { value: 8, label: "guided diagnostic wizards" },
            ]}
          />
        </div>
      </section>

      {/* Simulator feature — the differentiator */}
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              Practice without production
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Learn incident response in a simulated cluster — not at 3 a.m. for
              real.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Ten deterministic failure scenarios with realistic kubectl
              output, progressive hints, and scored diagnosis. No kubeconfig,
              no credentials, no risk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                render={
                  <Link href={`/simulator/${previewScenario.slug}`} />
                }
              >
                Practice: fix a CrashLoopBackOff
              </Button>
              <Button render={<Link href="/simulator" />} variant="outline">
                All {allSimScenarios.length} scenarios
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Scenario library
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {allSimScenarios.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/simulator/${s.slug}`}
                    className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-primary/50"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />
                    <span className="truncate group-hover:text-primary">
                      {s.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Popular scenarios */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Troubleshooting library"
          title="The failure modes that page you"
          description="Structured guides walking from symptoms to verified resolution — with expected output at every step."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <ScenarioCard key={a.slug} article={a} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button render={<Link href="/troubleshoot" />} variant="outline">
            Search the troubleshooting center <ArrowRight />
          </Button>
        </div>
      </section>

      {/* Free tools — curated */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Free tools"
            title="Browser-native engineering utilities"
            description="No signup, no upload. Every tool runs locally on your machine."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredTools.map((tool) => (
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
          <div className="mt-8 text-center">
            <Button render={<Link href="/tools" />} variant="outline">
              All {tools.length} tools <ArrowRight />
            </Button>
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
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
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

      {/* Latest guides */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Latest guides"
            title="Complete troubleshooting runbooks"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedArticles.slice(0, 6).map((a) => (
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
          Start free. Upgrade when the 3 a.m. page hits.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The Kubernetes Troubleshooting Toolkit is a one-time $
          {product.priceUsd} purchase — printable handbook, six verified
          runbooks, YAML examples, and incident checklists.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/products/kubernetes-toolkit" />} size="lg">
            What's inside
          </Button>
          <Button
            render={<Link href="/pricing" />}
            size="lg"
            variant="outline"
          >
            See pricing
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          One-time purchase · free sample runbook available
        </p>
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
