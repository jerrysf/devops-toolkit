# Payments

DevOps Toolkit does **not** implement its own payment processing. Sales
run through a hosted digital-product checkout provider that handles the
payment form, taxes/VAT, receipts, and file delivery.

## Status: architecture complete, provider not configured

Implemented:

- Checkout abstraction (`src/lib/payments.ts`) — env-driven provider
  config, purchase CTAs wired to it.
- Success/cancel pages (`/checkout/success`, `/checkout/cancel`) —
  honestly worded; the success page does not claim payment is verified.
- **Webhook receiver** — `POST /api/webhooks/lemonsqueezy` verifies
  HMAC-SHA256 signatures, validates order status/product/amount/currency,
  and deduplicates events (idempotent).
- Product packaging — `node scripts/build-product.mjs` produces a real
  ZIP in `dist/` for upload to the provider.

Not configured (needs accounts/credentials):

- `NEXT_PUBLIC_CHECKOUT_URL_KUBERNETES_TOOLKIT` — no hosted checkout URL.
- `LEMONSQUEEZY_WEBHOOK_SECRET` + related validation env vars — no
  webhook secret or product id yet.
- `FULFILLMENT_HOOK_URL` — optional order-bookkeeping hook.

## Choosing a provider

| Provider | Good for | Notes |
|----------|----------|-------|
| Lemon Squeezy | Digital products, devs | Merchant of record (handles VAT); built-in file delivery + license keys; **this codebase's webhook targets LS's signature scheme** |
| Gumroad | Simple downloads | Lowest friction; different webhook format — needs a new verifier |
| Stripe Payment Links | Already have Stripe | You handle tax; webhook = `stripe-signature` header, different verification |

## Setup — Lemon Squeezy

1. Create a store at lemonsqueezy.com; complete verification.
2. Build the deliverable: `node scripts/build-product.mjs` →
   `dist/kubernetes-toolkit-v<version>.zip`.
3. Create the product: name "Kubernetes Troubleshooting Toolkit",
   price $39, upload the ZIP under **Files** — LS delivers the download
   link and receipt email automatically after purchase.
4. Product settings → set the redirect URL to
   `https://<domain>/checkout/success`.
5. Copy the checkout URL → env vars:

   ```bash
   NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy
   NEXT_PUBLIC_CHECKOUT_URL_KUBERNETES_TOOLKIT=https://<store>.lemonsqueezy.com/checkout/buy/<id>
   ```

6. Webhook (Settings → Webhooks in LS): URL
   `https://<domain>/api/webhooks/lemonsqueezy`, event `order_created`.
   LS shows the signing secret once — set:

   ```bash
   LEMONSQUEEZY_WEBHOOK_SECRET=<secret>
   LEMONSQUEEZY_PRODUCT_ID=<product id from LS>
   PRODUCT_PRICE_CENTS=3900
   PRODUCT_CURRENCY=USD
   ```

7. Test in LS test mode: send a test `order_created` webhook, run a
   test purchase end-to-end, verify the success redirect and the
   delivery email.

## What the webhook verifies (and why)

`src/app/api/webhooks/lemonsqueezy/route.ts`:

1. **Signature** — HMAC-SHA256 of the *raw* body with the webhook
   secret, timing-safe compare. No secret configured → fails closed 401.
2. **Event allowlist** — only `order_created` is processed; other
   lifecycle events are acknowledged and ignored.
3. **Idempotency** — event IDs dedupe via `src/lib/webhook-store.ts`
   (in-memory default; swap for KV/DB for cross-instance durability —
   the interface is already defined).
4. **Order fields** — `status === "paid"`, expected `product_id`,
   `total` in cents, `currency`. Mismatch → 422, nothing fulfilled.
5. **Fulfillment** — LS file delivery already emailed the download;
   the webhook records the verified purchase and optionally POSTs it
   to `FULFILLMENT_HOOK_URL` for bookkeeping. `purchase_completed`
   analytics may only be derived from this verified path.

## Security rules (non-negotiable)

- **A redirect to `/checkout/success` is NOT proof of payment.** The URL
  is publicly guessable; delivery must only follow verified webhooks.
- Read the **raw request body** for signature checks — never verify a
  re-serialized JSON parse.
- Secrets live in server-only env vars — nothing payment-related in
  `NEXT_PUBLIC_*`.
- `purchase_completed` must never fire client-side.

## Events wired today

- `purchase_cta_clicked` — CTA click (client-side).
- `checkout_started` — navigating to a configured hosted checkout.
- `purchase_completed` — emitted from the verified webhook path only
  (via `FULFILLMENT_HOOK_URL` bookkeeping or a future verified event).
