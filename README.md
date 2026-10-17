# Ink Design System

A calm design system for reading: ink on paper, and nothing else.
**Drawn once, and left alone.** It takes its shape from the printed book:
attention left free, nothing decorative, and margins treated as part of
the page. Its sample text is Thoreau's *Walden*.

| The commitment | So Ink |
| --- | --- |
| Ink on paper, nothing more | uses sixteen gray levels, six per mode |
| Stillness | has no motion at all; a press is an instant inversion of ink and paper |
| A page at a time | pages long content instead of scrolling it, and lets it end |
| Clear in any light | holds all text to 7:1, with a full range of pure paper and ink one class away |
| Nothing asks | never updates itself |

Two modes: **Paper** (dark on light) and **Night** (light on dark). It uses
two typefaces: Lora for reading and Atkinson Hyperlegible Next for the
interface. Its laws come from [Ahimsa](https://ahimsa-design.riverma.com): nothing appears unasked, there is
no red, and nothing is loaded over a network.

Documentation: <https://ink-design.riverma.com>

## Use

```html
<html lang="en" class="ink-paper">  <!-- or ink-night -->
<link rel="stylesheet" href="dist/ink.css">
```

Copy `fonts/` next to the CSS. Add `ink-full` to `<html>` for the full
range of pure paper and pure ink; a display that reports itself as
grayscale gets it by itself.

## Themer

`docs/themer.html` lets you try twelve other OFL typefaces against a page of
*Walden*, and see their sizes, weights, leading and measure in both
modes, then copy the resulting tokens. The candidate fonts live in `themer/fonts/` and are
used only by the docs site; they are not part of the system.

## Develop

```bash
npm run build   # dist/, docs/, SKILL.md
npm run check   # stillness · contrast · attention · offline
npm run serve   # http://127.0.0.1:8175
```

## For agents

`SKILL.md` is the short brief: setup, tokens, classes, icons and rules. The
same content is on `docs/agents.html`.

## License

MIT. Lora and Atkinson Hyperlegible Next are under the SIL Open Font
License 1.1, and their license texts are in `fonts/`.
