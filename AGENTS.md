# Working in Ink

A calm design system for reading: tokens, a framework-free CSS component
layer, drawn icons and a documentation site. No runtime dependencies, and it
must keep none. The site is served by GitHub Pages from `docs/` at
<https://ink-design.riverma.com>.

```bash
npm run build && npm run check
```

Generated, never hand-edited: `dist/*`, `docs/*.html`, `docs/ink.css`,
`docs/fonts/*`, `docs/themer-fonts.css`, `docs/themer-fonts/*` and `SKILL.md`. `SKILL.md` and `docs/agents.html` are built
from the same constants in `tools/build-docs.mjs`, so they cannot drift.
Edit `src/`, `fonts/` and `tools/build-docs.mjs`. `docs/site.css`,
`docs/site.js` and `docs/themer.js` are hand-written.

The themer's candidate fonts live in `themer/fonts/`, described by
`themer/fonts.json` (weights and optical sizing). They serve the
docs only and are not part of the system.

## Voice and content

The sample text is Thoreau's *Walden* (1854, public domain). Describe Ink
in its own terms (ink on paper, stillness, the printed book, attention left
free), not as a system for any kind of device, and name no device brands.

## The four gates

- **`check-stillness.mjs`** keeps the page still, flat ink. Every color in `src/`
  and the docs must be one of the sixteen gray levels, and opaque. It fails
  on transitions, animation, keyframes, smooth scroll, gradients, shadows,
  filters, partial opacity, `:hover` and font weights below 400.
- **`check-contrast.mjs`** covers Paper and Night, softened and at the full
  range. Text must reach 7:1, control edges and focus 4.5:1, and idle marks
  3:1. By default there is no pure black or white; with `.ink-full` the
  full range is required. Each mode may use at most six levels.
- **`check-attention.mjs`** and **`check-offline.mjs`** are inherited from
  [Ahimsa](https://ahimsa-design.riverma.com).

If a gate fails, fix the thing, not the gate. If the gate is wrong, fix it
and prove it still catches a planted violation.

## Rules that are not style preferences

- **Sixteen grays, through semantic tokens.** Components never name a
  `--gray-*` level.
- **Nothing moves.** There are no motion tokens. Change state in one step.
- **Pages, not scroll.** Long content uses `.ink-page` and `.ink-pager` with
  the count in view, and ends with `.ink-end`.
- **A press is two-level.** Pressed and selected states are a pure inversion.
- **Meaning never rests on gray alone.** Use words first, then shape, fill or
  a dashed border.
- From [Ahimsa](https://ahimsa-design.riverma.com): no red or danger token; nothing appears unasked; corners
  stay rounded; no network loads.
- **No emoji.** Use the icons in `src/icons/`, or draw a new one the same way:
  a 24-unit grid, a 2-unit `currentColor` stroke on whole coordinates,
  round caps and joins, symmetric unless the object is not.

## Releases

Semantic versioning. The project is at `0.x` while the design settles, and
`v1.0.0` is the first stable release. Patch for a fix, minor for a feature,
major for a breaking change; moving a token's value is breaking. Keep
`package.json` and `CHANGELOG.md` in step (the docs footer reads
`package.json`).

Never push without an explicit go-ahead. Share screenshots of visual
changes first, and review the diff for secrets before any push. Commit
messages are plain, with no AI attribution trailers.
