# CLAW HANDOFF — JellyTunes quality campaign

Status as of this document. Read this before touching anything.
Everything below is verified by running it, not assumed.

## Done and pushed (do not redo)

1. **Repo is fully green.** `pnpm typecheck`, `pnpm lint-code`
   (max-warnings 0), and `pnpm lint-styles` all pass. Keep them
   passing — run `pnpm lint` before every push.
2. **use-metadata-settings hook** is state-backed now. It previously
   wrote localStorage without touching React state (stale UI).
3. **CSS module convention**: kebab-case class names, accessed as
   `styles['kebab-name']`. The three camelCase modules from the
   enrichment/smart-playlist features were converted. Follow the
   convention for new CSS.
4. **Bundle splitting** (web + remote vite configs): function-based
   `manualChunks` buckets all of node_modules into vendor-react /
   vendor-ui / vendor-data / vendor-i18n / vendor-media /
   vendor-japanese / vendor-visualizer / vendor-misc. Entry chunk
   went 2,792KB → 1,364KB.
5. **Locales are lazy.** Only `en` is bundled (fallback). The other
   36 load via `import.meta.glob` + a tiny i18next backend in
   `src/i18n/i18n.ts` (`partialBundledLanguages: true`). Do NOT
   reintroduce static locale imports.
6. **MusicBrainz client**: requests serialize through a promise
   mutex (hard 1 req/sec upstream limit) and all search inputs go
   through `escapeLucene()`. Reuse both patterns for any new
   metadata source.

## Build notes (save yourself an hour)

- pnpm ≥ 10 required (`pnpm-workspace.yaml` uses v10 fields).
- Full builds with sourcemaps need ~5GB free RAM. In small
  containers: `vite build --sourcemap false` for verification, but
  NEVER commit `sourcemap: false` — repo config keeps them on.
- If a build OOMs, kill leftover node processes before retrying;
  they hold memory and cascade-fail the next build.
- `ELECTRON_SKIP_BINARY_DOWNLOAD=1` for CI-style builds without the
  Electron binary.

## Prioritized roadmap (in order — highest user impact first)

1. **Shrink the 1.36MB app chunk further.** Routes are already
   `lazy()`; the remaining weight is shared feature code pulled in
   through barrel imports. Find the offenders with
   `npx vite-bundle-visualizer` and break the import chains —
   likely suspects: `src/renderer/features/*/index.ts` barrels
   re-exporting everything, and settings screens imported eagerly
   from the shell. Target: < 800KB entry.
2. **Perceived-speed polish (the actual 'Apple Music feel'):**
   skeleton states on Home/for-you/album grid while queries load
   (skeleton component already exists in shared/components),
   blur-hash or dominant-color placeholders behind artwork
   (fast-average-color is already a dep), and prefetch route
   chunks on nav-item hover (`router` supports it).
3. **Enrichment UX gaps:** the for-you and artist-bio panels have
   no loading or error states — a failed Last.fm call renders
   blank space. Add skeleton + a quiet retry affordance. API keys
   are read per-call; validate once on save in the settings panel
   and surface "key invalid" there, not as silent failures.
4. **Smart playlist queries** (`for-you` switch): 'decade' and
   'random-mix' both fetch with limit only — no server-side random
   seed, so "random" is identical every visit. Jellyfin supports
   `sortBy: Random` with a seed; use it.
5. **Virtualize the for-you horizontal rows** if row count grows;
   react-window is already a dep.
6. **i18n followup:** changing language now fetches on demand —
   add a 300ms spinner on the language select while the chunk
   loads (currently instant-swap assumption).

## Rules that keep the repo healthy

- One logical change per commit, imperative subject, body explains
  the WHY and the user-visible symptom.
- Never push with lint/typecheck failing — 'green stays green'.
- Data-safety bar applies here too: no destructive migrations of
  user settings/localStorage without a fallback read of the old
  shape.
