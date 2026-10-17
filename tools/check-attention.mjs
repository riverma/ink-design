#!/usr/bin/env node
/* The attention gate (inherited from Ahimsa).
   Ink keeps Ahimsa's rule: nothing appears unasked. A principle nobody checks
   is a preference, so this checks it — across the shipped CSS, the docs
   site, and anything else in the tree.

   The test is not "is it dismissible" but: did the person cause this,
   here, now? */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'docs', 'tools'];
const EXT = new Set(['.css', '.js', '.mjs', '.html', '.svg', '.json', '.md']);

const BANNED = [
  /* Matched as USE, not as mention. This system documents its refusals at
     length, and a page that explains why role="alert" is refused must not
     trip the gate that refuses it. So each pattern below requires the
     surrounding syntax that makes it a real call, a real attribute or a
     real meta tag — and <code> spans are stripped before matching. */
  [/(^|[^\w.])alert\s*\(/,                        'alert() — a modal the person did not open'],
  [/(^|[^\w.])confirm\s*\(/,                      'confirm() — same, and it steals focus'],
  [/window\.prompt\s*\(|(^|[^\w.])prompt\s*\(\s*['"]/, 'prompt() — same'],
  [/addEventListener\s*\(\s*['"]beforeunload|onbeforeunload\s*=/, 'beforeunload — an "are you sure you want to leave" nag'],
  [/new\s+Notification\s*\(|Notification\.requestPermission/, "Notification — a push into someone else's attention"],
  [/\.pushManager\b/,                             'pushManager — push notifications'],
  [/<[^>]*\saria-live\s*=\s*["']assertive/,        'aria-live="assertive" — interrupts a screen-reader user mid-sentence'],
  [/<[^>]*\srole\s*=\s*["']alert["']/,             'role="alert" — same interruption, same harm'],
  [/<(video|audio|iframe)[^>]*\sautoplay/,         'autoplay — media that starts itself'],
  [/<[^>]*\sautofocus[\s/>=]/,                     'autofocus — moves the caret out from under someone on load'],
  [/(^|[^\w.])setInterval\s*\(/,                   'setInterval — something recurring that nobody started'],
  [/<meta[^>]*(maximum-scale|user-scalable\s*=\s*(no|0))/, 'a viewport that disables pinch zoom'],
];

/* The flash/pulse rule: nothing in the ambient layer may run fast enough to
   read as a demand, and nothing may animate position. */
const AMBIENT_MIN_SECONDS = 2; /* Ink ships no ambient layer, and check-stillness.mjs bans animation outright. */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(p))) out.push(p);
  }
  return out;
}

/* Blank out comments while keeping line numbers intact, so that a comment
   explaining WHY something is refused does not read as a use of it. This
   system documents its refusals in the files that implement them, which
   means the gate has to be able to tell prose from code. */
function stripComments(src, ext) {
  const blocks = ext === '.html' || ext === '.svg' || ext === '.md'
    ? [[/<!--/g, '-->']]
    : [[/\/\*/g, '*/']];
  let out = src;
  for (const [open, close] of blocks) {
    let res = '', i = 0;
    for (;;) {
      open.lastIndex = i;
      const m = open.exec(out);
      if (!m) { res += out.slice(i); break; }
      const end = out.indexOf(close, m.index);
      const stop = end === -1 ? out.length : end + close.length;
      res += out.slice(i, m.index);
      /* keep the newlines, drop everything else */
      res += out.slice(m.index, stop).replace(/[^\n]/g, ' ');
      i = stop;
    }
    out = res;
  }
  /* line comments */
  if (ext === '.js' || ext === '.mjs') out = out.replace(/(^|[^:])\/\/.*$/gm, '$1');
  /* <code> spans quote a thing in order to talk about it. Blank the
     contents, keep the newlines. */
  out = out.replace(/<code>[\s\S]*?<\/code>/g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
  if (ext === '.md') out = out.replace(/^\s{0,3}>.*$/gm, '');   /* blockquotes are prose */
  return out;
}

const files = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
const fails = [];

for (const f of files) {
  /* This file names every banned API in order to ban it. */
  if (f.endsWith('check-attention.mjs')) continue;
  const raw = readFileSync(f, 'utf8');
  const code = stripComments(raw, extname(f)).split('\n');
  const rawLines = raw.split('\n');
  code.forEach((line, i) => {
    for (const [re, why] of BANNED) {
      if (re.test(line)) fails.push(`${f}:${i + 1}  ${why}\n      ${(rawLines[i] || '').trim().slice(0, 100)}`);
    }
  });
}

/* Ambient timing */
try {
  const amb = readFileSync('src/ambient/ambient.css', 'utf8');
  for (const m of amb.matchAll(/animation:[^;]*?([\d.]+)s/g)) {
    if (parseFloat(m[1]) < AMBIENT_MIN_SECONDS) {
      fails.push(`src/ambient/ambient.css  ambient animation runs in ${m[1]}s; minimum is ${AMBIENT_MIN_SECONDS}s (WCAG 2.3.1, and anything faster reads as a demand)`);
    }
  }
  for (const m of amb.matchAll(/@keyframes\s+ah-ambient[^{]*\{([\s\S]*?)\n\}/g)) {
    if (/transform|translate|top:|left:/.test(m[1])) {
      fails.push('src/ambient/ambient.css  an ambient keyframe animates position. Movement in peripheral vision is a demand for attention; animate opacity and hue only.');
    }
  }
} catch { /* nothing to check yet */ }

console.log(`scanned ${files.length} files`);
if (fails.length) {
  console.error(`\nFAIL — ${fails.length} attention violation(s):`);
  for (const f of fails) console.error(`   ${f}`);
  console.error('\nNothing in a Ink interface appears on its own, and nothing changes by itself.');
  process.exit(1);
}
console.log('OK — nothing here appears unasked.');
