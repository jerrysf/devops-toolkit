/**
 * Payment webhook verification — Lemon Squeezy-compatible HMAC.
 *
 * Lemon Squeezy signs the raw request body with the webhook secret
 * and sends the hex digest in `X-Signature`. Gumroad and Stripe use
 * different schemes; this module is intentionally provider-specific
 * and named accordingly.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

/** Verify a Lemon Squeezy webhook signature against the raw body. */
export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): VerifyResult {
  if (!secret) {
    // Fail closed: an unconfigured secret must never accept events.
    return { ok: false, reason: "webhook secret not configured" };
  }
  if (!signatureHeader) {
    return { ok: false, reason: "missing X-Signature header" };
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}

export interface LemonOrder {
  eventId: string;
  eventName: string;
  orderId: string;
  productId: number | null;
  variantId: number | null;
  status: string | null;
  totalCents: number | null;
  currency: string | null;
  email: string | null;
}

/** Extract the fields we validate from a Lemon Squeezy webhook payload. */
export function parseLemonOrder(body: unknown): LemonOrder | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const meta = b.meta as Record<string, unknown> | undefined;
  const data = b.data as Record<string, unknown> | undefined;
  const attrs = data?.attributes as Record<string, unknown> | undefined;
  if (!data || !attrs) return null;
  const firstItem = (attrs.first_order_item as Record<string, unknown> | undefined) ?? {};
  return {
    eventId: String(meta?.event_id ?? data.id ?? ""),
    eventName: String(meta?.event_name ?? ""),
    orderId: String(data.id ?? ""),
    productId: typeof firstItem.product_id === "number" ? firstItem.product_id : null,
    variantId: typeof firstItem.variant_id === "number" ? firstItem.variant_id : null,
    status: typeof attrs.status === "string" ? attrs.status : null,
    totalCents: typeof attrs.total === "number" ? attrs.total : null,
    currency: typeof attrs.currency === "string" ? attrs.currency : null,
    email: typeof attrs.user_email === "string" ? attrs.user_email : null,
  };
}
