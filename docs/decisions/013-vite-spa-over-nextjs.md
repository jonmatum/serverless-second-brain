# ADR-013: Vite SPA over Next.js Static Export

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #24, ADR-011 (CloudFront + S3 static hosting)

## Context

The frontend was built with Next.js using `output: "export"` for static generation, deployed to CloudFront + S3 (ADR-011). After adding Cognito auth, a capture form, shadcn/ui, and mobile-first responsive design, several friction points emerged:

1. **Every page is `"use client"`** — no server components, no SSR, no ISR. The app is a pure client-side SPA that happens to use Next.js.
2. **Build cache corruption** — `.next` cache frequently corrupts during development, requiring `rm -rf .next out node_modules/.cache` before builds. This caused multiple failed deploys.
3. **Environment variable fragility** — `NEXT_PUBLIC_*` vars are inlined at build time. A build without the correct env vars produces a broken app with empty API URLs. This caused a production outage where the deployed app couldn't fetch data (`"<!DOCTYPE" is not valid JSON`).
4. **Hydration mismatches** — `PrefsProvider` returns `null` until mounted (to prevent theme flash), causing SSR/client tree mismatches. Browser extensions (Grammarly) inject attributes that trigger React hydration warnings.
5. **Static export limitations** — `useRouter` from `next/navigation` doesn't work reliably in static export. The OAuth callback page had to use `window.location.replace()` instead.
6. **Unnecessary complexity** — Next.js adds ~100KB of framework JS (router, prefetching, RSC runtime) that provides no value for a pure SPA.

## Decision

Replace Next.js with Vite + React Router for the frontend SPA.

### What changes

| Aspect | Next.js | Vite |
|---|---|---|
| Build tool | `npx next build` | `vite build` |
| Output | `out/` | `dist/` |
| Routing | File-based (`app/` dir) | Explicit routes (`react-router-dom`) |
| Links | `next/link` | `react-router-dom` `<Link>` |
| Navigation | `next/navigation` | `react-router-dom` hooks |
| Env vars | `NEXT_PUBLIC_*` | `VITE_*` via `import.meta.env` |
| Layout | `layout.tsx` + `page.tsx` | `App.tsx` + `<Outlet>` |
| SSR | Static export (unused SSR) | None (pure SPA) |
| Font loading | `geist/font/sans` (Next.js specific) | CSS `@font-face` or npm import |

### What stays the same

- All React components (shell, badges, filters, node-card, force-graph, prefs-menu)
- shadcn/ui components (Tailwind + base-ui primitives — framework agnostic)
- `lib/api.ts`, `lib/auth.tsx`, `lib/prefs.tsx`, `lib/i18n.ts`
- `globals.css`, Tailwind config, all styling
- D3 force-directed graph
- Deploy target: S3 + CloudFront (ADR-011 unchanged)
- Deploy script: `aws s3 sync dist/ s3://bucket/ --delete` + CloudFront invalidation

### SPA routing on CloudFront

CloudFront is already configured to return `index.html` for 403/404 errors with `ErrorCachingMinTTL: 0`. This is the standard SPA fallback pattern — no changes needed.

## Consequences

### Positive

- No hydration — eliminates all SSR/client mismatch issues
- No `.next` cache — eliminates build corruption
- Faster builds (~2s vs ~5s)
- Smaller bundle — no Next.js router, RSC runtime, or prefetching overhead
- Simpler mental model — what you write is what runs in the browser
- `import.meta.env.VITE_*` is standard Vite — well-documented, no surprises
- HMR is faster in development

### Negative

- Lose file-based routing (12 routes — trivial to define explicitly)
- Lose automatic code splitting per route (Vite `React.lazy` achieves the same)
- If we ever need SSR or ISR, we'd need to migrate back (unlikely — this is a personal SPA)
- One-time migration effort (~30 minutes, mechanical find-and-replace)

### Neutral

- SEO is irrelevant — this is a personal tool behind auth, not a public content site
- No impact on API, infrastructure, or backend

## Alternatives considered

1. **Keep Next.js, fix issues** — Possible but fighting the framework. Every fix (cache clearing, hydration suppression, static export workarounds) adds complexity for zero benefit.
2. **Remix** — Good framework but also SSR-focused. Same mismatch for a pure SPA.
3. **Astro** — Good for content sites but adds unnecessary abstraction for a React SPA.

## References

- ADR-011: CloudFront + S3 static hosting
- [Vite documentation](https://vite.dev/)
- [React Router v7](https://reactrouter.com/)
