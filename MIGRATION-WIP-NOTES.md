# WIP: Migration to shared `saas-infrastructure` package

**Status: paused, incomplete, low priority.**

This branch (`wip/saas-infrastructure-migration`) captures an in-progress attempt
to migrate matside onto the `@saas-infra/*` shared packages (auth, billing,
admin-kit, support, ui, utils, content) via `vendor/saas-infrastructure/`,
wired up as a pnpm workspace (see `pnpm-workspace.yaml`).

## What's here

- A full vendored copy of `saas-infrastructure`, including its own example
  products (`product-one`, `product-template`) and CI workflows
  (`vendor/saas-infrastructure/.github/`) — those workflows are **not**
  active for matside; only the root `.github/` workflows run in this repo.
- `package.json` / `pnpm-workspace.yaml` updated to link the `@saas-infra/*`
  packages as workspace dependencies.
- Some matside feature work from the same period that got bundled into the
  same uncommitted pile (pairing-v2 algorithm work, guides pages, deploy
  config) — this is unrelated to the saas-infrastructure migration itself,
  it just hadn't been committed yet either.

## Why it's paused

Not a priority right now. The migration was never finished or verified —
treat anything here as **unverified WIP**, not working code. Before resuming:

1. Confirm the app still builds and the existing matside pages actually
   render correctly against the linked `@saas-infra/*` packages (this was
   never checked before work stopped).
2. Decide whether matside should own its custom auth/team-context logic
   (`src/contexts/TeamContext.tsx`, `src/contexts/UserContext.tsx`) or
   replace it with `@saas-infra/auth` — right now both exist side by side.
3. Re-run the full test suite and a manual smoke test before merging
   anything here into `main`.

## Housekeeping already done on this branch (2026-07-08)

- Removed a hardcoded Supabase `service_role` key that was committed in
  `scripts/uat-generate-pairings.mjs` — it now reads
  `SUPABASE_SERVICE_ROLE_KEY` from the environment instead. That key
  belongs to matside's Cloud project (`acxydgdrrmvhzfhhulat`) and should be
  rotated in the Supabase dashboard if that hasn't happened yet.
- Removed two Playwright storage-state files
  (`vendor/saas-infrastructure/products/product-one/.auth/{admin,user}.json`)
  that contained a live `refresh_token` for two test accounts on the
  `saas-infrastucture` Supabase project (`tpfyezfosamfuswfkwjt`). Those
  sessions were revoked directly in the database. Added `.auth/` and
  `test-results/`/`playwright-report/` to `.gitignore` so these don't get
  re-added by running the vendored E2E tests.
