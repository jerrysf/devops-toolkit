import { Check } from "lucide-react";
import { product } from "@/data/product";
import { getCheckoutConfig } from "@/lib/payments";
import { PurchaseButton } from "@/components/purchase-button";

/**
 * Compact product pitch used on the homepage and at the bottom of
 * troubleshooting guides.
 */
export function ProductCta() {
  const checkout = getCheckoutConfig(product.id);

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {product.edition} · v{product.version}
          </span>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
            {product.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {product.tagline}
          </p>
          <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {product.contents.slice(0, 4).map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="text-3xl font-semibold tracking-tight">
            ${product.priceUsd}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              one-time
            </span>
          </div>
          <PurchaseButton checkout={checkout} label="Get the Toolkit" />
          <a
            href="/products/kubernetes-toolkit"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            See what's inside →
          </a>
        </div>
      </div>
    </div>
  );
}
