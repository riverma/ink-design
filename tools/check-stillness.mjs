#!/usr/bin/env node
/* The stillness gate: ink on paper, and nothing that asks for the eye.

   Ink is sixteen grays, flat ink and a page that holds still. Every rule
   below keeps one of those true. A principle nobody checks is a
   preference, so this checks them, in the system's CSS and icons and in
   the docs site's own CSS and inline styles.

   - Every color is one of the sixteen levels, and opaque.
   - Nothing moves: no transition, animation, keyframes or smooth scroll.
   - Nothing is soft: no gradient, shadow, blur, filter or partial opacity.
   - Nothing depends on hover: touch has none, and many readers never point.
   - Nothing is thin: no font weight below 400. */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'docs'];
const EXT = new Set(['.css', '.svg', '.html']);

const LEVEL = (hex) => {
  let s = hex.slice(1).toLowerCase();
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  if (s.length !== 6) return false;                      /* 4 or 8 digits carry alpha */
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  return r === g && g === b && r % 17 === 0;
};

const RULES = [
  [/(^|[^\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\(/i, 'a computed color — name a gray level instead'],
  [/(linear|radial|conic)-gradient\(/i,              'a gradient — ink on paper is flat'],
  [/(^|[;{\s])(transition|animation)(-[a-z-]+)?\s*:/i, 'motion — it pulls the eye on its own schedule'],
  [/@keyframes/i,                                     'keyframes — nothing in Ink moves'],
  [/scroll-behavior\s*:\s*smooth/i,                   'smooth scroll — motion the reader did not ask to watch'],
  [/(box|text)-shadow\s*:\s*(?!none\b)/i,             'a shadow — it makes one thing louder than its neighbors'],
  [/(^|[;{\s])(backdrop-)?filter\s*:\s*(?!none\b)/i,  'a filter — blur and opacity land between levels'],
  [/(^|[;{\s])opacity\s*:\s*0?\.\d/i,                 'partial opacity — it composites to an off-level gray'],
  [/:hover\b/,                                         'a hover state — it hides things from readers who never point'],
  [/font-weight\s*:\s*[1-3]\d\d\b(?!\s+\d)/i,                   'a thin weight — strokes under 400 fade at sixteen levels'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(p))) out.push(p);
  }
  return out;
}

/* What counts as styling in each kind of file. CSS: everything outside
   comments. SVG: everything outside comments. HTML: only <style> blocks
   and style="" attributes; prose that names a refused thing is not a use
   of it, and <code> examples are quotations. */
function styling(src, ext) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  if (ext === '.css') return src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (ext === '.svg') return src.replace(/<!--[\s\S]*?-->/g, blank);
  let out = src.replace(/[^\n]/g, ' ').split('');
  const keep = (re) => {
    for (const m of src.matchAll(re)) {
      const start = m.index + m[0].indexOf(m[1]);
      for (let i = 0; i < m[1].length; i++) out[start + i] = m[1][i];
    }
  };
  keep(/<style[^>]*>([\s\S]*?)<\/style>/g);
  keep(/\sstyle="([^"]*)"/g);
  return out.join('');
}

const files = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
const fails = [];

for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  const code = styling(raw, extname(f));
  const rawLines = raw.split('\n');
  code.split('\n').forEach((line, i) => {
    const where = `${f}:${i + 1}`;
    const quote = (rawLines[i] || '').trim().slice(0, 100);
    for (const [re, why] of RULES) if (re.test(line)) fails.push(`${where}  ${why}\n      ${quote}`);
    /* Hex colors. A data-URI mask spells # as %23; masks only use alpha,
       but they are checked too, so nothing slips in that way. */
    for (const m of line.matchAll(/(#|%23)([0-9a-fA-F]{3,8})\b/g)) {
      if (!LEVEL(`#${m[2]}`)) fails.push(`${where}  #${m[2]} is not one of the sixteen gray levels\n      ${quote}`);
    }
    /* Named colors, other than "no color" and forced-colors system colors. */
    for (const m of line.matchAll(/(?:color|background|fill|stroke|border[a-z-]*|outline)\s*[:=]\s*["']?([a-z]+)\b/gi)) {
      const v = m[1].toLowerCase();
      if (['white', 'black', 'gray', 'grey', 'silver', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink'].includes(v)) {
        fails.push(`${where}  the named color "${v}" — name a gray level token instead\n      ${quote}`);
      }
    }
  });
}

console.log(`scanned ${files.length} files`);
if (fails.length) {
  console.error(`\nFAIL — ${fails.length} thing(s) that are not still, flat ink:`);
  for (const f of fails) console.error(`   ${f}`);
  process.exit(1);
}
console.log('OK — sixteen levels, nothing moving, nothing soft, nothing hovering.');
