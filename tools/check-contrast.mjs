#!/usr/bin/env node
/* Ink contrast gate. Four variants: Paper and Night, each softened (the
   default) and at the full range (.ink-full).

   The floors are higher than WCAG AA on purpose: words are for everyone,
   in any light and with any eyes. All text owes 7:1 (AAA). The edge of a control
   and the focus ring owe 4.5:1, not 3:1. Idle marks owe 3:1.

   Every color in Ink is an opaque gray level (check-stillness.mjs), so there
   is nothing to composite: a ratio here is the ratio drawn. */

import { readTokens } from './lib/css-tokens.mjs';
import { parseHex, contrast, resolve } from './lib/color.mjs';

const TEXT = 7.0, CONTROL = 4.5, MARK = 3.0;
const MAX_LEVELS = 6;

const VARIANTS = {
  'paper':       ['paper.css'],
  'paper-full': ['paper.css', 'paper-full.css'],
  'night':         ['night.css'],
  'night-full': ['night.css', 'night-full.css'],
};
const GROUNDS = ['--surface-canvas', '--surface-raised', '--surface-sunk'];
const INK = ['--text-heading', '--text-body', '--text-secondary'];
const PAIRS = [
  ['--text-inverse', '--surface-inverse', TEXT, 'primary button and inverse text'],
  ['--on-selected', '--selected-fill', TEXT, 'pressed and selected'],
];

const rows = [], fails = [];
const check = (v, a, b, ca, cb, floor, why) => {
  const r = contrast(ca, cb);
  rows.push([v, a, b, r, floor]);
  if (r < floor) fails.push(`${v}  ${a} on ${b}  ${r.toFixed(2)}:1  needs ${floor}  (${why})`);
};

for (const [variant, files] of Object.entries(VARIANTS)) {
  const t = readTokens(['src/tokens/shared.css', ...files.map((f) => `src/tokens/${f}`)]);
  const get = (n) => {
    const v = parseHex(resolve(t, t.get(n)));
    if (!v) { fails.push(`${variant}  ${n} does not resolve to a color`); return parseHex('#888888'); }
    return v;
  };

  for (const g of GROUNDS) for (const i of INK) check(variant, i, g, get(i), get(g), TEXT, 'text, AAA');
  for (const [a, b, floor, why] of PAIRS) check(variant, a, b, get(a), get(b), floor, why);
  for (const g of GROUNDS) for (const n of ['--border-control', '--focus-ring']) check(variant, n, g, get(n), get(g), CONTROL, 'control edge and focus');
  for (const g of GROUNDS) check(variant, '--mark-muted', g, get('--mark-muted'), get(g), MARK, 'idle marks, 1.4.11');

  /* The extremes. By default, Ahimsa's law: no pure white to glare, no
     pure black to smear. At the full range, the whole of it, by design. */
  const sum = (c) => c.r + c.g + c.b;
  const ground = get('--ground'), ink = get('--ink');
  const ends = [sum(ground), sum(ink)].sort((a, b) => a - b);
  if (variant.endsWith('-full')) {
    if (ends[0] !== 0 || ends[1] !== 765) fails.push(`${variant}  ground and ink must be the full range (#000000 and #ffffff)`);
  } else if (ends[0] === 0 || ends[1] === 765) {
    fails.push(`${variant}  ground or ink is pure black or pure white by default`);
  }

  /* Few levels. The fewer grays a view uses, the closer a fast two- or
     four-level update comes to the finished image. */
  const used = new Set([...GROUNDS, ...INK, '--text-inverse', '--mark-muted', '--rule', '--border-control'].map((n) => resolve(t, t.get(n))));
  if (used.size > MAX_LEVELS) fails.push(`${variant}  semantic tokens use ${used.size} gray levels; keep it to ${MAX_LEVELS}`);
  rows.push([variant, 'levels in use', [...used].join(' '), used.size, MAX_LEVELS]);
}

if (process.argv.includes('--report')) {
  for (const [v, a, b, r, f] of rows) console.log(`${v.padEnd(12)}${a.padEnd(20)}${String(b).padEnd(36)}${typeof r === 'number' ? r.toFixed(2).padStart(6) : r}  ${f}`);
  console.log('');
}
if (fails.length) {
  console.error(`FAIL — ${fails.length} contrast violation(s):`);
  for (const f of fails) console.error(`   ${f}`);
  process.exit(1);
}
console.log(`OK — ${rows.length - 4} contrast pairs pass for Paper and Night, softened and at the full range.`);
