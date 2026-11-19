import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  Check,
  Download,
  FileText,
  ListChecks,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { product } from "@/data/product";
import { getCheckoutConfig } from "@/lib/payments";
import { PurchaseButton } from "@/components/purchase-button";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { SectionHeading } from "@/components/section-heading";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${product.name} — Production Runbooks & Checklists`,
  description: product.tagline,
  alternates: { canonical: absoluteUrl("/products/kubernetes-toolkit") },
  openGraph: {
    title: product.name,
    description: product.tagline,
  },
};

const whoShouldBuy = [
  "On-call engineers who want a structured sequence instead of improvising during incidents.",
  "Teams standardizing how they respond to the same recurring Kubernetes failures.",
  "Engineers moving from managed platforms to running their own clusters.",
  "SREs who want printable checklists for postmortems and incident reviews.",
];

const notFor = [
  "Complete beginners who haven't used kubectl yet — start with the free guides first.",
  "Teams looking for a monitoring or automation platform. This is documentation, not software.",
];

export default function ProductPage() {
  const checkout = getCheckoutConfig(product.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <ProductViewTracker productId={product.id} />
      {/* Hero */}
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            {product.edition} · v{product.version}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {product.tagline}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {product.contents.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Formats: {product.formats.join(" · ")} · {product.compatibility}
          </p>
        </div>

        {/* Purchase card */}
        <div className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-20">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">
              ${product.priceUsd}
            </span>
            <span className="text-sm text-muted-foreground">
              one-time purchase
            </span>
          </div>
          <PurchaseButton
            checkout={checkout}
            label="Get the Toolkit"
            className="mt-4 w-full"
          />
          {!checkout.enabled && (
            <p className="mt-3 text-xs text-muted-foreground">
              Checkout is being finalized — see{" "}
              <Link href="/pricing#checkout" className="underline underline-offset-4">
                pricing
              </Link>{" "}
              for status.
            </p>
          )}
          <ul className="mt-5 space-y-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Download className="size-3.5" /> Instant download after checkout
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5" /> 14-day refund policy
            </li>
            <li className="flex items-center gap-2">
              <FileText className="size-3.5" /> PDF + Markdown + YAML files
            </li>
          </ul>
        </div>
      </div>

      {/* What's inside */}
      <section className="mt-20">
        <SectionHeading
          eyebrow="Contents"
          title="What's inside the Launch Edition"
          description="The Launch Edition covers the failure modes our free guides prove are most common. It grows over time — buyers get updates to their edition free."
          align="left"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BookOpenCheck,
              title: "Troubleshooting runbooks",
              text: `${product.runbookCount} reviewed runbooks following a consistent structure: symptoms, ranked causes, diagnostics with expected output, resolution, and prevention.`,
            },
            {
              icon: Terminal,
              title: "kubectl command reference",
              text: "An annotated command sheet organized by symptom — what each flag does, what's read-only, and what modifies state.",
            },
            {
              icon: ListChecks,
              title: "Incident checklists",
              text: "Printable checklists for the first 30 minutes of an incident and for post-incident verification.",
            },
            {
              icon: FileText,
              title: "YAML examples",
              text: "Correctly structured probe, resource-limit, imagePullSecret, and drain patterns you can adapt directly.",
            },
            {
              icon: Download,
              title: "PDF handbook",
              text: "Everything bundled into a printable PDF for offline reading and on-call binders.",
            },
            {
              icon: ShieldCheck,
              title: "Safety annotations",
              text: "Every command marked read-only / modifying / destructive, with RBAC notes where they matter.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="mt-16">
        <SectionHeading
          eyebrow="Preview"
          title="A runbook section, verbatim"
          align="left"
        />
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-white/10 bg-[#0e1830] px-4 py-2 font-mono text-xs text-slate-400">
            runbooks/crashloopbackoff.md — excerpt
          </div>
          <div className="prose prose-invert max-w-none bg-card p-6 text-sm prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
            <h3>Step 3 — Read the logs of the previous crash</h3>
            <p>
              <code>kubectl logs -n example-ns web-6c8f9bb-2xklp --previous</code>
            </p>
            <p>
              <code>--previous</code> shows logs from the <em>last</em>{" "}
              terminated container — usually where the actual error lives.
              Without it you may read the logs of a fresh container that
              hasn't crashed yet.
            </p>
            <pre>
              <code>
{`$ kubectl logs web-6c8f9bb-2xklp --previous
2026-11-19T09:14:02Z INFO  starting web server
2026-11-19T09:14:02Z FATAL missing required env var DATABASE_URL`}
              </code>
            </pre>
            <p>
              That one line is the root cause: the container exits because{" "}
              <code>DATABASE_URL</code> isn't set.
            </p>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Who should buy this</h2>
          <ul className="mt-4 space-y-3">
            {whoShouldBuy.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Who probably shouldn't</h2>
          <ul className="mt-4 space-y-3">
            {notFor.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 size-4 shrink-0 text-center text-muted-foreground">–</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <dl className="mt-6 space-y-6">
          {product.faq.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-medium">{f.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Bottom CTA */}
      <section className="mt-16 rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8 text-center">
        <h2 className="text-2xl font-semibold">
          ${product.priceUsd}. One time. Yours to keep.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Cheaper than one hour of incident downtime.
        </p>
        <PurchaseButton
          checkout={checkout}
          label="Get the Kubernetes Toolkit"
          className="mt-6"
        />
      </section>
    </div>
  );
}
