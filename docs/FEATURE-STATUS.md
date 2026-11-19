# Feature Status

Legend: ✅ live & verified · 🟡 live with caveats · 🔴 missing/broken · ⏳ planned

## Content
| Feature | Status | Notes |
|---|---|---|
| Homepage | ✅ | |
| Kubernetes guides (CrashLoop/ImagePull/NodeNotReady) | ✅ | |
| kubectl reference + incident checklist pages | ✅ | |
| Troubleshooting Center (search/filter/sort) | ✅ | |
| Guided wizard (5 trees) | ✅ | Integrity-tested |
| KB (9 categories) | 🟡 | 3 categories populated; 6 honest "in development" |
| Resources catalog | 🟡 | 1 free download live; 4 items planned |
| 7 more Kubernetes articles | 🔴 | OOMKilled, PodPending, DNS, PVC, Ingress502, RBAC, Rollout |

## Tools
| Tool | Status | Notes |
|---|---|---|
| YAML Validator | ✅ | |
| Cron Builder | ✅ | |
| Manifest Validator | ✅ | |
| kubectl Builder | ✅ | |
| Resource Calculator | ✅ | |
| RBAC / NetworkPolicy / Probe generators | 🔴 | |
| HPA Calculator / CronJob YAML generator | 🔴 | |

## Simulator
| Item | Status | Notes |
|---|---|---|
| Engine + parser | ✅ | read-only enforced |
| 5 scenarios | ✅ | |
| Scoring state machine | 🔴 | shows 100 before playing |
| Time tracking | 🔴 | |
| 5 additional scenarios | 🔴 | |

## Commercial
| Item | Status | Notes |
|---|---|---|
| Product page | 🟡 | oversells: 6 runbooks + PDF not shipped |
| Checkout abstraction | 🟡 | architecture only, no provider configured |
| Webhook verification | 🔴 | no route exists |
| Product delivery | 🔴 | no ZIP build, no delivery mechanism |
| Release manifest / changelog / license | 🔴 | |
| Refund policy page | ✅ | |

## Trust
| Item | Status | Notes |
|---|---|---|
| Command safety annotations | ✅ | |
| "Verified against real clusters" claim | 🔴 | not backed by process — downgrade or validate |
| Content validation metadata | 🔴 | |

## Analytics
| Event | Status |
|---|---|
| tool_opened / tool_used | ✅ wired |
| product_viewed | ✅ wired |
| purchase_cta_clicked | 🟡 check wiring |
| checkout_started | 🔴 |
| purchase_completed | ⏳ intentionally unwired until verified webhook |
| simulator_started / simulator_completed | 🔴 |
| newsletter_signup | 🟡 placeholder endpoint |
