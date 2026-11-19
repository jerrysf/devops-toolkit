# Deployment

Target platform: **Vercel** (the app is a fully static Next.js build —
any static-capable host works, but Vercel is the reference).

## First deploy

1. Push this repo to GitHub.
2. In Vercel: New Project → import the repo. Defaults work — framework
   is auto-detected (Next.js), build `next build`, output `.next`.
3. Set environment variables (Settings → Environment Variables) —
   see `.env.example` for the full list:
   - `NEXT_PUBLIC_SITE_URL` — **required** for correct canonical URLs,
     sitemap, and OG tags (e.g. `https://www.yourdomain.com`).
   - `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` — optional.
   - `NEXT_PUBLIC_PAYMENT_PROVIDER`, `NEXT_PUBLIC_CHECKOUT_URL_*` — when
     checkout is configured (see `docs/PAYMENTS.md`).
   - `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` — when a provider is chosen.
   - `PAYMENT_WEBHOOK_SECRET` — server-only, when webhooks exist.
4. Deploy. Verify `/`, `/sitemap.xml`, `/robots.txt`, and one article.

## Custom domain

1. Vercel → Project → Domains → add the domain; follow the DNS
   instructions (A record / CNAME).
2. Update `NEXT_PUBLIC_SITE_URL` to the production origin and redeploy so
   sitemap/canonical/OG URLs are correct.
3. Complete `docs/SEARCH-CONSOLE.md` (verify property, submit sitemap).

## Pre-launch checklist

- [ ] `pnpm build` clean; `pnpm test` and `pnpm lint` green
- [ ] `NEXT_PUBLIC_SITE_URL` = production origin
- [ ] Checkout URL set (or confirm the pending-checkout state is
      acceptable — it's honest, not broken)
- [ ] Success/cancel redirect URLs configured at the payment provider
- [ ] Search Console verified; sitemap submitted
- [ ] Privacy/Terms/Refund pages reviewed (they're real text, but have
      counsel check for your jurisdiction)

## Webhooks (when implemented)

Provider webhooks will need a publicly reachable URL and
`PAYMENT_WEBHOOK_SECRET`. Follow the verification rules in
`docs/PAYMENTS.md` — signature check, order verification, idempotent
fulfillment. Do not ship fulfillment that trusts the browser redirect.
