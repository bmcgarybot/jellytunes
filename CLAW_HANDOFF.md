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

0. **WIRE IN THE ORPHANED FEATURES — new top priority.** Verified by
   grep: `ForYouSection` (smart-playlists) and `ArtistBioPanel`
   (metadata-enrichment) have ZERO imports outside their own
   directories. Both flagship features are built but never mounted —
   users cannot see them at all. To wire For You:
   a. New route file `src/renderer/features/smart-playlists/routes/
      for-you-route.tsx` rendering ForYouSection; fetch the genre
      list the same way the genre sidebar/list does and pass it in.
   b. Register it lazy() in src/renderer/router/app-router.tsx and
      add the path to the AppRoute enum in src/renderer/router/
      routes.ts, following the exact pattern of HomeRoute.
   c. Sidebar entry next to Home (see sidebar items config in
      features/sidebar) with a sparkles/star icon, label 'For You'.
   d. onPlaylistClick: navigate to the song list route passing the
      params from getSmartPlaylistQuery() — study how album-detail
      navigates to filtered song lists and mirror it. If the song
      list route can't take arbitrary filters via state, add that
      capability rather than building a parallel list.
   e. ArtistBioPanel: mount inside album-artist-detail-route below
      the header; it takes the artist name and uses the metadata
      service. Gate on enrichmentEnabled from useMetadataSettings.
   f. THEN do roadmap item 3 (loading/error states) since the
      panels will finally be user-visible.
   Note: react-query caches 'Random' queries by key — include a
   per-mount seed in the queryKey for random smart playlists or the
   mix never changes between visits.

1. **Shrink the app chunk further (now 1.33MB).** Full-screen
   player is already split (done). I ran the bundle analysis
   (`npx vite-bundle-visualizer -c web.vite.config.ts -t raw-data`)
   — the measured top offenders inside the entry chunk, in KB raw:
   settings.store.ts 83, item-table-list-column 65, en.json 63,
   subsonic-controller 55, player.store 54, item-table-list 52,
   jellyfin-controller 49, table-config 44, playlist-folder-tree 41,
   navidrome-controller 35, navidrome-types 29, controller.ts 26,
   jellyfin-types 26.
   THE BIG WIN (~217KB): all three server controllers ship to every
   user, but a user connects to ONE server type. Refactor
   src/renderer/api/controller.ts to dynamic-import the controller
   for the active server type at connect time. Check every call
   site is already async-safe before switching. Target: < 900KB
   entry after this alone.
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
