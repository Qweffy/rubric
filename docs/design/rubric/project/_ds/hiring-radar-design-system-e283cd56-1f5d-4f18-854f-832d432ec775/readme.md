# Hiring Radar — Design System

> **Hiring Radar** is a personal mission-control for the job hunt. It ingests the monthly Hacker News *"Ask HN: Who is hiring?"* threads, makes them searchable with hybrid semantic search, and runs an AI agent that shortlists roles against the user's profile. The product is built in **Next.js** — everything here is realistic for the web (HTML/CSS/React), not a fantasy render.

This design system encodes one committed aesthetic: **military radar / mission-control / Bloomberg-terminal-meets-sci-fi.** Dark only. Data-dense but disciplined. Phosphor glow on near-black. The vibe is a command center quietly scanning the job market for you while you sleep — ostentatious in *atmosphere*, restrained in *layout*. The flash comes from glow, motion, and the radar metaphor, never from clutter.

**Sources:** No external codebase or Figma was provided — the system was authored from the written brief (tokens, type, components, and aesthetic direction all specified). If a Next.js implementation exists later, reconcile token names and component props against it.

---

## Hard rules (apply to every screen)
- **No emoji**, ever — as icons or decoration.
- **No gradients** except the specified phosphor glows and the radar's conic sweep.
- **No border-radius above 10px.** No pill-shaped cards or fully-round containers.
- **No default framework palette** (indigo-500, purple-600…) — tokens only.
- **No centered marketing-hero layouts.** This is an instrument, not a landing page.
- **No stock-photo avatars** — the user avatar is an `NM` mono monogram on `--bg-raised`.
- **All numeric data is mono** (JetBrains Mono): salaries, counts, scores, timestamps, ids, codes. Non-negotiable — it's what makes the product read as an instrument.

---

## CONTENT FUNDAMENTALS — how copy is written

**Voice:** terse, technical, mission-control. The product is an instrument reporting back, so copy reads like a readout, not marketing. Confident and quiet.

- **Person:** Address the user as **you** ("…scanning the market while you sleep", "ranks every posting against your profile"). The system refers to itself impersonally ("the agent", "the radar", "last sweep") — never "I".
- **Casing:** Sentence case for body and headings. **UPPERCASE 11px mono** for chrome/section labels only, with `0.14em` tracking — e.g. `SIGNAL FEED`, `LAST SWEEP 06:00 UTC`, `LIVE SCOPE`, `NEXT SWEEP`, `AGENT STATUS`. Status/process tokens are uppercase mono: `NEW`, `REMOTE`, `RUNNING`, `FAILED`, `CRON`.
- **Terminal conventions, used sparingly:** timestamps in UTC (`06:00 UTC`), durations as `5h 12m`, ids as short hex (`id 7f3a91`), key-value readouts in mono (`match=0.92 region=us-remote`).
- **Numbers:** always mono, tabular, with real units (`$210–250K`, `47 new roles`, `312 postings`, `/100`). Use en-dashes for salary ranges.
- **Errors:** plain-language cause, never a stack trace ("Couldn't reach the database"), and always paired with a recovery action ("Retry"). Warnings are matter-of-fact ("Last sweep is 31h old — data may be stale.").
- **Microcopy examples:** "scan postings…" (search placeholder), "Run sweep", "Ask agent to shortlist", "Save to shortlist", "Undo (8s)", "Discard 2 dead letters?", `No matches for "xyz" — Enter to search postings instead`.
- **No emoji. No exclamation-heavy hype.** Vocabulary leans on the radar/signal metaphor: *sweep, signal feed, scope, blip, ingest, shortlist, pipeline.*

---

## VISUAL FOUNDATIONS

**Color & vibe.** Near-black canvas (`--bg-void #06080C`) with a three-step elevation stack (void → surface `#0B1018` → raised `#111826`) and a blurred `--glass` for sticky bars/overlays. One hero accent: **phosphor green `#3DFFA2`** for actions, the radar, and focus. A disciplined signal palette carries meaning, never decoration: **cyan** = links/info, **violet** = everything AI/agent (traces, match scores, AI badges), **amber** = warnings/pending, **red** = errors/destructive. Imagery is essentially absent — the "image" is the **radar scope** and the dot-grid field; everything is cool-toned, luminous, slightly CRT.

**Type.** Three families, strict roles: **Space Grotesk** (600/700, tracking `-0.02em`) for display/headings; **Inter** (400/500) for UI/body; **JetBrains Mono** for *all* data, tags, timestamps, and the uppercase section labels. The mono-everywhere-for-numbers rule is the backbone of the instrument feel.

**Spacing & layout.** 4px base grid. Fixed chrome: 56px topbar, 248px sidebar, 320px right rail. Dense but breathable — generous panel padding (16–20px) against tight control rhythm. Layouts are instrument dashboards (sidebar + feed + scope rail), never centered marketing columns.

**Backgrounds.** A faint **dot-grid** (phosphor at ~4–6%, 24px spacing) over `--bg-void`, plus a **barely-visible horizontal scanline drift** (14s loop). No photographic imagery, no decorative gradients. Apply via `.hr-void`.

**Borders, corners, cards.** 1px borders in `--phosphor-dim` (`rgba(61,255,162,0.16)`); strengthen to `--border-strong` on focus/hover/selected. Radii: **10px cards, 6px controls, 4px small** — hard cap 10px. Cards = `--bg-raised` + 1px border + `--shadow-card` (near-black drop, faint inset top highlight). Glass cards add `backdrop-filter: blur(16px)`.

**Shadows & glow.** Two systems. **Elevation** = soft near-black drops (`--shadow-card`, `--shadow-panel`) — no gray haze. **Glow** = the brand's signature: `--glow-phosphor` (`0 0 24px rgba(61,255,162,0.25)`) on primary interactive elements, `--glow-violet` for AI, `--glow-red` for errors. Glow signals "live/interactive"; elevation signals "stacked".

**Transparency & blur.** Reserved for overlays that float over the radar: the glass topbar, the command palette, toasts, modal/drawer scrims. `--glass` + `blur(16px)`. Don't blur opaque content panels.

**Animation & motion.** Easing `cubic-bezier(0.22,1,0.36,1)` (ease-out), durations 120/200/360ms. Four motion primitives: **radar sweep** (4s linear conic beam), **blip ping** (1.8s scale+fade ripple on new items), **count-up** (600ms on scorecard/gauge mount), **skeleton shimmer** (phosphor-tinted). No bounce, no parallax, no infinite decorative loops on content. **Everything degrades to static under `prefers-reduced-motion`.**

**Hover / focus / press.**
- *Hover:* lighten fill (primary → brighter phosphor + stronger glow); ghost/secondary gain a faint tinted background; rows/cards strengthen their border + add a small phosphor glow.
- *Focus-visible:* phosphor ring, 2px, 2px offset (`--ring`) — always visible, never removed.
- *Press/active:* darken the fill slightly (no shrink/scale on buttons). Toggles slide their glowing knob.

**Accessibility.** Essential text ≥ 4.5:1 on its surface. `--text-mid #93A4B3` is the body floor; `--text-low #5C6B7A` is **decorative only** (11px mono labels) — for readable low-emphasis content use `--text-low-content #6E7E8F`. State is never conveyed by color alone (badges carry text/dots; the gauge carries a number).

---

## ICONOGRAPHY

- **One set, consistent:** Lucide-style **stroke** icons — 1.5px stroke, `currentColor`, **never filled, never emoji**, at 16px (inline/controls) and 20px (nav/standalone). Rounded line caps/joins.
- **Delivery:** the set ships two ways that share identical path data — the React `Icon` component (`components/core/Icon.jsx`, used everywhere in the bundle) and `assets/lucide-icons.js` (`window.HR_ICONS` + `hrIcon(name, size)`) for plain-HTML contexts. Add new glyphs to **both**.
- **Substitution note:** the glyphs are hand-embedded Lucide paths (MIT) rather than a linked package, so the set is the curated subset listed in `Icon.d.ts` (`IconName`). If you need a glyph that isn't there, add the Lucide path to both files — don't swap in a different icon family.
- **Core glyphs:** search, radar, list, bookmark, bot, user, server, settings, play, pause, retry, external-link, copy, kebab, filter, close, check, alert-triangle — plus chevrons, command, map-pin, clock, x-circle, arrow-right, bell, signal, zap, database, info, inbox, sliders.
- **Unicode as icon:** only keycaps (`⌘`, `↵`, `ESC`) inside `Kbd`, set in mono. No other unicode-as-icon, no emoji anywhere.
- **Logo:** `assets/logo.svg` (radar mark + wordmark, "Radar" in phosphor) and `assets/logomark.svg` (mark only). Clear-space = mark height.

### Illustration pack — the ONLY illustrations allowed
`assets/illustrations/` holds 14 self-contained, stroke-based radar/blueprint SVGs (hardcoded system hex, embedded phosphor-glow filters, 1.5px stroke — favicon 2.5px). **These are the only illustrations permitted in screens — never draw new ones or pull from an illustration library.** Reference by name via `<img src="assets/illustrations/<name>.svg">` or inline. Showcase: `SVG Asset Pack.html`.
- **Identity:** `mark` (64px logo glyph), `favicon` (16–24px), `wordmark` (mark + "hiring-radar").
- **Empty / idle:** `empty-radar` (radar quiet), `lonely-blip` (shortlist empty), `agent-orb-idle` / `agent-orb-active` (violet agent avatar), `flatline-calibration` (profile empty), `clean-signal` (dead-letters empty, all-clear check).
- **Error:** `lost-signal` (full-page error boundary), `off-the-grid` (404), `static-interference` (compact ~96px inline error band).
- **Utility sprites:** `blip-sprite` (radar blip + ping), `loading-sweep` (the app spinner — rotate via CSS). Animate sprites at the usage site and honor `prefers-reduced-motion`.

---

## INDEX — what's in this system

**Foundation**
- `styles.css` — the single entry point consumers link (import list only).
- `tokens/colors.css` · `typography.css` · `spacing.css` · `effects.css` · `base.css` — CSS custom properties + the dot-grid/scanline texture. Fonts load via Google Fonts `@import` in `typography.css`.
- `assets/` — `logo.svg`, `logomark.svg`, `lucide-icons.js`, and `illustrations/` (the 14-asset radar/blueprint SVG pack — the only illustrations allowed; see ICONOGRAPHY).

**Components** (React, in `window.HiringRadarDesignSystem_e283cd`; each has `.jsx` + `.d.ts` + a directory `*.card.html`)
- `components/core/` — Icon, Spinner, Button, IconButton, Kbd, SectionLabel, Card
- `components/forms/` — Input, SearchInput, Select, RangeSlider, Toggle
- `components/navigation/` — Tabs, SegmentedControl, ProgressLine
- `components/data/` — Tag, StatusBadge, MatchBadge, ScoreGauge, Sparkline, Scorecard, JobRow
- `components/feedback/` — Toast, Banner, Skeleton, EmptyState (+ `HRIllustration`), ErrorState, Tooltip
- `components/overlay/` — Menu, Modal, ConfirmModal, Drawer, CommandPalette

**Specimen cards** (`guidelines/*.card.html`) — Colors (surfaces, accents, text/match), Type (display, body, mono), Spacing (scale, radii, glows), Brand (logo, radar motif, texture & motion). These populate the Design System tab.

**Illustration pack** — `SVG Asset Pack.html` (+ `assets/illustrations/*.svg`): the 14 canonical radar/blueprint SVGs. The only illustrations allowed in screens.

**Style guide** — `Style Guide.html` (+ `styleguide.jsx`): one scrollable page with the radar hero, every component in its states, and the copyable `:root` token block + Google Fonts import at the end.

**UI kit** — `ui_kits/hiring-radar/` (`index.html`, `MissionControl.jsx`, `RadarScope.jsx`): the live mission-control screen.

**Skill** — `SKILL.md` (Agent-Skill compatible).

> The compiler auto-generates `_ds_bundle.js`, `_ds_manifest.json`, and `_adherence.oxlintrc.json` — never edit those by hand.
