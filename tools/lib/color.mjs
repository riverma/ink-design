/* Color maths for the contrast gate. sRGB only; that is what CSS hex is. */

export function parseHex(h) {
  let s = String(h).trim().replace(/^#/, '');
  if (s.length === 3 || s.length === 4) s = [...s].map((c) => c + c).join('');
  if (s.length !== 6 && s.length !== 8) return null;
  const n = (i) => parseInt(s.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: s.length === 8 ? n(6) / 255 : 1 };
}

/* Flatten a translucent ink onto its ground. Quiet text in this system is
   the ink color at low alpha, so contrast is meaningless without this. */
export function over(fg, bg) {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

export function luminance({ r, g, b }) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Every color stop in a linear/radial-gradient value. */
export function gradientStops(v) {
  return [...String(v).matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
}

/* Resolve var(--x) chains within one token map. */
export function resolve(tokens, value, depth = 0) {
  if (depth > 12) return value;
  const m = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/.exec(String(value).trim());
  if (!m) return value;
  const next = tokens.get(m[1]);
  return next === undefined ? value : resolve(tokens, next, depth + 1);
}
