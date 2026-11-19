"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import type { ProductCheckoutConfig } from "@/lib/payments";

/**
 * Purchase CTA. When a hosted checkout URL is configured it links
 * straight to the provider; otherwise it points at the pricing page
 * which explains the checkout status honestly — never a dead button
 * pretending to sell.
 */
export function PurchaseButton({
  checkout,
  label,
  size = "lg",
  className,
}: {
  checkout: ProductCheckoutConfig;
  label: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const href = checkout.enabled ? checkout.checkoutUrl! : "/pricing#checkout";

  return (
    <Button
      render={
        checkout.enabled ? (
          // External hosted checkout — plain <a>, full page navigation.
          <a href={href} rel="noopener" />
        ) : (
          <Link href={href} />
        )
      }
      size={size}
      className={className}
      onClick={() => {
        trackEvent("purchase_cta_clicked", { product: checkout.productId });
        if (checkout.enabled) {
          trackEvent("checkout_started", {
            product: checkout.productId,
            provider: checkout.provider ?? "unknown",
          });
        }
      }}
    >
      {label}
    </Button>
  );
}
