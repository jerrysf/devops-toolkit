# Architecture

## Principles

Static-first, client-executed, no backend complexity. Every page
prerenders at build; the only JavaScript that runs at request time is in
the user's browser (tools, theme, copy buttons, analytics).

## Rendering model

- **All routes are static.** Next.js 16 with Cache Components +
  Partial Prefetching; pages prerender to HTML at build.
- **MDX is build-time compiled** (`@next/mdx`), not runtime-parsed —
  articles are TypeScript modules in the bundle graph.
- **Unstable values are banned at prerender** by Cache Components;
  `new Date()` lives in client effects or `'use cache'` functions.

## Content pipeline

```
content/kubernetes/*.mdx ──┐
                           ├─ @next/mdx + remark-gfm + rehype-slug
src/data/articles.ts       │    + rehype-pretty-code (shiki)
  (typed registry) ────────┘         │
src/lib/mdx-articles.ts  ── static import map: slug → module
src/app/kubernetes/[slug]/page.tsx ─ meta + MDX body + layout
                                     + related + product CTA + JSON-LD
```

The registry is the source of truth for metadata (index pages, sitemap,
related links). The MDX file holds only prose. `published: false`
entries render as "in progress" on indexes with **no route** — nothing
pretends to exist.

## Separation of concerns

| Layer | Location | Rule |
|-------|----------|------|
| Content | `content/`, `src/data/` | No React imports in data registries (icon refs excepted) |
| Pure logic | `src/lib/` | No JSX, unit-tested (cron, yaml, payments config) |
| UI | `src/components/` | Client components only where interactivity requires |
| Routes | `src/app/` | Thin pages; logic lives in lib/components |
| Product assets | `products/` | Source files for the paid download, not served by the app |

## Payments

`src/lib/payments.ts` is the single seam: env-configured hosted checkout
URL + provider label. CTAs (`PurchaseButton`) consume its config; when no
URL exists they route to an honest pending state. No payment code runs
server-side today; future webhooks get a dedicated route with signature
verification per `docs/PAYMENTS.md`.

## Analytics

`src/lib/analytics.ts` — typed event names, forwards to gtag when
`NEXT_PUBLIC_GA_ID` exists, else no-ops. Event params are coarse labels;
user input (YAML, expressions) is never sent.

## Security posture

- Tools execute 100% client-side; nothing pasted is transmitted.
- No secrets in `NEXT_PUBLIC_*`; webhook secret is server-only.
- Security-relevant commands in content are safety-tagged.
- Dependency surface kept small; lockfile pinned via pnpm.

## Extensibility

- New article = MDX file + registry entry + import-map line.
- New tool = lib module + client component + registry entry.
- New product = `src/data/` config + `NEXT_PUBLIC_CHECKOUT_URL_<ID>` +
  landing page; payment abstraction is already product-keyed.
- `src/lib/mdx-articles.ts` accepts new slugs without structural change.
