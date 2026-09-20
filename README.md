# Voyage

A vacation planner for two people. You each build your own plan for a trip, then
curate the parts you both want into a shared **Final** plan — while a running
projection of your travel fund tells you whether you can actually afford it by
the date you're leaving.

Live at **https://guttff.github.io/voyage/**

Built from prototypes designed in Claude Design, kept in `project/` for
reference. The design conversation behind them is deliberately not published
here.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve the build on :4173
npm test           # browser smoke test — needs a running preview on :4173
```

`npm test` drives a real Chromium through 23 flows (add/copy/import/export,
budget projection, photos, persistence). It needs Playwright's browser; in a
sandbox that already has one, point at it with
`PLAYWRIGHT_EXECUTABLE=/path/to/chrome`.

## Deploying

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The workflow enables Pages itself through
`actions/configure-pages`, so there's nothing to set up by hand.

`vite.config.ts` uses a relative `base`, so the site works at any path — no
config change if the repo is ever renamed.

## What it does

**Trips** — each trip holds a Final plan plus one option per traveler. Add more
options at will; delete any but Final.

**Itinerary** — a per-day timeline for the selected plan. Every item carries a
category, optional time, note, cost, and who added it. Items copied from another
option keep a trail (“Sarah · from Option 2”).

**Compare** — every option side by side, aligned by day, with one-click *→ Final*
and an *in Final* badge on anything already merged.

**Import / Export** — the point of the whole thing. Export any plan as JSON, or
paste JSON in to create a new option or merge into an existing one. The importer
is deliberately forgiving: it accepts `day` or `date`, `items` or `itinerary` or
a bare array, `title`/`name`, `cost`/`price` (including `"$1,200"`), and maps
category synonyms (`lodging` → Hotel, `excursion` → Activities). Anything it
can't place goes to Activities on a day inside the trip, and it tells you how
many it moved. There's a copy-ready ChatGPT prompt that asks for exactly this
schema.

**Budget** — contributions land every 2 weeks, split between you. A rule has a
start date, so you can schedule *"from March we each put in $600"* and watch the
12-month projection change without anything changing today. Each trip is charged
in full in its start month, at the Final cost (or the priciest option while
Final is empty), and every trip gets a covered / short verdict.

**Settings** — names, photos, a full JSON backup (trips, options, rules and
photos), restore, and reset to the sample set.

## How it's built

React 18 + TypeScript + Vite, no UI framework. The Industry design system from
the handoff is used as-is (`src/styles/industry.css`, copied verbatim) — the
blueprint frames, tonal ramps and Barlow / Barlow Condensed type are all from
there. Layout that was inline in the prototype stayed inline, so the two can be
diffed by eye.

```
src/
  lib/          pure logic — no React
    budget.ts     the fund simulation (contributions vs trips, month by month)
    importExport.ts  the JSON schema in both directions
    format.ts     money + local-date helpers
    seed.ts       the sample data the design was drawn around
    storage.ts    localStorage (model) + IndexedDB (photos)
  state/        store (data) and ui (route, panels) contexts, derive.ts view models
  components/   Sidebar, ImageSlot, Dialog, Avatar, panels/
  pages/        Home, Trips, TripDetail (+ trip/ tabs), Budget, Settings
```

### Notes on what changed from the prototype

- **Photos.** The prototype's `<image-slot>` persisted drops into a sidecar file
  owned by the design tool. Here a drop is downscaled to a 1600px long edge,
  re-encoded as JPEG and kept in IndexedDB, keyed by slot id — so the same photo
  shows in the sidebar, on plan cards and in the backup. `image-slot.js` and
  `support.js` are not used at runtime.
- **Dates.** The prototype derived "today" through `toISOString()`, which lands
  on the previous day for anyone east of UTC. `src/lib/format.ts` uses the local
  calendar date instead.
- **Guards.** An empty contribution-rule list, a trip with no options and a
  missing second traveler no longer throw.

### Known limits

- Data lives in this browser only. Two people planning together means passing a
  backup file between you — there's no server and no sync. That's the single
  biggest thing to add next.
- The contribution cadence is fixed at 2 weeks; the amounts are configurable.
- Costs are whole-trip USD; there's no per-person split or currency conversion.
- The sample data is pinned to the dates the design was drawn with (Nov 2026
  onward), so "Reset to sample data" will look dated eventually.
