# Payments

DevOps Toolkit does **not** implement its own payment processing. Sales
run through a hosted digital-product checkout provider that handles the
payment form, taxes/VAT, receipts, and file delivery.

## Status: prepared, not connected

The checkout abstraction is implemented (`src/lib/payments.ts`), the
purchase CTAs are wired to it, and the success/cancel pages exist
(`/checkout/success`, `/checkout/cancel`). **No provider account is
configured yet** — until `NEXT_PUBLIC_CHECKOUT_URL_*` is set, purchase
buttons route to `/pricing#checkout` which tells the buyer checkout isn't
live. Nothing pretends to sell.

## Choosing a provider

The code is provider-agnostic. Good options for digital downloads:

| Provider | Good for | Notes |
|----------|----------|-------|
| Lemon Squeezy | Digital products, devs | Handles VAT/sales tax as merchant of record; built-in license keys; hosted checkout |
| Gumroad | Simple digital downloads | Lowest setup friction; higher fees |
| Stripe Payment Links | Already have Stripe | No merchant-of-record tax handling; you configure tax yourself |

## Setup (Lemon Squeezy example)

1. Create a store at lemonsqueezy.com and complete their verification.
2. Add a product: name "Kubernetes Troubleshooting Toolkit", price $39,
   upload the ZIP built from `products/kubernetes-toolkit/` (see
   `scripts/build-product-zip.sh` when it exists — currently manual).
3. In product settings, set the redirect URL to
   `https://<domain>/checkout/success`.
4. Copy the checkout URL and set env vars:

   ```bash
   NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy
   NEXT_PUBLIC_CHECKOUT_URL_KUBERNETES_TOOLKIT=https://<store>.lemonsqueezy.com/checkout/buy/<id>
   ```

5. Test the full flow with their test mode before launch.

## Security rules (non-negotiable)

- **A redirect to `/checkout/success` is NOT proof of payment.** The URL
  is publicly guessable. Delivery/access must only be granted via a
  verified provider webhook.
- **Webhook verification requirements** (when webhooks are implemented):
  - Verify the request signature (Lemon Squeezy: HMAC-SHA256 of the raw
    body with `PAYMENT_WEBHOOK_SECRET`; Gumroad/Stripe have equivalents).
  - Verify `order status`, `product_id`, and `amount`/`currency` match
    the expected product.
  - Make fulfillment idempotent — key on the provider's order ID so
    retries can't double-deliver or double-email.
  - Read the **raw request body** for signature checks — don't verify a
    re-serialized JSON parse.
- **Never** put secrets in `NEXT_PUBLIC_*` vars — those ship to the
  browser. `PAYMENT_WEBHOOK_SECRET` is server-only.
- The `purchase_completed` analytics event must only fire from a verified
  webhook or verified provider confirmation — never from the success page.

## Events wired today

- `purchase_cta_clicked` — CTA click (client-side).
- `checkout_started` — navigating to a configured hosted checkout.
- `purchase_completed` — **reserved for verified payment events; not
  implemented.**

## Env vars

See `.env.example`. Per-product URLs (`NEXT_PUBLIC_CHECKOUT_URL_<ID>`)
win over the generic `NEXT_PUBLIC_CHECKOUT_URL`.
