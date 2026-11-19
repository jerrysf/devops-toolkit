# Phase 2 Roadmap (2.1 — Maturity & Monetization)

## Milestone A — Trust & commerce foundation
1. ✅ Audit (this file set).
2. Simulator scoring state machine: Not Started → In Progress →
   Completed with score, hints, guesses, commands, elapsed time.
3. Product truthfulness:
   - Write runbooks 4–6 (pod-pending, oomkilled, dns-resolution) so the
     advertised six actually exist.
   - Write `kubectl-reference.md` + second checklist.
   - `scripts/build-product.mjs` → real ZIP + compiled printable
     handbook (HTML for print→PDF) + `RELEASE-MANIFEST.json`.
   - Changelog + license + free sample runbook download.
   - Align product page copy with shipped files.
4. Payment architecture:
   - `src/app/api/webhooks/payment/route.ts` — Lemon Squeezy-compatible
     HMAC-SHA256 verification, event allowlist, idempotency store
     interface, order validation (product/amount/currency).
   - `checkout_started` event on PurchaseButton.
   - Updated `docs/PAYMENTS.md` — exact Lemon Squeezy setup.
   - Status: architecture complete; provider credentials required.

## Milestone B — Generators
RBAC Generator, NetworkPolicy Generator, Probe Generator (+ HPA
calc, CronJob YAML gen) — pure libs + UI + tests each.

## Milestone C — Depth
- Simulator scenarios 6–10 (OOMKilled, PVC Pending, Ingress 502,
  RBAC Forbidden, Rollout Failure).
- Kubernetes articles: OOMKilled, Pod Pending, DNS, PVC Pending,
  Ingress 502, RBAC, Rollout (matching simulator coverage).

## Milestone D — Hardening
Analytics events (simulator_started/completed), content-validation
metadata on articles, trust-copy audit, SEO polish, security review,
full test + build + deploy verification.

## Honesty rules
- No claim without evidence; validation levels labeled
  (static-review / simulated / cluster-tested).
- purchase_completed only fires from a verified webhook.
- Unfinished files are never listed as deliverables.
