/* Minimal CSS custom-property reader.
   Strips comments, then takes the LAST declaration of each name (so a
   later redeclaration wins, matching the cascade for a single selector). */
import { readFileSync } from 'node:fs';

export function readTokens(files) {
  const out = new Map();
  for (const f of files) {
    const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /(--[A-Za-z0-9-]+)\s*:\s*([^;}]+)/g;
    let m;
    while ((m = re.exec(css))) out.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  return out;
}

/* px | rem -> px number, at a 16px root. Anything else -> null. */
export function toPx(v) {
  const s = String(v).trim();
  let m = /^(-?[\d.]+)px$/.exec(s);
  if (m) return parseFloat(m[1]);
  m = /^(-?[\d.]+)rem$/.exec(s);
  if (m) return parseFloat(m[1]) * 16;
  return null;
}

/* Normalize for comparison: 0.0 == 0, cubic-bezier spacing, hex case. */
export function norm(v) {
  return String(v)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(\d)\.0+(?=[,)\s]|$)/g, '$1')
    .replace(/(^|[,(])\.(\d)/g, '$10.$2')
    .replace(/0px/g, '0');
}
