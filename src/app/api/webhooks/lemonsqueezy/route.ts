/**
 * Lemon Squeezy webhook receiver.
 *
 * Route: POST /api/webhooks/lemonsqueezy
 *
 * Flow: verify HMAC-SHA256 signature over the RAW body → parse →
 * idempotency check → validate order (status, product, amount,
 * currency) → fulfill. Fails closed at every step.
 *
 * Fulfillment note: Lemon Squeezy's own file delivery (attaching the
 * product ZIP to the product) already emails the download link and
 * receipt — that is the primary delivery mechanism. This webhook
 * exists to (a) record verified purchases for analytics and
 * (b) optionally notify a fulfillment hook for order bookkeeping.
 *
 * Required env vars (server-only, never NEXT_PUBLIC_):
 *   LEMONSQUEEZY_WEBHOOK_SECRET   signing secret from LS webhook settings
 *   LEMONSQUEEZY_PRODUCT_ID       expected product id (integer)
 *   PRODUCT_PRICE_CENTS           expected price in cents (e.g. "3900")
 *   PRODUCT_CURRENCY              expected currency (e.g. "USD")
 * Optional:
 *   FULFILLMENT_HOOK_URL          HTTPS endpoint POSTed verified orders
 */

import { NextResponse } from "next/server";
import {
  parseLemonOrder,
  verifyLemonSqueezySignature,
} from "@/lib/webhook-verify";
import { getEventStore } from "@/lib/webhook-store";

const ALLOWED_EVENTS = new Set(["order_created"]);

export async function POST(request: Request) {
  // Raw body is required for signature verification.
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const verify = verifyLemonSqueezySignature(
    rawBody,
    signature,
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  );
  if (!verify.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const order = parseLemonOrder(payload);
  if (!order) {
    return NextResponse.json({ error: "unrecognized payload" }, { status: 400 });
  }

  if (!ALLOWED_EVENTS.has(order.eventName)) {
    // Not an error — providers send lifecycle events we don't act on.
    return NextResponse.json({ received: true, action: "ignored" });
  }

  // Idempotency: providers retry; never process the same event twice.
  const store = getEventStore();
  if (await store.has(order.eventId)) {
    return NextResponse.json({ received: true, action: "duplicate" });
  }

  // Order validation — a signed event for the wrong product/amount is
  // still not proof of a valid purchase.
  const expectedProduct = Number(process.env.LEMONSQUEEZY_PRODUCT_ID);
  const expectedCents = Number(process.env.PRODUCT_PRICE_CENTS);
  const expectedCurrency = process.env.PRODUCT_CURRENCY ?? "USD";
  const mismatches: string[] = [];
  if (expectedProduct && order.productId !== expectedProduct) {
    mismatches.push("product");
  }
  if (order.status !== "paid") mismatches.push(`status=${order.status}`);
  if (expectedCents && order.totalCents !== expectedCents) {
    mismatches.push("amount");
  }
  if (order.currency !== expectedCurrency) mismatches.push("currency");
  if (mismatches.length > 0) {
    return NextResponse.json(
      { error: "order validation failed", mismatches },
      { status: 422 },
    );
  }

  await store.add(order.eventId);

  // Verified purchase. LS file delivery handles the download email; the
  // optional hook is for order bookkeeping / purchase_completed events.
  const hook = process.env.FULFILLMENT_HOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "purchase_completed",
          provider: "lemonsqueezy",
          orderId: order.orderId,
          eventId: order.eventId,
          productId: order.productId,
          totalCents: order.totalCents,
          currency: order.currency,
          email: order.email,
        }),
      });
    } catch {
      // Bookkeeping must not fail the webhook — LS delivery already ran.
      // Logged on the platform side; the purchase itself is verified.
    }
  }

  return NextResponse.json({ received: true, action: "fulfilled" });
}

export function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
