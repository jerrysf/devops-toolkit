# Feature Status

Legend: ✅ live & verified · 🟡 live with caveats · 🔴 missing/broken · ⏳ planned

## Content
| Feature | Status | Notes |
|---|---|---|
| Homepage | ✅ | |
| Kubernetes guides (10 articles) | ✅ | CrashLoop, ImagePull, NodeNotReady, PodPending, OOMKilled, DNS, PVC, Ingress502, RBAC, Rollout |
| kubectl reference + incident checklist pages | ✅ | |
| Troubleshooting Center (search/filter/sort) | ✅ | All 10 articles searchable |
| Guided wizard (8 trees) | ✅ | CrashLoop, ImagePull, Pending, NodeNotReady, DNS, OOMKilled, Error, ContainerCreating — integrity-tested |
| KB (9 categories) | 🟡 | Kubernetes + SRE + Incident Mgmt populated; 6 honest "in development" |
| Resources catalog | 🟡 | 1 free download live; 4 items planned |

## Tools (11)
| Tool | Status |
|---|---|
| YAML Validator / Cron Builder / Manifest Validator / kubectl Builder / Resource Calculator | ✅ |
| RBAC / NetworkPolicy / Probe generators | ✅ new |
| HPA Calculator / CronJob YAML generator | ✅ new |

## Simulator
| Item | Status | Notes |
|---|---|---|
| Engine + parser | ✅ | read-only enforced, deterministic mock cluster |
| 10 scenarios | ✅ | +OOMKilled, PVC, Ingress502, RBAC, Rollout |
| Scoring state machine | ✅ | Not Started / In Progress / Completed |
| Time tracking | ✅ | elapsed seconds tracked & scored |

## Commercial
| Item | Status | Notes |
|---|---|---|
| Product page | ✅ | 6 runbooks real; handbook.html (printable), not PDF — claims corrected |
| Checkout abstraction | 🟡 | wired to `NEXT_PUBLIC_CHECKOUT_URL_*`; provider account not configured |
| Webhook verification | ✅ | `/api/webhooks/lemonsqueezy` — HMAC + product/amount/currency checks |
| Product delivery | 🟡 | ZIP builds via `scripts/build-product.mjs` (16 files, SHA pinned); secure delivery URL still needs provider config |
| Release manifest / changelog / license | ✅ | |
| Refund policy page | ✅ | |

## Trust
| Item | Status | Notes |
|---|---|---|
| Command safety annotations | ✅ | |
| "Verified against real clusters" claim | ✅ removed | replaced with honest static-review wording |
| Content validation metadata | ✅ | runbooks carry tested-version + review status |

## Analytics
| Event | Status |
|---|---|
| tool_opened / tool_used / product_viewed | ✅ wired |
| purchase_cta_clicked / checkout_started | ✅ wired |
| purchase_completed | ✅ server-only via verified webhook |
| simulator_started / simulator_completed | ✅ wired |
| newsletter_signup | 🟡 placeholder until endpoint configured |

## External config still needed
- `NEXT_PUBLIC_CHECKOUT_URL_KUBERNETES_TOOLKIT` — Lemon Squeezy product URL
- `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_PRODUCT_ID`, `PRODUCT_PRICE_CENTS` — webhook verification
- Durable fulfillment store + transactional email (Resend) for delivery
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` — optional analytics/newsletter
