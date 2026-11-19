# Phase 2 Audit — DevOps Toolkit

Audit date: 2026 (Phase 2.1 baseline). Repository: `devops-toolkit`,
Next.js 16.4.6 + TypeScript + Tailwind v4, deployed to Vercel.

## Routes (all static/prerendered)

| Route | Status |
|---|---|
| `/` | Complete |
| `/kubernetes`, `/kubernetes/[slug]` (3 articles), `/kubernetes/kubectl-commands`, `/kubernetes/checklist` | Complete |
| `/troubleshoot`, `/troubleshoot/wizard`, `/troubleshoot/wizard/[scenario]` (5 trees) | Complete |
| `/tools` + 5 tools (`yaml-validator`, `cron-generator`, `manifest-validator`, `kubectl-builder`, `resource-calculator`) | Complete |
| `/simulator` + 5 scenarios | Complete, scoring bug (see below) |
| `/kb`, `/kb/[category]` (9 categories, 3 populated) | Complete, sparse content |
| `/resources` | Complete (1 free download, 1 premium listing, 4 "in development") |
| `/products/kubernetes-toolkit` | Live — advertises contents not all present (see Product) |
| `/pricing`, `/blog`, `/about`, `/contact` | Complete |
| `/checkout/success`, `/checkout/cancel` | Live, honestly worded |
| `/privacy`, `/terms`, `/refund-policy` | Complete |
| `/sitemap.xml`, `/robots.txt` | Complete, covers all content routes |
| API routes | **None exist** |

## Implemented tools

1. YAML Validator — syntax only, honestly scoped.
2. Cron Builder — 5-field parser, next-run preview, field-level builder.
3. Manifest Validator — structural checks + deprecated API table vs K8s 1.34.
4. kubectl Command Builder — 10 actions, safety classification.
5. Resource Calculator — unit conversion + workload sums.

## Simulator

- 5 scenarios: crashloopbackoff, imagepullbackoff, pod-pending,
  node-not-ready, dns-resolution. Deterministic mock clusters, controlled
  command parser (get/describe/logs/top/events), hints, diagnosis options,
  localStorage progress.
- **BUG:** score `100/100` is displayed before any interaction — the
  scoring state machine has no "not started" state.
- Missing scenarios required by spec: OOMKilled, PVC Pending, Ingress 502,
  RBAC Forbidden, Deployment Rollout Failure.

## Product — `products/kubernetes-toolkit/`

| Advertised | Actually present |
|---|---|
| 6 reviewed runbooks | **3 files** (crashloopbackoff, imagepullbackoff, node-not-ready) |
| PDF handbook | **None** — README says "generated at release time" |
| kubectl command reference | **None** — README says "to be added" |
| YAML examples | 2 files (image-pull-secret, startup-probe) |
| Incident checklists | 1 file (incident-response) |
| Release manifest | None |
| Changelog | None |
| License | None |

## Payment integration

- `src/lib/payments.ts`: env-driven hosted-checkout abstraction
  (`NEXT_PUBLIC_PAYMENT_PROVIDER`, `NEXT_PUBLIC_CHECKOUT_URL[_<ID>]`).
- No checkout URL configured → product page shows honest "being
  finalized" state. Pricing page reflects the same.
- No webhook route, no signature verification, no fulfillment path —
  documented requirements in `docs/PAYMENTS.md` but not implemented.
- Success page correctly disclaims that a redirect is not proof of payment.

## Placeholders / honesty gaps

- Homepage: "verified against real clusters" — commands were reviewed
  and statically checked, **not executed against live clusters**. Claim
  must be downgraded or backed by a validation process.
- `product.runbookCount = 6` vs 3 files on disk.
- "PDF handbook" in `product.contents` + purchase card — no PDF exists.
- KB categories AWS/Terraform/Docker/Linux/CI/CD/Observability show
  honest "in development" — acceptable.
- Resources catalog: 4 items honestly marked planned.

## SEO

- Per-page titles/descriptions/canonicals; OG on product page; sitemap
  covers all published routes; robots.txt present. Article pages have
  breadcrumbs. No structured data (acceptable — nothing qualifies yet).

## Deployment

- Vercel CLI deploys (`vercel --prod`), project linked, `.env.local`
  gitignored, `NEXT_PUBLIC_SITE_URL` set in production. No CI pipeline.

## Test suite

- 105 tests, 7 files: cron, yaml, wizard, k8s-manifest, kubectl-builder,
  resources, simulator. All passing.

## Verdict

Foundation is solid. The blocking trust issues: product page oversells
(6 runbooks + PDF vs. reality), the "real clusters" claim, and the
simulator score bug. Payment is architecture-only — needs a real
provider config + webhook route to be commercial.
