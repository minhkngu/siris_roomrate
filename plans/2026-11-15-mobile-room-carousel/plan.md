# Mobile Room Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On phones (<640px), show a property's room cards as a horizontal, snap-scrolling row with a "Phòng 2 / 8" counter; swiping on a photo still changes the photo.

**Architecture:** A new `RoomCarousel` component wraps the existing `RoomCard`s. Below `sm` it is a native horizontal scroll container with CSS scroll-snap; from `sm` up it renders the current grid unchanged. `RoomCard`'s photo area gets `touch-action: pan-y` so a horizontal swipe there never scrolls the row and only drives the photo carousel.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite. No test runner in the repo: verification is `npm run lint` (tsc), `npm run build`, and a Playwright script run against the dev server with mocked Supabase/Cloudinary.

**Spec:** `plans/2026-11-15-mobile-room-carousel/design.md`

## Global Constraints

- Mobile behaviour only below Tailwind `sm` (640px); `sm` and up keep `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8` exactly as today.
- Card width on mobile: `88%` of the row, so the next card peeks.
- Counter copy: `Phòng {i} / {n}` (vi), `Room {i} / {n}` (en); hidden on `sm`+ and when `n <= 1`.
- Room card content and desktop layout must not change.
- No new npm dependencies.

## Review Focus

1. Horizontal swipe on a photo → changes photo, row does not move (`touch-action: pan-y` on the photo area) — asserted in Task 1.
2. Switching property tab → row jumps back to room 1, counter reads `1 / n` — asserted in Task 2.
3. Property with a single room → no counter, card still full-width-ish, no horizontal overflow — asserted in Task 2.
4. Viewport ≥640px → grid, no horizontal scroll, counter hidden — asserted in Task 2.
5. Language switch → stays on the same room index (reset is keyed on property id only) — asserted in Task 2.

---

### Task 1: Verification harness + photo area claims vertical-only panning

**Files:**
- Create (not committed, scratchpad): `$SCRATCH/verify-carousel.mjs` where `$SCRATCH` is the session scratchpad
- Modify: `src/components/RoomCard.tsx` (the carousel `div ref={containerRef}` className)

**Interfaces:**
- Produces: `verify-carousel.mjs` — Node script using the preinstalled `playwright`; takes base URL as argv[2] (default `http://localhost:3000`); exits non-zero on the first failed check, printing `FAIL: <name>`; prints `PASS: <name>` per check. Task 2 appends its checks to the same script.
- Produces: photo container carries Tailwind class `touch-pan-y`.

- [ ] **Step 1: Install deps and start the dev server with fake credentials**

Run: `npm install` then (background) `VITE_SUPABASE_URL=http://mock.supabase.test VITE_SUPABASE_ANON_KEY=test npm run dev`
Expected: Vite prints `Local: http://localhost:3000/`.

- [ ] **Step 2: Write the harness**

Mocks, via `page.route`:
- `http://mock.supabase.test/rest/v1/branches*` → `[{id:'b1',name:'Cơ sở 1',tag:'B1',address:'1 A St'},{id:'b2',name:'Cơ sở 2',tag:'B2',address:'2 B St'}]`
- `.../room_types*` → 5 rooms with `branch_id:'b1'` (ids r1–r5, distinct `weekday_price` 100000…500000, `tag` T1–T5, `sqm` 25) and 1 room `branch_id:'b2'` (id r6)
- `.../stay_discounts*`, `.../settings*`, `.../date_adjustments*` → `[]`
- `https://res.cloudinary.com/**/image/list/*.json` → `{resources:[{public_id:'a',version:1,format:'png'},{public_id:'b',version:1,format:'png'},{public_id:'c',version:1,format:'png'}]}`
- `https://res.cloudinary.com/**/image/upload/**` → 1×1 PNG
- block `**/maps/**` and any other external host with an empty 200.

Context: `viewport {width:390,height:844}, hasTouch:true, isMobile:true`. Wait for `article` to appear.

Check `photo-pan-y`: `getComputedStyle` of the first `article`'s first child `div` → `touchAction === 'pan-y'`.

- [ ] **Step 3: Run it to verify it fails**

Run: `node $SCRATCH/verify-carousel.mjs`
Expected: `FAIL: photo-pan-y` (computed value is `auto`).

- [ ] **Step 4: Add `touch-pan-y` to the photo container className in `RoomCard.tsx`**

- [ ] **Step 5: Run harness, lint**

Run: `node $SCRATCH/verify-carousel.mjs && npm run lint`
Expected: `PASS: photo-pan-y`, tsc exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/RoomCard.tsx
git commit -m "Keep horizontal swipes on room photos inside the photo carousel"
```

### Task 2: RoomCarousel component and wiring

**Files:**
- Create: `src/components/RoomCarousel.tsx`
- Modify: `src/App.tsx` (replace the `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ...` rooms `div`)
- Modify: `src/translations.ts` (add `room` key to `vi` and `en`)

**Interfaces:**
- Consumes: `RoomCard` unchanged; `t` translations object.
- Produces: `export const RoomCarousel: React.FC<{ resetKey: string; label: string; children: React.ReactNode }>`
  - Renders `<div data-testid="room-row">` that is `flex overflow-x-auto snap-x snap-mandatory scroll-px-4 -mx-4 px-4 gap-4 scrollbar-hide` below `sm` and `sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 items-stretch` from `sm` up.
  - Wraps each child in `<div className="shrink-0 w-[88%] snap-start sm:w-auto">`.
  - Counter `<div data-testid="room-counter" className="sm:hidden ...">{label} {active + 1} / {count}</div>` above the row, right-aligned, only when `count > 1`.
  - Active index = `Math.round(row.scrollLeft / (firstItem.offsetWidth + gapPx))`, updated on the row's `scroll` event (passive), clamped to `[0, count-1]`.
  - When `resetKey` changes: `row.scrollLeft = 0` and active = 0.
- Produces: `translations.vi.room = 'Phòng'`, `translations.en.room = 'Room'`.
- App usage: `<RoomCarousel resetKey={activeFacility} label={t.room}>{filteredRooms.map(... <RoomCard .../>)}</RoomCarousel>`; keep the empty state as is (render the carousel only when `filteredRooms.length > 0`).

- [ ] **Step 1: Append failing checks to the harness**

At 390×844 on `Cơ sở 1` (5 rooms):
- `row-horizontal`: `room-row` has `scrollWidth > clientWidth` and page `document.documentElement.scrollWidth <= 390`.
- `counter-initial`: `room-counter` text is `Phòng 1 / 5`.
- `swipe-row`: set `room-row.scrollLeft` to the 3rd item's `offsetLeft - 16`, dispatch/wait 300ms → counter `Phòng 3 / 5`.
- `lang-keeps-position`: switch language to English via the language selector → counter `Room 3 / 5`.
- `reset-on-property`: click tab `Cơ sở 1`'s sibling `Cơ sở 2`, then back to `Cơ sở 1` → `room-row.scrollLeft === 0` and counter `Room 1 / 5`.
- `single-room`: on `Cơ sở 2` → no `room-counter`, `room-row.scrollWidth <= room-row.clientWidth + 1`.
- `desktop-grid`: new page at 1280×900 → `getComputedStyle(room-row).display === 'grid'`, `room-counter` not visible.

- [ ] **Step 2: Run to verify they fail**

Run: `node $SCRATCH/verify-carousel.mjs`
Expected: `PASS: photo-pan-y`, then `FAIL: row-horizontal` (no `room-row` yet).

- [ ] **Step 3: Implement `RoomCarousel`, add translation keys, wire into `App.tsx`**

- [ ] **Step 4: Run harness, lint, build**

Run: `node $SCRATCH/verify-carousel.mjs && npm run lint && npm run build`
Expected: all 8 checks `PASS`, tsc exits 0, Vite build succeeds.

- [ ] **Step 5: Screenshot for the user**

Take a 390×844 screenshot (deviceScaleFactor 2) of the rooms row to `$SCRATCH/mobile-carousel.png` and send it.

- [ ] **Step 6: Commit**

```bash
git add src/components/RoomCarousel.tsx src/App.tsx src/translations.ts
git commit -m "Show rooms as a horizontal swipe row on mobile"
```
