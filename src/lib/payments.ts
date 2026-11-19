/**
 * Payment / checkout abstraction layer.
 *
 * DevOps Toolkit does not implement its own payment processing. A
 * hosted digital-product checkout provider (Lemon Squeezy, Gumroad,
 * Stripe Payment Links, ...) owns the checkout, taxes, and delivery.
 * This module is the single place that knows how to reach it.
 *
 * Configuration is entirely environment-driven so the provider can be
 * chosen or swapped without code changes:
 *
 *   NEXT_PUBLIC_PAYMENT_PROVIDER   e.g. "lemonsqueezy" | "gumroad"
 *   NEXT_PUBLIC_CHECKOUT_URL       full hosted checkout URL for the product
 *
 * See docs/PAYMENTS.md for provider setup instructions.
 *
 * IMPORTANT: a frontend redirect to a "success" page is NOT proof of
 * payment. Fulfillment must only happen after a verified provider
 * webhook (signature + order status + product + amount checks). See
 * docs/PAYMENTS.md for the webhook verification requirements.
 */

export interface ProductCheckoutConfig {
  productId: string;
  provider: string | null;
  /** Hosted checkout URL, or null when not yet configured. */
  checkoutUrl: string | null;
  /** Whether a real checkout is configured (vs. a placeholder CTA). */
  enabled: boolean;
}

const provider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? null;

export function getCheckoutConfig(productId: string): ProductCheckoutConfig {
  // Per-product URL wins, then the generic fallback. Only public env
  // vars are read here — secrets must never reach the client.
  const specific = process.env[`NEXT_PUBLIC_CHECKOUT_URL_${productId}`];
  const generic = process.env.NEXT_PUBLIC_CHECKOUT_URL;
  const checkoutUrl = specific ?? generic ?? null;
  return {
    productId,
    provider,
    checkoutUrl,
    enabled: Boolean(checkoutUrl),
  };
}
