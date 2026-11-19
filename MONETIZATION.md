# Monetization

## Model

Free content and tools build search traffic and credibility; a paid
digital product converts a fraction of that audience.

```
Free guides (/kubernetes) ──► trust + SEO traffic
Free tools (/tools) ────────► repeat visits, bookmarks
        │
        ▼
Kubernetes Troubleshooting Toolkit — $39 one-time
        │
        ▼ (future)
Expanded bundle ~$79 · team licenses · premium subscription
```

## Current product

**Kubernetes Troubleshooting Toolkit — Launch Edition, $39**

Sells the deeper, portable version of what the free guides prove:
structured runbooks, annotated command reference, YAML patterns,
printable checklists, and a bundled PDF. One-time purchase, free
edition updates. Delivery via a hosted checkout provider
(`docs/PAYMENTS.md`) — currently **configured-pending**, not live.

Honesty constraints built into the site: the product page lists only
what exists (6 runbooks, not "30 scenarios"); the checkout shows a
pending state rather than a dead button; no fake testimonials or
counts.

## 60-day objective

Working toward ~$1,000/mo ≈ 25–26 sales/month. This is a target, not a
guarantee — the honest levers are:

- **Content depth first.** The next guides (OOMKilled, Pod Pending,
  DNS, PVC Pending, Ingress 502) are the highest-value pages to ship —
  each is a new search entry point and a new CTA surface.
- **Internal linking.** Every guide ends with the product CTA; index
  pages link the toolkit; pricing is one click from anywhere.
- **Search intent fit.** Articles target "how to fix X" queries —
  diagnostic intent that converts for troubleshooting products.
- **Bundle path.** Once the runbook catalog is genuinely larger, the
  $79 bundle becomes honest value, and Launch Edition buyers can get an
  upgrade path.

## Events instrumented

`tool_opened`, `tool_used`, `product_viewed`, `purchase_cta_clicked`,
`checkout_started`, `newsletter_signup` — fire when analytics is
configured. `purchase_completed` is reserved for verified payment events
only. Funnel: article view → product view → CTA → checkout start.

## Deliberately not done

- No aggressive popups, countdown timers, or fake scarcity.
- No invented social proof — it would undermine exactly the audience
  this product targets.
- No paywalled "free" guides — the free tier is the funnel.
