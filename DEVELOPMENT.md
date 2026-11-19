# Development

## Stack

Next.js 16 (App Router, Turbopack, Cache Components) · TypeScript ·
Tailwind CSS v4 · shadcn/ui (base-ui) · MDX via `@next/mdx` · Vitest.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build (all routes prerendered) |
| `pnpm start` | Serve the production build |
| `pnpm test` | Vitest unit tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm exec next typegen` | Regenerate route param types after adding routes |

## Publishing a new troubleshooting guide

1. Write `content/kubernetes/<slug>.mdx` following the required structure:
   `## Symptoms` → `## Common causes` → `## Diagnosis` →
   `## Root cause analysis` → `## Resolution` → `## Verify the fix` →
   `## Prevention`.
   - Mark command safety inline: `<Safety level="readonly" />`,
     `<Safety level="modify" />`, `<Safety level="destructive" />`.
   - Use `<Callout type="info|warning|danger">` for warnings/RBAC notes.
   - Code fences get syntax highlighting + copy button automatically.
   - Avoid raw `<` and `{` outside code — they parse as JSX/expressions.
2. Add the entry to `src/data/articles.ts` (title, description, versions,
   `lastReviewed`, `readingTimeMinutes`, `related`, `published: true`).
3. Register the import in `src/lib/mdx-articles.ts`.
4. `pnpm build` — the route is generated statically; sitemap updates
   automatically.

**Content rules:** commands must be syntactically valid; explain what each
does; flag destructive ops with `Safety`/`Callout`; never use real
credentials, hostnames, or cluster details; state Kubernetes version
assumptions.

## Adding a tool

1. Pure logic → `src/lib/<tool>.ts` (unit-testable, no React).
2. Client UI → `src/components/<tool>-tool.tsx` (`"use client"`).
3. Page → `src/app/tools/<slug>/page.tsx` with honest scope notes (e.g.
   the YAML validator checks syntax, not Kubernetes semantics).
4. Register in `src/data/tools.ts`; add tests under `tests/`.

## Cache Components notes

`cacheComponents` is enabled: `new Date()` and other unstable values
can't run during prerender — compute them in client effects or wrap them
in `'use cache'` (see `SiteFooter` for the pattern). If a build errors
with "unstable value", that's why.

## Design tokens

`src/app/globals.css` — dark navy is the default theme; light mode via
`.light` class (next-themes). Code blocks stay dark in both themes.
Fonts: Inter (sans) + JetBrains Mono.
