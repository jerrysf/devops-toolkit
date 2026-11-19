# Conversion Funnel Report

Event layer: `src/lib/analytics.ts` → GA4 (gtag) + Vercel Analytics when configured.
No user input (YAML, commands, secrets) is ever attached to events — params are coarse labels only.

## Event inventory

| Event | Emitted | Location |
|---|---|---|
| `tool_opened` | client | each tool page mount (11 tools) |
| `tool_used` | client | on generate/validate actions (5 tools) |
| `simulator_started` | client | first command in a scenario |
| `simulator_completed` | client | on correct diagnosis submission |
| `product_viewed` | client | `/products/kubernetes-toolkit` mount |
| `purchase_cta_clicked` | client | purchase button click |
| `checkout_started` | client | redirect to hosted checkout |
| `purchase_completed` | **server only** | `/api/webhooks/lemonsqueezy` after HMAC + product/amount/currency verification |
| `newsletter_signup` | client | footer form submit |

`purchase_completed` is intentionally absent from client code — a checkout *redirect* is not payment.

## Funnel definitions

### Tool → product funnel
```
tool_opened → tool_used → product_viewed → purchase_cta_clicked → checkout_started → purchase_completed
```
Drop-off to watch: `tool_used → product_viewed` (discovery gap — fix with in-tool product CTAs) and `checkout_started → purchase_completed` (checkout friction — provider-side).

### Engagement funnel
```
simulator_started → simulator_completed
```
Completion rate measures scenario difficulty calibration. Track per-scenario via the `scenario` param.

### Content funnel
```
guide view (GA pageview) → tool_opened / simulator_started
```
Measures whether articles convert readers into tool users.

## Pulling the report

GA4 → Explore → Funnel exploration, add the events in order above. Vercel Analytics shows custom events under the Events tab; for funnel math export via the GA4 API or compute ratios from the event counts directly.

## Guardrails

- Never attach command text, YAML, file contents, or identifiers to params.
- `purchase_completed` requires `LEMONSQUEEZY_WEBHOOK_SECRET` verification; without it the endpoint rejects events and nothing is recorded.
- Newsletter requires `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`; unconfigured it is an honest placeholder, not a fake signup.
