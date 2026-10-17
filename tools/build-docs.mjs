#!/usr/bin/env node
/* Generate the Ink documentation site into docs/, and SKILL.md beside
   it. Edit this file, not the HTML it writes. */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { readTokens } from './lib/css-tokens.mjs';
import { parseHex, contrast, resolve } from './lib/color.mjs';

const VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version;
const NAV = [
  ['index.html', 'Overview'],
  ['principles.html', 'Principles'],
  ['foundations.html', 'Foundations'],
  ['components.html', 'Components'],
  ['themer.html', 'Themer'],
  ['agents.html', 'For agents'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tokens = (...files) => readTokens(['src/tokens/shared.css', ...files.map((f) => `src/tokens/${f}`)]);
const T = { paper: tokens('paper.css'), night: tokens('night.css') };
const val = (mode, n) => resolve(T[mode], T[mode].get(n));

/* The drawn icons, inlined so they take the ink. */
const ICONS = Object.fromEntries(readdirSync('src/icons').filter((f) => f.endsWith('.svg'))
  .map((f) => [f.replace('.svg', ''), readFileSync(`src/icons/${f}`, 'utf8').trim()]));
const icon = (name, cls = '') => {
  if (!ICONS[name]) throw new Error(`no icon: ${name}`);
  return cls ? ICONS[name].replace('class="ink-icon"', `class="ink-icon ${cls}"`) : ICONS[name];
};

/* Set the mode, and any type the person chose in the themer, before first
   paint, so a page is drawn once, not twice. site.js
   does the rest. */
const EARLY = `<script>(function(){var r=document.documentElement,m='paper';try{var s=localStorage.getItem('ink-theme');if(s==='paper'||s==='night'){m=s;}else if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches){m='night';}var t=JSON.parse(localStorage.getItem('ink-themer')||'null');if(t){for(var k in t){if(/^--[a-z-]+$/.test(k))r.style.setProperty(k,t[k]);}}}catch(e){}r.className='ink-'+m;})();</script>`;

function page({ file, title, lede, body }) {
  const nav = NAV.map(([href, label]) =>
    `<a class="ink-link" href="${href}"${href === file ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ');
  return `<!DOCTYPE html>
<html lang="en" class="ink-paper">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#eeeeee">
<meta name="color-scheme" content="light dark">
<title>${esc(title)} — Ink Design System</title>
<meta name="description" content="${esc(lede)}">
${EARLY}
<link rel="stylesheet" href="ink.css">
<link rel="stylesheet" href="themer-fonts.css">
<link rel="stylesheet" href="site.css">
</head>
<body>
<a class="ink-visually-hidden" href="#main">Skip to content</a>
<div class="site">
  <header class="site-head">
    <a class="site-mark" href="index.html">Ink</a>
    <nav class="site-nav" aria-label="Sections">
      ${nav}
    </nav>
    <div class="theme-switch" role="group" aria-label="Mode">
      <button class="ink-chip" type="button" data-theme-btn="paper" aria-pressed="true">Paper</button>
      <button class="ink-chip" type="button" data-theme-btn="night" aria-pressed="false">Night</button>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  <footer class="site-foot">
    <hr class="ink-dinkus">
    <p class="ink-caption">Ink Design System v${VERSION} · MIT · fonts under SIL OFL-1.1</p>
    <p class="ink-caption">No analytics. No cookies. Nothing here is loaded over a network, and nothing here changes by itself.</p>
  </footer>
</div>
<script src="site.js"></script>${file === 'themer.html' ? '\n<script src="themer.js"></script>' : ''}
</body>
</html>
`;
}

const section = (id, kicker, heading, ...blocks) => `    <section class="sec" id="${id}">
      <p class="ink-caps">${esc(kicker)}</p>
      <h2 class="ink-h2">${heading}</h2>
${blocks.join('\n')}
    </section>`;
const p = (html, cls = 'ink-body') => `      <p class="${cls}">${html}</p>`;
const snippet = (code) => `      <div class="snippet"><pre tabindex="0"><code>${esc(code)}</code></pre><button class="ink-btn ink-btn--quiet snippet__copy" type="button" data-copy>Copy</button></div>`;
const spec = ({ label, demo, note, code }) => `      <div class="spec">
        <p class="ink-caps">${esc(label)}</p>
        <div class="spec__demo">${demo}</div>
${note ? `        <p class="ink-body ink-secondary">${note}</p>` : ''}
${code ? snippet(code) : ''}
      </div>`;

/* ------------------------------------------------------------------ */
/* Shared content                                                      */
/* ------------------------------------------------------------------ */

/* Walden, by Henry David Thoreau (1854), in the public domain. The
   opening of "Economy" for the hero, and five pages for the reader. */
const HERO = [
  'When I wrote the following pages, or rather the bulk of them, I lived alone, in the woods, a mile from any neighbor, in a house which I had built myself, on the shore of Walden Pond, in Concord, Massachusetts, and earned my living by the labor of my hands only.',
  'I lived there two years and two months. At present I am a sojourner in civilized life again.',
];
const WALDEN = [
  ['Where I Lived, and What I Lived For', 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.'],
  ['Where I Lived, and What I Lived For', 'Our life is frittered away by detail. An honest man has hardly need to count more than his ten fingers, or in extreme cases he may add his ten toes, and lump the rest. Simplicity, simplicity, simplicity!'],
  ['Where I Lived, and What I Lived For', 'Time is but the stream I go a-fishing in. I drink at it; but while I drink I see the sandy bottom and detect how shallow it is. Its thin current slides away, but eternity remains.'],
  ['Solitude', 'I never found the companion that was so companionable as solitude.'],
  ['Conclusion', 'If a man does not keep pace with his companions, perhaps it is because he hears a different drummer. Let him step to the music which he hears, however measured or far away.'],
];

const ROOTS = [
  ['book', 'The printed page.', 'Five centuries of books settled what reading needs: a measure, a margin, a running head, a folio, and pages that end. Ink keeps all of it.'],
  ['pen', 'Ink, and nothing else.', 'One ink, one paper and the grays between them. With no color to decorate with, what is said has to carry the page.'],
  ['light', 'Simplicity, simplicity.', '“Simplicity, simplicity, simplicity!” Thoreau wrote, in a house he built himself by a pond. Ink is built the same way: few parts, each doing its work.'],
];

const PRINCIPLES = [
  ['contents', 'Ink or paper.', 'Every mark is one of sixteen grays, and most of a page is just two: the ink and the paper it sits on.'],
  ['close', 'Nothing moves.', 'A change happens in one step, never as a transition. Movement pulls the eye whether the reader wants to look or not, so there is none.'],
  ['book', 'Pages, not scroll.', 'Long content arrives a page at a time with the count in view, and turning a page changes all of it at once. A page can be finished. Then it ends.'],
  ['check', 'A press is black and white.', 'Feedback inverts the control, ink for paper and paper for ink, at once. It is unmistakable, and it asks for nothing more.'],
  ['type', 'Type is the interface.', 'Lora for anything read, Atkinson Hyperlegible Next for anything operated. A notch heavier than usual, large, and well leaded.'],
  ['light', 'Still is free.', 'Nothing ticks, refreshes or updates itself. A page left alone stays as it was left, and asks for nothing.'],
];

const FACTS = [
  ['Sixteen grays', 'Ink on paper has always been enough to say anything. A small, fixed set of grays keeps every page in one quiet register, with nothing competing in hue.', 'Every color is one of the levels.', 'The palette is exactly <code>--gray-0</code> to <code>--gray-15</code>, and each mode uses six.'],
  ['Stillness', 'Movement on a page pulls the eye whether or not the reader wants to look. A page that holds still leaves attention where the reader put it.', 'Nothing moves, and a press is an inversion.', 'No transitions or animation anywhere; pressed and selected states are a pure inversion.'],
  ['A page at a time', 'A scroll has no edges and no end. A page has both: it can be read whole, and finished, as a book always could.', 'Content turns a page at a time.', 'The whole page changes at once and the controls stay where they are.'],
  ['Clear in any light', 'Words are for everyone: tired eyes, low vision, a dim room or bright sun. Clear contrast is a kindness, not a style.', 'Contrast floors are higher.', 'All text clears 7:1, control edges 4.5:1, and the full range of pure paper and pure ink is one class away.'],
  ['Nothing asks', 'An interface that ticks, refreshes and counts is asking for attention it was not given. Calm is mostly the absence of that asking.', 'Nothing updates itself.', 'No clocks that tick, no live counters, no shimmer while loading. The page changes when someone touches it.'],
];

const mini = (mode) => `<div class="ink-${mode} mini">
          <p class="ink-caps">${mode === 'night' ? 'Ink Night' : 'Ink Paper'}</p>
          <p class="ink-h2">${mode === 'night' ? 'Light on dark' : 'Dark on light'}</p>
          <p class="ink-body">${mode === 'night' ? 'For reading at night, with the lamp low. The same tokens, turned over.' : 'Ink on paper, as a page has always been.'}</p>
          <div class="row"><button class="ink-btn ink-btn--primary" type="button">Open book</button><button class="ink-btn" type="button">Contents</button></div>
          <div class="row" role="group" aria-label="Turn pages by" data-chips><button class="ink-chip" type="button" aria-pressed="false">Tap</button><button class="ink-chip" type="button" aria-pressed="true">Swipe</button></div>
        </div>`;

/* ------------------------------------------------------------------ */
/* index.html                                                          */
/* ------------------------------------------------------------------ */

const index = page({
  file: 'index.html',
  title: 'Overview',
  lede: 'Ink is a calm design system for reading: sixteen grays, nothing that moves, and pages instead of scroll.',
  body: `    <section class="hero">
      <div class="hero__copy">
        <p class="ink-caps">A design system for stillness</p>
        <h1 class="ink-title">Ink on paper, for screens that are paper.</h1>
        <p class="ink-lead">Ink is a calm design system for reading. It uses sixteen grays and no motion, and it pages instead of scrolling, so an interface sits as quietly on a screen as a well-set book.</p>
        <div class="row">
          <a class="ink-btn ink-btn--primary" href="principles.html">Read the principles</a>
          <a class="ink-btn" href="components.html">See the components</a>
        </div>
      </div>
      <div class="device" aria-hidden="true">
        <div class="device__screen">
          <div class="ink-page">
            <div class="ink-runninghead"><span>Walden</span><span>Economy</span></div>
            <div class="ink-prose">
              <p class="ink-dropcap">${HERO[0]}</p>
              <p>${HERO[1]}</p>
            </div>
            <div class="ink-folio">Page 1 of 268</div>
          </div>
        </div>
      </div>
    </section>

${section('practice', 'The practice', 'Five commitments, and why',
  p('Ink rests on five commitments. Each has a reason, and each reason becomes a rule the build checks, so it does not have to be remembered.'),
  `      <ol class="facts">
${FACTS.map(([h, fact, so, how]) => `        <li><div><h3 class="ink-h3">${h}</h3><p class="ink-body ink-secondary">${fact}</p></div><div class="facts__so"><strong>So: ${so}</strong>${how}</div></li>`).join('\n')}
      </ol>`)}

${section('modes', 'Two modes', 'Paper, and Night',
  p('Same tokens, same components, same markup. Put <code>ink-paper</code> or <code>ink-night</code> on <code>&lt;html&gt;</code>. With no stored choice, Ink follows the operating system’s light or dark setting until the person picks one.'),
  `      <div class="pair">
        ${mini('paper')}
        ${mini('night')}
      </div>`)}

${section('principles', 'Six principles', 'Still, legible, finite',
  `      <div class="grid3">
${PRINCIPLES.map(([g, h, b]) => `        <div class="ink-card"><p class="principle__glyph">${icon(g, 'ink-icon--l')}</p><h3 class="ink-h3">${h}</h3><p class="ink-body ink-secondary">${b}</p></div>`).join('\n')}
      </div>`,
  `      <p class="ink-body"><a class="ink-link" href="principles.html">What Ink refuses, and why</a></p>`)}

${section('roots', 'Where it comes from', 'Books, and a simpler way',
  p('Ink takes its shape from the printed book, and its temper from a simple idea: keep only what does the work. The constraints point the same way: attention left free, nothing decorative, and margins treated as part of the page rather than room to fill.'),
  `      <div class="grid3">
${ROOTS.map(([g, h, b]) => `        <div class="ink-card"><p class="principle__glyph">${icon(g, 'ink-icon--l')}</p><h3 class="ink-h3">${h}</h3><p class="ink-body ink-secondary">${b}</p></div>`).join('\n')}
      </div>`,
  p('Ink also keeps the laws of the <a class="ink-link" href="https://ahimsa-design.riverma.com">Ahimsa design system</a> unchanged. Nothing appears unasked, there is no red, components read semantic tokens only, corners stay rounded, and nothing is loaded over a network.'))}
`,
});

/* ------------------------------------------------------------------ */
/* principles.html                                                     */
/* ------------------------------------------------------------------ */

const REFUSED = [
  ['Transitions and animation', 'Motion draws the eye on its own schedule, not the reader’s. Even a short fade asks to be watched.', 'Change state in one step. A press is an instant inversion.'],
  ['Scrolling feeds, smooth and infinite', 'A scroll has no natural place to stop, and an infinite feed is built so that there is none.', 'Pages, with the count in view (<code>.ink-pager</code>), and an ending (<code>.ink-end</code>).'],
  ['Gradients', 'A gradient is decoration that never settles on a value. Ink on paper is flat.', 'A flat level, or a rule.'],
  ['Shadows and blur', 'A shadow lifts a card off the page to make it louder than its neighbors. Nothing here needs to be louder.', 'A one-pixel ink border, and space.'],
  ['Transparency', 'Translucent ink lands on a gray nobody chose, which changes with whatever lies beneath it.', 'Name the level you mean.'],
  ['Hover states', 'Touch has no hover, and many readers never point. Anything revealed on hover is hidden from them.', 'Every control is visible and labeled at rest.'],
  ['Meaning in color', 'There is no hue here to carry it, and many readers cannot see hue anyway.', 'Words first, then shape, fill and border style: dashed means look again; filled means on.'],
  ['Live clocks, counters and shimmer', 'Every tick is a small demand: a movement in the corner of the eye, attention pulled.', 'Show the time or the count when asked. Loading says “Loading” and holds still.'],
  ['Carousels and autoplay', 'They move by themselves, and they decide when the reader has finished looking.', 'A page the person turns.'],
  ['Hairlines and thin weights', 'Strokes thinner than a pixel, and weights below 400, fade on many screens and for many eyes.', 'Rules of at least 1px, control edges of 2px, body text at 450.'],
];

const principles = page({
  file: 'principles.html',
  title: 'Principles',
  lede: 'The six principles Ink is built on, and the ten patterns it refuses.',
  body: `    <section class="hero hero--slim">
      <div class="hero__copy">
        <p class="ink-caps">The principles</p>
        <h1 class="ink-title">Drawn once, and left alone.</h1>
        <p class="ink-lead">Most interfaces are built to hold attention: they move, glow, count and refresh. Ink is built to give attention back. Each rule here removes something that asks for the eye, so what remains is the text and the reader.</p>
      </div>
    </section>

${section('six', 'Six principles', 'What Ink promises',
  `      <ol class="rules">
${PRINCIPLES.map(([, h, b], i) => `        <li><span class="rules__n" aria-hidden="true">${i + 1}</span><div><h3 class="ink-h3">${h}</h3><p class="ink-body ink-secondary">${b}</p></div></li>`).join('\n')}
      </ol>`)}

${section('refused', 'Refused', 'Ten things Ink leaves out',
  p('None of them has a token or a class in this system. Most are also checked: <code>tools/check-stillness.mjs</code> fails the build on any gradient, shadow, blur, partial opacity, transition, animation, hover state, thin weight or color that is not one of the sixteen levels.'),
  `      <div class="refuse">
${REFUSED.map(([name, why, instead]) => `        <div class="refuse__row">
          <h3 class="ink-h3 refuse__name">${icon('close')} ${name}</h3>
          <p><strong>Why not:</strong> ${why}</p>
          <p><strong>Instead:</strong> ${instead}</p>
        </div>`).join('\n')}
      </div>`)}

${section('test', 'The test', 'Would it look right drawn once?',
  `      <div class="callout">
        <p class="ink-lead"><a class="ink-link" href="https://ahimsa-design.riverma.com">Ahimsa</a> asks of every change: <em>did the person cause this, here, now?</em> Ink adds a question for every screen: <strong>would this look right if it were drawn once, and not again until someone touched it?</strong> If the answer is no, the design depends on motion to hold the eye.</p>
      </div>`)}

${section('inherited', 'From Ahimsa', 'Laws carried over unchanged',
  p('These come from the <a class="ink-link" href="https://ahimsa-design.riverma.com">Ahimsa design system</a>, unchanged.'),
  `      <ul class="ink-body list">
        <li>Nothing appears unasked: no modal on load, no toast, no <code>role="alert"</code>, no autoplay, no <code>setInterval</code>. The attention gate runs here too.</li>
        <li>No red, and no danger token. Something that needs a look goes dashed.</li>
        <li>Components read semantic tokens only, so markup moves between Paper and Night untouched.</li>
        <li>Corners stay rounded.</li>
        <li>Nothing is loaded over a network. The offline gate runs here too.</li>
        <li>No pure black or pure white by default, so there is no glare and no smear. When the full range is wanted, <code>ink-full</code> opens the grounds to pure paper and pure ink.</li>
      </ul>`)}
`,
});

/* ------------------------------------------------------------------ */
/* foundations.html                                                    */
/* ------------------------------------------------------------------ */

const levelInk = (hex) => contrast(parseHex(hex), parseHex('#000000')) >= contrast(parseHex(hex), parseHex('#ffffff')) ? '#000000' : '#ffffff';
const USED = {};
for (const mode of ['paper', 'night']) {
  for (const [n] of T[mode]) {
    if (!/^--(surface|text|mark|rule|border|focus|selected|on)-/.test(n)) continue;
    const h = val(mode, n);
    (USED[h] ||= new Set()).add(mode === 'paper' ? 'Paper' : 'Night');
  }
}
const levels = Array.from({ length: 16 }, (_, i) => {
  const h = val('paper', `--gray-${i}`);
  const use = USED[h] ? [...USED[h]].join(' · ') : '';
  const full = i === 0 || i === 15 ? 'full range' : '';
  return `<div class="lv" style="background:${h};color:${levelInk(h)}"><span>${i}</span><span class="lv__use">${[use, full].filter(Boolean).join(' · ')}</span><code>${h}</code></div>`;
}).join('\n          ');

const ROLES = [
  ['--surface-canvas', 'The page.'],
  ['--surface-sunk', 'A recessed area, a code block.'],
  ['--text-body', 'Everything read. Headings too.'],
  ['--text-secondary', 'Captions and hints. Still 7:1.'],
  ['--mark-muted', 'Idle marks: leader dots. Never type.'],
  ['--rule', 'A decorative separator.'],
  ['--border-control', 'The edge of anything you touch.'],
  ['--selected-fill', 'Pressed and selected: the inversion.'],
];
const tokenRow = ([n, role]) => {
  const a = val('paper', n), b = val('night', n);
  return `<tr><td><code>${n}</code></td><td><span class="sw" style="background:${a}"></span><code>${a}</code></td><td><span class="sw" style="background:${b}"></span><code>${b}</code></td><td>${role}</td></tr>`;
};
const rangeCard = (cls, label, note) => `<div class="${cls}"><p class="ink-caps">${label}</p><p class="ink-h3">Walden</p><p class="ink-body ink-secondary">${note}</p></div>`;

const foundations = page({
  file: 'foundations.html',
  title: 'Foundations',
  lede: 'Gray levels, type, strokes, icons and change in Ink.',
  body: `    <section class="hero hero--slim">
      <div class="hero__copy">
        <p class="ink-caps">Foundations</p>
        <h1 class="ink-title">Sixteen grays and two typefaces.</h1>
        <p class="ink-lead">Sixteen grays are the palette. There are three stroke weights, thirteen drawn icons and one kind of change: a press. To try other typefaces, open the <a class="ink-link" href="themer.html">themer</a>.</p>
      </div>
    </section>

${section('levels', 'Levels', 'Sixteen grays, and no more',
  p('The palette is sixteen grays, from 0x00 to 0xFF in steps of 0x11, like ink ground with more or less water. Every color in Ink is one of them, and <code>tools/check-stillness.mjs</code> fails anything else. Each mode uses six, so every page keeps one quiet register.'),
  `      <div class="levels" aria-label="The sixteen gray levels">
          ${levels}
      </div>`)}

${section('tokens', 'Semantic tokens', 'What each level is for',
  p('Components never name a level. They read these, so markup moves between modes untouched.'),
  `      <div class="table-wrap"><table class="tokens">
        <thead><tr><th>Token</th><th>Paper</th><th>Night</th><th>Use</th></tr></thead>
        <tbody>
          ${ROLES.map(tokenRow).join('\n          ')}
        </tbody>
      </table></div>`,
  p('Text clears 7:1 on every ground, which is AAA, so it reads for tired eyes, low vision and any light. Control edges clear 4.5:1 and idle marks 3:1. <code>tools/check-contrast.mjs</code> measures every pair in both modes, at both ranges.', 'ink-body ink-secondary'))}

${section('range', 'Range', 'Softened, or full',
  p('By default Ink keeps <a class="ink-link" href="https://ahimsa-design.riverma.com">Ahimsa</a>’s law: the ground stops at <code>#eeeeee</code> and the ink at <code>#111111</code>, so there is no glare and no smear. For the strongest contrast, add <code>ink-full</code> to <code>&lt;html&gt;</code> and the grounds open to pure paper and pure ink. Displays that report themselves as grayscale get the full range by themselves.'),
  `      <div class="range">
        ${rangeCard('ink-paper', 'Paper · softened', '#111111 on #eeeeee')}
        ${rangeCard('ink-paper ink-full', 'Paper · full', '#000000 on #ffffff')}
        ${rangeCard('ink-night', 'Night · softened', '#eeeeee on #111111')}
        ${rangeCard('ink-night ink-full', 'Night · full', '#ffffff on #000000')}
      </div>`,
  snippet(`<html class="ink-paper">              <!-- softened: no glare, no smear -->
<html class="ink-paper ink-full">    <!-- full range: pure paper, pure ink -->`))}

${section('type', 'Type', 'The book and the device',
  `      <div class="ink-card specimen">
        <p class="ink-caps">Lora · reading · <code>--font-book</code></p>
        <p class="ink-title">Simplicity, simplicity</p>
        <div class="ink-prose"><p class="ink-dropcap">Lora is a contemporary serif with brushed curves and moderate contrast, steady at reading sizes and warm without fuss. Ink sets it at weight 450 rather than 400, because sixteen-level anti-aliasing thins every stroke a little, and headings at 650.</p><p>Paragraphs are indented, not spaced, as in a book. Text is ragged right, hyphenated where the language allows, and runs the full width it is given unless <code>--measure</code> caps it.</p></div>
      </div>
      <div class="ink-card specimen">
        <p class="ink-caps">Atkinson Hyperlegible Next · operating · <code>--font-ui</code></p>
        <p class="legible" aria-label="Capital I, lowercase l, digit 1, capital O, digit 0, lowercase r n, lowercase m">Il1 O0 rn m</p>
        <p class="ink-ui">Buttons, labels, folios and settings. Its letters are drawn to stay distinct at small sizes and low contrast, so a glance is enough.</p>
      </div>
      <div class="ink-card scale">
        <div><code>--size-title</code><span class="ink-h1" style="font-size:var(--size-title)">Walden</span></div>
        <div><code>--size-h1</code><span class="ink-h1">Where I Lived</span></div>
        <div><code>--size-h2</code><span class="ink-h2">Solitude</span></div>
        <div><code>--size-h3 / lead</code><span class="ink-h3">The Pond in Winter</span></div>
        <div><code>--size-body</code><span class="ink-body">I went to the woods because I wished to live deliberately.</span></div>
        <div><code>--size-ui</code><span class="ink-ui">Page 3 of 12</span></div>
        <div><code>--size-caption</code><span class="ink-caption">Saved to your notes</span></div>
        <div><code>--size-label</code><span class="ink-caps" style="margin:0">Contents</span></div>
      </div>`)}

${section('edges', 'Strokes', 'Depth is a rule and a margin',
  p('There are no shadows. A surface is separated by a rule, a border or space. Three strokes, never thinner than one pixel.'),
  `      <div class="strokes">
        <div class="ink-card"><span style="border-top:var(--stroke) solid var(--rule-strong)"></span><code>--stroke</code> 1px · rules and cards</div>
        <div class="ink-card"><span style="border-top:var(--stroke-control) solid var(--rule-strong)"></span><code>--stroke-control</code> 2px · anything you touch</div>
        <div class="ink-card"><span style="border-top:var(--stroke-focus) solid var(--rule-strong)"></span><code>--stroke-focus</code> 3px · the focus ring</div>
      </div>`)}

${section('icons', 'Icons', 'Drawn on the pixel grid',
  p('Twenty-four units, a two-unit stroke on whole coordinates, round caps and joins, and no fills except the dots in contents. At 24px every line lands on a pixel, so it stays crisp. Each icon is symmetric unless the object is not, and each takes its ink from the text around it.'),
  `      <div class="icons">
${Object.keys(ICONS).sort().map((n) => `        <figure class="ink-card icon-cell">${icon(n, 'ink-icon--l')}<figcaption class="ink-caption"><code>${n}</code></figcaption></figure>`).join('\n')}
      </div>`,
  snippet(`<svg class="ink-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 3 H18 V21 L12 16 L6 21 Z"/>
</svg>`))}

${section('change', 'Change', 'There is no motion',
  p('Press either button. It inverts at once and comes back when you let go. That is the whole vocabulary of change. It has no duration, so there is nothing to watch, only something that happened. There are no motion tokens, and nothing to reduce for reduced motion.'),
  `      <div class="row row--gap">
        <button class="ink-btn" type="button">Press me</button>
        <button class="ink-btn ink-btn--primary" type="button">And me</button>
      </div>`)}
`,
});

/* ------------------------------------------------------------------ */
/* components.html                                                     */
/* ------------------------------------------------------------------ */

const reader = `<div class="reader" data-reader data-i="0">
          <div class="ink-page">
            <div class="ink-runninghead"><span>Walden</span><span data-reader-chapter>${WALDEN[0][0]}</span></div>
            <div class="reader__stage">
${WALDEN.map(([ch, text], i) => `              <div class="ink-prose" data-page data-chapter="${esc(ch)}"${i ? ' hidden' : ''}><p${i === 0 ? ' class="ink-dropcap"' : ''}>${text}</p></div>`).join('\n')}
              <div class="ink-end" data-reader-end hidden>
                <p class="ink-h3">End of the excerpt</p>
                <p class="ink-caption">Five pages from Walden, by Henry David Thoreau, 1854.</p>
                <button class="ink-btn" type="button" data-reader-restart>Back to the first page</button>
              </div>
            </div>
            <div class="ink-progress" style="--at:${Math.round(100 / WALDEN.length)}%" data-reader-progress aria-hidden="true"></div>
          </div>
          <div class="ink-pager">
            <button class="ink-btn ink-btn--icon" type="button" data-reader-prev disabled>${icon('prev')}<span class="ink-visually-hidden">Previous page</span></button>
            <span class="ink-pager__label" data-reader-label aria-live="polite">Page 1 of ${WALDEN.length}</span>
            <button class="ink-btn ink-btn--icon" type="button" data-reader-next>${icon('next')}<span class="ink-visually-hidden">Next page</span></button>
          </div>
        </div>`;

const TOC = [['Economy', 1], ['Where I Lived, and What I Lived For', 71], ['Reading', 89], ['Sounds', 97], ['Solitude', 113], ['Visitors', 121]];

const components = page({
  file: 'components.html',
  title: 'Components',
  lede: 'Buttons, chips, pages, contents, lists, forms and notices.',
  body: `    <section class="hero hero--slim">
      <div class="hero__copy">
        <p class="ink-caps">Components</p>
        <h1 class="ink-title">Everything here holds still.</h1>
        <p class="ink-lead">Press anything. It inverts and comes back. Nothing on this page changes unless you touch it.</p>
      </div>
    </section>

${section('actions', 'Actions', 'Buttons and chips',
  spec({
    label: 'Button',
    demo: `<div class="row row--gap"><button class="ink-btn ink-btn--primary" type="button">Open book</button><button class="ink-btn" type="button">Contents</button><button class="ink-btn ink-btn--quiet" type="button">Not now</button><button class="ink-btn" type="button" disabled>Unavailable</button></div>
        <div class="row row--gap"><button class="ink-btn ink-btn--icon" type="button">${icon('menu')}<span class="ink-visually-hidden">Menu</span></button><button class="ink-btn ink-btn--icon" type="button">${icon('search')}<span class="ink-visually-hidden">Search</span></button><button class="ink-btn ink-btn--icon" type="button">${icon('bookmark')}<span class="ink-visually-hidden">Bookmark this page</span></button><button class="ink-btn" type="button">${icon('type')} Text size</button></div>`,
    note: 'One primary per view: the thing the page is for. Every button is at least 48px square, so it is easy to hit with a finger or a shaking hand. Disabled goes dashed, not faint, so it stays readable.',
    code: `<button class="ink-btn ink-btn--primary">Open book</button>
<button class="ink-btn">Contents</button>
<button class="ink-btn ink-btn--quiet">Not now</button>
<button class="ink-btn ink-btn--icon"><svg class="ink-icon" …/><span class="ink-visually-hidden">Menu</span></button>`,
  }),
  spec({
    label: 'Chip',
    demo: `<div class="row" role="group" aria-label="Turn pages by" data-chips><button class="ink-chip" type="button" aria-pressed="true">Tap</button><button class="ink-chip" type="button" aria-pressed="false">Swipe</button><button class="ink-chip" type="button" aria-pressed="false">Side buttons</button></div>`,
    note: 'One choice among a few. <code>aria-pressed</code> carries the state. A chosen chip inverts and draws a check, so it reads without being compared to its neighbors.',
    code: '<button class="ink-chip" aria-pressed="true">Tap</button>',
  }),
  spec({ label: 'Link', demo: '<p class="ink-body">Read <a class="ink-link" href="principles.html">what Ink refuses</a> first.</p>', code: '<a class="ink-link" href="…">what Ink refuses</a>' }))}

${section('reading', 'Reading', 'Pages, not scroll',
  p('<code>.ink-page</code> is a running head, the text and a folio. <code>.ink-pager</code> turns it, with the count always in view, and the controls never move between pages. When the set runs out, <code>.ink-end</code> says so. Try it.'),
  `      <div class="spec__demo">
        ${reader}
      </div>`,
  snippet(`<div class="ink-page">
  <div class="ink-runninghead"><span>Walden</span><span>Solitude</span></div>
  <div class="ink-prose"><p>…</p></div>
  <div class="ink-progress" style="--at: 40%"></div>
</div>
<div class="ink-pager">
  <button class="ink-btn ink-btn--icon">…Previous page</button>
  <span class="ink-pager__label" aria-live="polite">Page 113 of 268</span>
  <button class="ink-btn ink-btn--icon">…Next page</button>
</div>`),
  spec({
    label: 'Contents',
    demo: `<ol class="ink-toc">
${TOC.map(([t, n], i) => `          <li><a href="#reading"${i === 1 ? ' aria-current="true"' : ''}><span class="ink-toc__title">${t}</span><span class="ink-toc__page">${n}</span></a></li>`).join('\n')}
        </ol>`,
    note: 'Titles, dot leaders in <code>--mark-muted</code>, and page numbers. The current section is set bold.',
    code: '<ol class="ink-toc"><li><a href="…"><span class="ink-toc__title">Solitude</span><span class="ink-toc__page">113</span></a></li></ol>',
  }),
  spec({
    label: 'Prose details',
    demo: `<div class="ink-prose">
          <p class="ink-dropcap">A drop capital opens a chapter, three lines deep.</p>
          <blockquote class="ink-quote"><p>I never found the companion that was so companionable as solitude.</p></blockquote>
          <hr class="ink-dinkus">
          <p>A dinkus marks a break inside a chapter. A rule, <code>.ink-rule</code>, divides things that aren’t prose.</p>
        </div>`,
    code: '<p class="ink-dropcap">…</p>\n<blockquote class="ink-quote">…</blockquote>\n<hr class="ink-dinkus">',
  }))}

${section('settings', 'Settings', 'Lists, switches and checks',
  `      <div class="grid2">
        <div>
          <ul class="ink-list">
            <li><span id="set-bold">Bold text<span class="ink-list__hint">Heavier strokes for small sizes</span></span><label class="ink-switch"><input type="checkbox" aria-labelledby="set-bold"><span class="ink-switch__track"></span><span class="ink-switch__state" aria-hidden="true">Off</span></label></li>
            <li><span id="set-awake">Keep the screen awake while reading<span class="ink-list__hint">Only while a book is open</span></span><label class="ink-switch"><input type="checkbox" checked aria-labelledby="set-awake"><span class="ink-switch__track"></span><span class="ink-switch__state" aria-hidden="true">On</span></label></li>
            <li><label class="ink-check"><input type="checkbox" checked><span class="ink-check__box"></span>Show page numbers</label></li>
            <li><label class="ink-check"><input type="checkbox"><span class="ink-check__box"></span>Show time left in chapter</label></li>
          </ul>
        </div>
        <div class="stack">
          <p class="ink-body ink-secondary">A switch says <strong>On</strong> or <strong>Off</strong> in words beside it, and its track fills when on. A check is drawn in its box. Neither state depends on gray alone, and neither moves: the knob is simply on the other side.</p>
        </div>
      </div>`,
  snippet(`<span id="set-awake">Keep the screen awake while reading</span>
<label class="ink-switch">
  <input type="checkbox" checked aria-labelledby="set-awake">
  <span class="ink-switch__track"></span><span class="ink-switch__state" aria-hidden="true">On</span>
</label>
<label class="ink-check"><input type="checkbox"><span class="ink-check__box"></span>Show page numbers</label>`))}

${section('forms', 'Input', 'Fields',
  `      <div class="grid2">
        <div class="ink-card stack">
          <div class="ink-field"><label class="ink-label" for="q">Search this book</label><input class="ink-input" id="q" placeholder="A word or a phrase"><span class="ink-hint">Searches all 18 chapters.</span></div>
          <div class="ink-field"><label class="ink-label" for="pg">Go to page</label><input class="ink-input" id="pg" value="400" inputmode="numeric" aria-invalid="true" aria-describedby="pg-h"><span class="ink-hint" id="pg-h">This book ends on page 268.</span></div>
        </div>
        <p class="ink-body ink-secondary">Labels are always visible, above the field. Something to look at goes dashed and says what to do, in words. There is no red, no shake and no icon-only error.</p>
      </div>`)}

${section('feedback', 'Feedback', 'Notices that stay put',
  `      <div class="stack">
        <div class="ink-notice"><span class="ink-notice__glyph">${icon('bookmark')}</span><div><strong>Bookmarked.</strong> Page 113, Solitude.</div><div class="ink-notice__actions"><button class="ink-btn ink-btn--quiet" type="button">Undo</button></div></div>
        <div class="ink-notice ink-notice--note"><span class="ink-notice__glyph">${icon('book')}</span><div><strong>Your notes didn’t sync.</strong> Nothing is lost. They will sync the next time you connect.</div><div class="ink-notice__actions"><button class="ink-btn" type="button">Try now</button></div></div>
      </div>`,
  p('A notice sits in the page where the person caused it. It never slides in, never times out and is never announced assertively. A toast decides when the reader has read it; a notice lets them decide.', 'ink-body ink-secondary'))}

${section('surfaces', 'Surfaces', 'Cards',
  `      <div class="grid2">
        <div class="ink-card"><p class="ink-caps">.ink-card</p><h3 class="ink-h3">A ruled card</h3><p class="ink-body ink-secondary">A one-pixel ink border and space. No shadow.</p></div>
        <div class="ink-card ink-card--sunk"><p class="ink-caps">.ink-card--sunk</p><h3 class="ink-h3">A recessed card</h3><p class="ink-body ink-secondary">One level down, with no border at all.</p></div>
      </div>`)}
`,
});

/* ------------------------------------------------------------------ */
/* agents.html and SKILL.md — one source, so the two never drift.      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* themer.html — try typefaces and spacing against a page of Walden.  */
/* The candidate fonts live in themer/fonts/ and serve the docs only.  */
/* ------------------------------------------------------------------ */

const FONTS = JSON.parse(readFileSync('themer/fonts.json', 'utf8'));
mkdirSync('docs/themer-fonts', { recursive: true });
let themerCss = `/* Candidate typefaces for the themer. Generated by tools/build-docs.mjs
   from themer/fonts.json. Docs only: not part of the Ink system. All are
   SIL OFL-1.1; the license texts sit beside the files. */\n`;
for (const f of FONTS) {
  if (f.system) continue;
  copyFileSync(`themer/fonts/${f.ofl}`, `docs/themer-fonts/${f.ofl}`);
  for (const x of f.faces) {
    copyFileSync(`themer/fonts/${x.file}`, `docs/themer-fonts/${x.file}`);
    themerCss += `@font-face {\n  font-family: "${f.family}";\n  src: url("themer-fonts/${x.file}") format("woff2");\n  font-weight: ${x.weight}; font-style: normal; font-display: swap;\n  unicode-range: ${x.range};\n}\n`;
  }
}
writeFileSync('docs/themer-fonts.css', themerCss);

const BOOK = FONTS.filter((f) => f.kind === 'book');
const UI = FONTS.filter((f) => f.kind === 'ui');
const stack = (f) => `"${f.family}", ${f.kind === 'book' ? 'Georgia, serif' : 'system-ui, sans-serif'}`;
const about = (f) => {
  return `Weights ${f.wght[0]}–${f.wght[1]}${f.opsz ? ' · optical sizes' : ''}`;
};
/* The measure slider's last stop is the full width. */
const FULL = 61;
const px = (rem) => Math.round(parseFloat(rem) * 16 * 2) / 2;
const DEFAULTS = {
  book: 'Lora', ui: 'Atkinson Hyperlegible Next',
  size: px(T.paper.get('--size-body')), weight: Number(T.paper.get('--weight-body')),
  heading: Number(T.paper.get('--weight-heading')), uiw: Number(T.paper.get('--weight-ui')),
  leading: Number(T.paper.get('--leading-body')), measure: T.paper.get('--measure') === '100%' ? FULL : parseFloat(T.paper.get('--measure')),
};
const META = Object.fromEntries(FONTS.map((f) => [f.family, { kind: f.kind, stack: stack(f), about: about(f), note: f.note, system: f.system, files: f.faces.map((x) => x.file), ofl: f.ofl }]));

const pick = (kind, list) => `<div class="themer__fonts" role="group" aria-label="${kind === 'book' ? 'Reading face' : 'Interface face'}" data-pick="${kind}">
${list.map((f) => `            <button class="ink-chip" type="button" data-font="${esc(f.family)}" aria-pressed="${f.family === DEFAULTS[kind] ? 'true' : 'false'}" style="font-family:${esc(stack(f))}">${f.family}</button>`).join('\n')}
          </div>`;
const slider = (key, label, min, max, step, unit) => `<label class="themer__range"><span class="themer__range-label">${label} <output data-out="${key}">${key === 'measure' && DEFAULTS[key] >= FULL ? 'Full width' : DEFAULTS[key] + unit}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${DEFAULTS[key]}" data-key="${key}"></label>`;

const bookCard = (f) => `        <div class="ink-card compare" style="font-family:${esc(stack(f))}">
          <p class="ink-caps compare__name">${f.family}</p>
          <p class="compare__title">Simplicity</p>
          <p class="compare__text">${WALDEN[0][1]}</p>
          <p class="compare__text ink-italic ink-secondary">Simplicity, simplicity, simplicity!</p>
          <p class="ink-caption">${esc(about(f))}. ${f.note}</p>
          <button class="ink-btn" type="button" data-choose="book" data-font="${esc(f.family)}">Use ${f.family}</button>
        </div>`;
const uiCard = (f) => `        <div class="ink-card compare">
          <p class="ink-caps compare__name">${f.family}</p>
          <p class="compare__legible" style="font-family:${esc(stack(f))}" aria-label="Capital I, lowercase l, digit 1, capital O, digit 0, lowercase r n, lowercase m">Il1 O0 rn m</p>
          <p class="compare__ui" style="font-family:${esc(stack(f))}">Page 3 of 12 · Bookmarked · Search this book · Turn pages by tap</p>
          <p class="ink-caption">${esc(about(f))}. ${f.note}</p>
          <button class="ink-btn" type="button" data-choose="ui" data-font="${esc(f.family)}">Use ${f.family}</button>
        </div>`;

const themer = page({
  file: 'themer.html',
  title: 'Themer',
  lede: 'Try typefaces, sizes, weights and spacing against a page of Walden, then copy the tokens.',
  body: `    <section class="hero hero--slim">
      <div class="hero__copy">
        <p class="ink-caps">Themer</p>
        <h1 class="ink-title">Choose the type.</h1>
        <p class="ink-lead">Type is most of this system, so choose it by reading. Try eight reading faces and six interface faces against a page of Walden, in Paper and Night, softened or at the full range. Every face here is self-hosted and open source.</p>
      </div>
    </section>

${section('try', 'Try it', 'A page, set your way',
  `      <div class="themer" data-themer>
        <script type="application/json" id="themer-data">${JSON.stringify({ defaults: DEFAULTS, fonts: META })}</script>
        <div class="themer__controls">
          <fieldset class="themer__group">
            <legend class="ink-caps">Reading face</legend>
          ${pick('book', BOOK)}
            <p class="ink-caption" data-about="book">${esc(about(BOOK.find((f) => f.family === DEFAULTS.book)))}. ${BOOK.find((f) => f.family === DEFAULTS.book).note}</p>
          </fieldset>
          <fieldset class="themer__group">
            <legend class="ink-caps">Interface face</legend>
          ${pick('ui', UI)}
            <p class="ink-caption" data-about="ui">${esc(about(UI[0]))}. ${UI[0].note}</p>
          </fieldset>
          <fieldset class="themer__group">
            <legend class="ink-caps">Size and spacing</legend>
            ${slider('size', 'Body size', 16, 24, 0.5, 'px')}
            ${slider('weight', 'Body weight', 400, 600, 10, '')}
            ${slider('leading', 'Leading', 1.3, 1.9, 0.05, '')}
            ${slider('measure', 'Measure', 26, FULL, 1, 'rem')}
            ${slider('heading', 'Heading weight', 400, 800, 50, '')}
            ${slider('uiw', 'Interface weight', 400, 700, 50, '')}
          </fieldset>
          <fieldset class="themer__group">
            <legend class="ink-caps">Preview in</legend>
            <div class="row" role="group" aria-label="Preview mode" data-preview-mode><button class="ink-chip" type="button" data-mode="paper" aria-pressed="true">Paper</button><button class="ink-chip" type="button" data-mode="night" aria-pressed="false">Night</button></div>
            <label class="ink-check"><input type="checkbox" data-preview-full><span class="ink-check__box"></span>Full range</label>
          </fieldset>
        </div>
        <div class="themer__preview ink-paper" data-preview>
          <div class="ink-page">
            <div class="ink-runninghead"><span>Walden</span><span>Where I Lived</span></div>
            <div>
              <h2 class="ink-h1 themer__heading">Where I Lived, and What I Lived For</h2>
              <div class="ink-prose">
                <p class="ink-dropcap">${WALDEN[0][1]}</p>
                <p>${WALDEN[1][1]}</p>
              </div>
            </div>
            <div class="stack">
              <div class="row"><button class="ink-btn ink-btn--primary" type="button">Open book</button><button class="ink-btn" type="button">Contents</button><button class="ink-btn ink-btn--quiet" type="button">Not now</button></div>
              <div class="row" role="group" aria-label="Turn pages by" data-chips><button class="ink-chip" type="button" aria-pressed="true">Tap</button><button class="ink-chip" type="button" aria-pressed="false">Swipe</button></div>
              <p class="ink-caption">Bookmarked. Page 113, Solitude.</p>
              <div class="ink-folio">Page 72 of 268</div>
            </div>
          </div>
        </div>
      </div>`)}

${section('tokens', 'Your tokens', 'Copy the choice',
  p('Paste this after <code>ink.css</code>. If you chose a face other than Lora or Atkinson Hyperlegible Next, ship its files and license too; the comment lists them. To see the choice everywhere, use it on every page of this site.'),
  `      <div class="snippet"><pre tabindex="0"><code data-themer-css></code></pre><button class="ink-btn ink-btn--quiet snippet__copy" type="button" data-copy>Copy</button></div>
      <div class="row themer__actions">
        <button class="ink-btn ink-btn--primary" type="button" data-themer-apply>Use on every page</button>
        <button class="ink-btn" type="button" data-themer-reset>Back to the defaults</button>
      </div>
      <p class="ink-caption" data-themer-status aria-live="polite">This site is using the defaults.</p>`)}

${section('compare-book', 'Compare', 'Every reading face, side by side',
  p('The same passage in each face, at the system’s size and weight. Look for even color across the line, open counters at small sizes, and italics that stay readable.'),
  `      <div class="grid2">
${BOOK.map(bookCard).join('\n')}
      </div>`)}

${section('compare-ui', 'Compare', 'Every interface face',
  p('Interface text is short, small and often read at a glance. Look for an <em>I</em>, <em>l</em> and <em>1</em> that cannot be confused, and an <em>rn</em> that never reads as <em>m</em>.'),
  `      <div class="grid3">
${UI.map(uiCard).join('\n')}
      </div>`)}
`,
});

const ICON_NAMES = Object.keys(ICONS).sort();

const SETUP = `ink-design/
  dist/ink.css         Paper + Night, flattened, self-contained
  dist/CHECKSUMS        sha256, for a pinned vendored copy
  fonts/                8 woff2 + 2 OFL license texts — copy all of it
  src/icons/*.svg       the drawn icons — inline them, never <img>
  SKILL.md              this brief`;

const STARTER = `<!DOCTYPE html>
<html lang="en" class="ink-paper">   <!-- or ink-night; follow the OS until chosen -->
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="ink.css">
</head>
<body>
  <main class="ink-page">
    <div class="ink-runninghead"><span>Walden</span><span>Solitude</span></div>
    <div class="ink-prose"><p>…</p></div>
    <div class="ink-folio">Page 113 of 268</div>
  </main>
  <nav class="ink-pager" aria-label="Pages">
    <button class="ink-btn ink-btn--icon">…<span class="ink-visually-hidden">Previous page</span></button>
    <span class="ink-pager__label" aria-live="polite">Page 113 of 268</span>
    <button class="ink-btn ink-btn--icon">…<span class="ink-visually-hidden">Next page</span></button>
  </nav>
</body>
</html>`;

const TOKENS = `surfaces   --surface-canvas  --surface-raised  --surface-sunk  --surface-inverse
text       --text-heading  --text-body  --text-secondary  --text-inverse
non-text   --mark-muted (idle marks, never type)  --rule (decorative)  --rule-strong
controls   --border-control  --focus-ring  --selected-fill / --on-selected
levels     --gray-0..15 (for tokens only; components never name one)
space      --space-1..9        radius  --radius-s|m|pill
stroke     --stroke (1px)  --stroke-control (2px)  --stroke-focus (3px)
type       --font-book (Lora)  --font-ui (Atkinson Hyperlegible Next)
           --weight-body|ui|heading|strong  --size-label|caption|ui|body|lead|h3|h2|h1|title
           --leading-tight|ui|body  --measure
target     --hit (48px)
motion     none, by design`;

const CLASSES = `modes      html.ink-paper  html.ink-night  [+ .ink-full for pure paper and pure ink]
type       .ink-title  .ink-h1  .ink-h2  .ink-h3  .ink-lead  .ink-body  .ink-secondary  .ink-italic
           .ink-ui  .ink-caption  .ink-caps  .ink-link
prose      .ink-prose  .ink-dropcap  .ink-quote  .ink-dinkus (hr)  .ink-rule [--strong] (hr)
reading    .ink-page  .ink-runninghead  .ink-folio  .ink-pager  .ink-pager__label
           .ink-progress (style="--at: 40%")  .ink-toc  .ink-toc__title  .ink-toc__page  .ink-end
actions    .ink-btn [--primary --quiet --icon --wide]  .ink-chip (aria-pressed)
surfaces   .ink-card [--sunk]  .ink-list  .ink-list__hint
forms      .ink-field  .ink-label  .ink-hint  .ink-input (aria-invalid)
           .ink-check > input + .ink-check__box
           .ink-switch > input + .ink-switch__track + .ink-switch__state
feedback   .ink-notice [--note]  .ink-notice__glyph  .ink-notice__actions
icons      .ink-icon [--l --xl]
utility    .ink-visually-hidden`;

const RULES = [
  ['Use only the sixteen gray levels, through semantic tokens.', 'No hue, no <code>rgba()</code>, no <code>color-mix()</code>, no partial opacity. Components read tokens like <code>--text-secondary</code>, never <code>--gray-4</code>, so markup works in both modes.'],
  ['Nothing moves.', 'No <code>transition</code>, <code>animation</code>, <code>@keyframes</code> or smooth scroll. Change state in one step. The pressed inversion is built in.'],
  ['Page long content; don’t scroll it.', 'Use <code>.ink-page</code> and <code>.ink-pager</code> with the count in view, keep the controls in the same place on every page, and finish with <code>.ink-end</code>. No infinite feeds, no carousels.'],
  ['Nothing soft.', 'No gradient, <code>box-shadow</code>, <code>text-shadow</code>, blur or filter. Separate things with a rule, a border or space.'],
  ['Nothing on hover.', 'Every control is visible and labeled at rest, at least 48px (<code>--hit</code>).'],
  ['Nothing updates itself.', 'No ticking clocks, live counters, shimmering skeletons or polling. No modal on load, no toast, no <code>role="alert"</code>, no <code>aria-live="assertive"</code>, no <code>setInterval</code>, no autoplay, no <code>autofocus</code>. A notice sits where the person caused it.'],
  ['Meaning never rests on gray alone.', 'Say it in words; then use shape, fill and border style. Dashed means look again. A switch shows On or Off as text.'],
  ['No red, no punishment.', 'A problem is <code>aria-invalid="true"</code> (dashed edge) plus a hint that says what to do. Offer undo after anything that changes something.'],
  ['Lora for reading, Atkinson Hyperlegible Next for operating.', 'No weight below 400 anywhere. Long text goes in <code>.ink-prose</code>, on a plain surface.'],
  ['No emoji.', `Inline an icon from <code>src/icons/</code> (${ICON_NAMES.join(', ')}), <code>aria-hidden="true"</code>, with the meaning in the text or a visually hidden label. If none fits, draw one the same way: 24-unit grid, 2-unit <code>currentColor</code> stroke on whole coordinates, round caps and joins, no fills.`],
  ['Never load anything over a network,', 'and never disable pinch zoom.'],
];

const VOICE = `Page 3 of 12                         not  Keep going! Only 9 left!
That’s the end of the chapter.       not  Next chapter starts in 5… 4… 3…
Bookmarked. Page 113.                not  Saved! (a toast that slides in)
Your notes didn’t sync. Nothing      not  ERROR: Sync failed
is lost.
This book ends on page 268.          not  Invalid input`;

const VOICE_NOTE = 'Plain, quiet and exact, like the front matter of a good book. Sentence case. Say where the person is and what is there; never hurry them, never count down, never cheer.';

const agents = page({
  file: 'agents.html',
  title: 'For agents',
  lede: 'The short brief for an agent building with Ink: what to load, the vocabulary, and the rules.',
  body: `    <section class="hero hero--slim">
      <div class="hero__copy">
        <p class="ink-caps">The short brief</p>
        <h1 class="ink-title">For agents</h1>
        <p class="ink-lead">If you are an agent building an interface with Ink, you need four things: what to load, the token and class vocabulary, the icons, and the rules you must not break. All of it is also in <code>SKILL.md</code>.</p>
      </div>
    </section>

${section('setup', 'Setup', 'What to load',
  snippet(SETUP),
  p('Link <code>ink.css</code>, put <code>ink-paper</code> or <code>ink-night</code> on <code>&lt;html&gt;</code>, and copy <code>fonts/</code> next to it. With no stored choice, use Night when <code>prefers-color-scheme</code> is dark, and set the class before first paint, so the page is drawn once, not twice.'),
  snippet(STARTER))}

${section('tokens', 'Vocabulary', 'Tokens: semantics only',
  snippet(TOKENS),
  `      <div class="ink-card ink-card--sunk">
        <p class="ink-caps">Three that will catch you out</p>
        <p class="ink-body"><code>--mark-muted</code> is for leader dots and idle marks. Never set type in it; use <code>--text-secondary</code>, which clears 7:1.</p>
        <p class="ink-body"><code>--border-control</code>, not <code>--rule</code>, for the edge of anything interactive.</p>
        <p class="ink-body" style="margin:0">There are no motion, shadow or color tokens. Their absence is the design.</p>
      </div>`)}

${section('classes', 'Vocabulary', 'The class list, complete',
  snippet(CLASSES),
  p('Variants are <code>--modifier</code>; state is an ARIA attribute or a native <code>checked</code>. Anything not on this list does not exist. In particular there is no <code>.ink-toast</code>, <code>.ink-modal</code>, <code>.ink-carousel</code>, <code>.ink-skeleton</code> or <code>.ink-badge</code>, and there will not be.'))}

${section('icons', 'Art', 'Icons: inline the file',
  `      <div class="icons">
${ICON_NAMES.map((n) => `        <figure class="ink-card icon-cell">${icon(n, 'ink-icon--l')}<figcaption class="ink-caption"><code>${n}</code></figcaption></figure>`).join('\n')}
      </div>`,
  snippet(`<!-- paste the contents of src/icons/bookmark.svg -->
<button class="ink-btn ink-btn--icon"><svg class="ink-icon" viewBox="0 0 24 24" …>…</svg><span class="ink-visually-hidden">Bookmark this page</span></button>`))}

${section('rules', 'Constraints', 'Not negotiable',
  `      <ol class="agent-rules">
${RULES.map(([h, b]) => `        <li class="ink-body"><strong>${h}</strong> ${b}</li>`).join('\n')}
      </ol>`,
  p('Most of these are checked: run <code>npm run check</code>. If a requirement you have been given conflicts with one of them, say so rather than resolving it quietly. The conflict is usually the most useful thing you have found.'))}

${section('voice', 'Copy', 'Write it like this',
  snippet(VOICE),
  p(VOICE_NOTE))}
`,
});

const md = (html) => html.replace(/<code>(.*?)<\/code>/g, '`$1`').replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
writeFileSync('SKILL.md', `---
name: ink-design
description: Build a calm reading interface with the Ink design system — sixteen gray levels, no motion, paged content, Lora and Atkinson Hyperlegible Next. Two modes, Paper and Night. Use when generating UI for reading, writing and study, or anything that should read like a calm, well-set book.
---

<!-- Generated by tools/build-docs.mjs, alongside docs/agents.html. Edit there. -->

# Ink Design System

A calm design system for reading. **Drawn once, and left alone**: every color
is one of sixteen grays, nothing moves, long content is paged,
and a press is an instant inversion of ink and paper.

## Setup

\`\`\`
${SETUP}
\`\`\`

Link \`ink.css\`, put \`ink-paper\` or \`ink-night\` on \`<html>\`, copy
\`fonts/\`. With no stored choice, use Night when \`prefers-color-scheme\` is
dark, and set the class before first paint.

\`\`\`html
${STARTER}
\`\`\`

## Tokens

Reference semantics only, never a gray level.

\`\`\`
${TOKENS}
\`\`\`

- \`--mark-muted\` is for leader dots and idle marks. Never type; use \`--text-secondary\`.
- \`--border-control\`, not \`--rule\`, for the edge of anything interactive.
- There are no motion, shadow or color tokens.

## Classes

\`\`\`
${CLASSES}
\`\`\`

Anything not on this list does not exist. There is no \`.ink-toast\`,
\`.ink-modal\`, \`.ink-carousel\`, \`.ink-skeleton\` or \`.ink-badge\`.

## Icons

Inline \`src/icons/<name>.svg\`: ${ICON_NAMES.map((n) => `\`${n}\``).join(', ')}.

## Hard constraints

${RULES.map(([h, b], i) => `${i + 1}. **${md(h)}** ${md(b)}`).join('\n')}

If a requirement conflicts with one of these, say so rather than resolving
it quietly.

Full documentation: <https://ink-design.riverma.com>

## Voice

\`\`\`
${VOICE}
\`\`\`

${VOICE_NOTE}
`);
console.log('SKILL.md');

for (const [name, html] of Object.entries({ 'index.html': index, 'principles.html': principles, 'foundations.html': foundations, 'components.html': components, 'themer.html': themer, 'agents.html': agents })) {
  writeFileSync(`docs/${name}`, html);
  console.log(`docs/${name}`);
}
