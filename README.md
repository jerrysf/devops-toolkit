# DevOps Toolkit

Practical troubleshooting workflows, production-ready runbooks, and
browser-native developer tools for DevOps and SRE engineers — built with
Next.js, TypeScript, Tailwind CSS, and MDX.

- **Free Kubernetes troubleshooting guides** (`/kubernetes`) — verified
  commands, expected output, safety annotations
- **Free tools** (`/tools`) — YAML Validator, Cron Expression Generator,
  all client-side
- **Paid product** (`/products/kubernetes-toolkit`) — the Kubernetes
  Troubleshooting Toolkit, sold via a hosted checkout provider

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm test         # unit tests (cron parser, YAML validator)
pnpm typecheck    # TypeScript
pnpm lint         # ESLint
pnpm build        # production build (fully static)
```

## Structure

```
content/kubernetes/   # MDX troubleshooting guides & reference pages
src/app/              # App Router routes
src/components/       # UI (site chrome, tools, MDX primitives)
src/components/ui/    # shadcn/ui primitives
src/data/             # Typed content registries (articles, tools, product)
src/lib/              # cron engine, yaml validation, payments, analytics
products/             # Source assets for the paid download
docs/                 # PAYMENTS.md, SEARCH-CONSOLE.md
tests/                # Vitest unit tests
```

See `DEVELOPMENT.md` for the content-authoring workflow and
`DEPLOYMENT.md` for going live.

## Status

- Site, guides, tools: complete and verified (build + tests green)
- Payments: **prepared, not connected** — see `docs/PAYMENTS.md`
- Analytics: wired but inert until `NEXT_PUBLIC_GA_ID` is set
