# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Payload CMS 3.80 + Next.js 16 (App Router, React 19) application built on the official Payload Website Template, then heavily customized into a **media rating/cataloguing CMS**. Alongside the template's Pages/Posts blog, it manages catalog collections — Albums, Tracks, Books, Comics, Mangas, Shows — plus per-user Reviews, Backlog, and Favorites. Backend (Payload admin + API) and frontend site run in a single Next.js instance. Package manager is **pnpm**; database is **PostgreSQL**.

> Note: `README.md` is the upstream template's README and `docker-compose.yml` still references MongoDB — both are stale for this project (it uses Postgres via `@payloadcms/db-postgres`). `AGENTS.md` and `.cursor/rules/` are large **generic** Payload reference docs, not project-specific rules.

## Commands

```bash
pnpm dev                  # dev server at http://localhost:3000
pnpm build                # production build (runs next-sitemap in postbuild)
pnpm lint / pnpm lint:fix # eslint
pnpm generate:types       # regenerate src/payload-types.ts after ANY schema change
pnpm generate:importmap   # regenerate admin import map after adding/moving custom components
pnpm payload migrate:create   # create a Postgres migration
pnpm payload migrate          # run migrations

# Tests
pnpm test          # int + e2e
pnpm test:int      # vitest, matches tests/int/**/*.int.spec.ts
pnpm test:e2e      # playwright, tests/e2e/**
pnpm vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts   # single int file
pnpm exec playwright test tests/e2e/admin.e2e.spec.ts                    # single e2e file
```

Type-check with `tsc --noEmit`. After editing a collection/field/global you **must** run `generate:types`; after adding or relocating a custom admin component you **must** run `generate:importmap`.

### Postgres schema workflow

The Postgres adapter uses `push: true` in development — schema changes to collections/fields sync automatically to a local DB, no migration needed. For anything pointed at production, generate and run migrations (`migrate:create` → `migrate`) instead, or you risk data loss / out-of-sync schema. Migrations live in `src/migrations/`.

## Architecture

**Config entrypoint:** `src/payload.config.ts` registers all collections, globals (`Header`, `Footer`), the Postgres adapter, Lexical editor (`src/fields/defaultLexical.ts`), and `src/plugins/index.ts`. Admin theme is forced dark; jobs queue is auth'd via `CRON_SECRET` bearer token.

**Roles & access control** (`src/access/`): Users have a single `role` field — `admin | editor | user` (saved to JWT). Reusable access fns: `anyone`, `authenticated`, `authenticatedOrPublished`, `authenticatedOrOwn`, `isAdmin`, `isAdminOrEditor`. Catalog collections are admin/editor-only for all operations; Reviews are user-creatable and readable by owner-or-staff. Payload's Local API bypasses access control by default.

**Collections** (`src/collections/<Name>/index.ts`): Catalog items share a pattern — an `apiSearch` UI field (renders `/components/ApiSearch` to prefill from an external API), `title`, `cover` upload, relationships to `artists`/`authors`/`genres`/`categories`, and `beforeChange` hooks `populatePublishedAt` + `populateType(slug)` + `generateItemSlug(...)`. Slugs are auto-generated (kebab of title, suffixed with creator slug) and read-only. Pages and Posts are the layout-builder/draft-enabled template collections with their own `revalidatePage`/`revalidatePost` hooks.

**Shared hooks** (`src/hooks/`): `populateType`, `populatePublishedAt`, `ensureMediaFolder`, `revalidateRedirects`. Slug utilities live in `src/utilities/` (`generateItemSlug`, `generateReviewSlug`, `toKebabCase`).

### External API integrations (the distinctive part)

`src/utilities/apiSearchConfigs.ts` is the **single source of truth** mapping each catalog collection to an external metadata provider. Each config declares the proxy `apiEndpoint`, how to map API result paths → Payload fields (`fieldMapping`), image fields (`uploadFields`), find-or-create relationships (`relationshipFields`/`manualRelationships`), and display/thumbnail fields. It is consumed by both the admin `ApiSearch` field and the frontend `AddItemSheet` (`src/components/AddItemSheet/`, opened from `src/Header/Nav/`).

Provider proxy routes live in `src/app/api/<provider>/`:
- **deezer** → albums, tracks (`?type=album|track`)
- **hardcover** → books · **anilist** → mangas · **comicvine** → comics · **omdb** → shows
- `resolve-relationship/` — POST endpoint that find-or-creates `artists`/`genres`/`authors` docs by a match field (used when adding items from the frontend)
- `deezer/import-media` — imports cover art into Media

All providers are configured via env-var URLs/keys (see `.env.example`). Each route validates its env var and returns 500 if unconfigured.

**Media / storage:** `Media` collection uploads go to **Cloudinary** via a custom adapter (`src/lib/cloudinaryStorageAdapter.ts`, `src/lib/cloudinary.ts`) wired through `plugin-cloud-storage`; local storage is disabled.

**Frontend** (`src/app/(frontend)/`): one route folder per catalog type (`albums`, `books`, `mangas`, `comics`, `shows`, `tracks`) plus `posts`, `[slug]` pages, `search`, `profile/[name]`, and `next/` (draft preview / seed). `(payload)/` holds the admin panel and Payload REST/GraphQL API. Plugins configured in `src/plugins/index.ts`: cloud-storage, redirects, nested-docs (categories), SEO, search (`src/search/`), form-builder.

## Environment

Copy `.env.example` → `.env`. Required: `DATABASE_URL` (Postgres), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (no trailing slash), `CRON_SECRET`, `PREVIEW_SECRET`, Cloudinary keys, and the provider env vars (`DEEZER_API_ENDPOINT`, `OMDB_API_KEY_URL`, `COMIC_VINE_API_KEY_URL`/`COMIC_VINE_API_KEY`, `ANI_LIST_API_URL`, `HARDCOVER_BEARER_TOKEN`).
