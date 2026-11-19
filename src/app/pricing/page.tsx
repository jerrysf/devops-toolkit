import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { product } from "@/data/product";
import { tools } from "@/data/tools";
import { getCheckoutConfig } from "@/lib/payments";
import { PurchaseButton } from "@/components/purchase-button";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `DevOps Toolkit pricing: free tools and guides, plus the ${product.name} for $${product.priceUsd} one-time.`,
  alternates: { canonical: absoluteUrl("/pricing") },
};

const freeFeatures = [
  "All Kubernetes troubleshooting guides",
  ...tools.map((t) => `${t.title} tool`),
  "kubectl command reference & incident checklist",
  "No account required",
];

const paidFeatures = [
  ...product.contents,
  "Free updates to the Launch Edition",
  "14-day refund policy",
];

export default function PricingPage() {
  const checkout = getCheckoutConfig(product.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pricing
        </h1>
        <p className="mt-3 text-muted-foreground">
          Most of DevOps Toolkit is free. The paid product is a deeper,
          portable toolkit for engineers who respond to incidents regularly.
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-lg font-medium">Free</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guides and tools, forever free.
          </p>
          <div className="mt-4 text-4xl font-semibold tracking-tight">$0</div>
          <ul className="mt-6 space-y-2.5">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/kubernetes"
            className="mt-8 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Start reading
          </Link>
        </div>

        {/* Toolkit */}
        <div className="relative rounded-xl border border-primary/50 bg-card p-8 ring-1 ring-primary/20">
          <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
            {product.edition}
          </span>
          <h2 className="text-lg font-medium">{product.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time purchase, free edition updates.
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">
              ${product.priceUsd}
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          <ul className="mt-6 space-y-2.5">
            {paidFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <PurchaseButton
            checkout={checkout}
            label="Get the Toolkit"
            className="mt-8 w-full"
          />
        </div>
      </div>

      {/* Checkout status — honest placeholder, id="checkout" anchor */}
      <section id="checkout" className="mx-auto mt-14 max-w-2xl scroll-mt-20">
        {checkout.enabled ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Checkout is handled by our payment provider
            {checkout.provider ? ` (${checkout.provider})` : ""}. You'll be
            redirected to their secure hosted page to complete the purchase.
          </p>
        ) : (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-medium">Checkout is not live yet.</p>
            <p className="mt-1 text-amber-200/80">
              The payment provider hasn't been connected, so purchases can't
              be completed right now. Want a heads-up when it opens?{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Contact us
              </Link>{" "}
              and we'll notify you at launch.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
