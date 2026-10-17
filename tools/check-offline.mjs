#!/usr/bin/env node
/* The offline gate (inherited from Ahimsa).
   Every asset is self-hosted. A remote font, a CDN script or an @import
   over the network means the system stops working on a plane, and it means
   a third party learns who is using it. */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'dist', 'docs'];
const EXT = new Set(['.css', '.js', '.mjs', '.html', '.svg', '.webmanifest']);

const BANNED = [
  [/@import\s+url\(\s*['"]?https?:/i, 'a remote @import'],
  [/fonts\.googleapis\.com|fonts\.gstatic\.com/i, 'Google Fonts'],
  [/\/\/cdn\.|cdnjs|jsdelivr|unpkg/i, 'a CDN'],
  [/src\s*=\s*["']https?:/i, 'a remote script or image'],
  [/url\(\s*['"]?https?:/i, 'a remote url()'],
  [/\bfetch\s*\(\s*['"]https?:/i, 'a remote fetch'],
];

/* Links out to the web in prose and hrefs are fine — a documentation site
   that cannot cite anything is not much of a documentation site. What is
   not fine is LOADING something over the network. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(p))) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
const fails = [];

for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const [re, why] of BANNED) {
      if (re.test(line)) fails.push(`${f}:${i + 1}  ${why}\n      ${line.trim().slice(0, 110)}`);
    }
  });
}

console.log(`scanned ${files.length} files`);
if (fails.length) {
  console.error(`\nFAIL — ${fails.length} network dependenc(ies):`);
  for (const f of fails) console.error(`   ${f}`);
  process.exit(1);
}
console.log('OK — nothing here is loaded over a network.');
