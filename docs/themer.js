/* The themer: try typefaces and spacing against a page of Walden.
   Every change is caused by a press or a slider the person moved. The
   choice applies to the preview; "Use on every page" stores it, and the
   <head> of every page applies it before first paint. */

(function () {
  'use strict';

  var box = document.querySelector('[data-themer]');
  if (!box) return;
  var KEY = 'ink-themer';
  var data = JSON.parse(document.getElementById('themer-data').textContent);
  var D = data.defaults, FONTS = data.fonts;
  var preview = box.querySelector('[data-preview]');
  var root = document.documentElement;
  var state = {};

  var FULL = 61;
  var UNITS = { size: 'px', weight: '', leading: '', measure: 'rem', heading: '', uiw: '' };

  /* The tokens a choice sets, as CSS custom properties. */
  function vars(s) {
    return {
      '--font-book': FONTS[s.book].stack,
      '--font-ui': FONTS[s.ui].stack,
      '--size-body': (s.size / 16) + 'rem',
      '--weight-body': String(s.weight),
      '--leading-body': String(s.leading),
      '--measure': s.measure >= FULL ? '100%' : s.measure + 'rem',
      '--weight-heading': String(s.heading),
      '--weight-ui': String(s.uiw)
    };
  }

  function css(s) {
    var v = vars(s), lines = [];
    var ship = [s.book, s.ui].filter(function (f) { return !FONTS[f].system; });
    lines.push('/* Ink type, chosen in the themer. Load after ink.css. */');
    ship.forEach(function (f) {
      lines.push('/* Ship ' + f + ': themer/fonts/' + FONTS[f].files.join(', ') + ' and ' + FONTS[f].ofl + ',');
      lines.push('   with @font-face rules like those in docs/themer-fonts.css. */');
    });
    lines.push(':root {');
    Object.keys(v).forEach(function (k) { lines.push('  ' + k + ': ' + v[k] + ';'); });
    lines.push('}');
    return lines.join('\n');
  }

  function render() {
    var v = vars(state);
    Object.keys(v).forEach(function (k) { preview.style.setProperty(k, v[k]); });
    ['book', 'ui'].forEach(function (kind) {
      box.querySelectorAll('[data-pick="' + kind + '"] [data-font]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-font') === state[kind] ? 'true' : 'false');
      });
      var f = FONTS[state[kind]];
      box.querySelector('[data-about="' + kind + '"]').textContent = f.about + '. ' + f.note;
    });
    Object.keys(UNITS).forEach(function (k) {
      var input = box.querySelector('[data-key="' + k + '"]');
      if (String(input.value) !== String(state[k])) input.value = state[k];
      box.querySelector('[data-out="' + k + '"]').textContent = k === 'measure' && state[k] >= FULL ? 'Full width' : state[k] + UNITS[k];
    });
    document.querySelector('[data-themer-css]').textContent = css(state);
  }

  function stored() {
    try { return JSON.parse(localStorage.getItem(KEY + '-state') || 'null'); } catch (e) { return null; }
  }
  function status(using) {
    document.querySelector('[data-themer-status]').textContent = using
      ? 'This site is using your choice on every page.'
      : 'This site is using the defaults.';
  }

  /* Start from the stored choice, if any, else the system's defaults. */
  var s0 = stored();
  Object.keys(D).forEach(function (k) { state[k] = s0 && s0[k] !== undefined && (k !== 'book' && k !== 'ui' || FONTS[s0[k]]) ? s0[k] : D[k]; });
  status(!!s0);
  render();

  box.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-key');
    if (!k) return;
    state[k] = Number(e.target.value);
    render();
  });

  document.addEventListener('click', function (e) {
    var t = e.target;

    var font = t.closest('[data-pick] [data-font], [data-choose]');
    if (font) {
      var kind = font.getAttribute('data-choose') || font.closest('[data-pick]').getAttribute('data-pick');
      state[kind] = font.getAttribute('data-font');
      render();
      if (font.hasAttribute('data-choose')) box.querySelector('[data-pick="' + kind + '"] [aria-pressed="true"]').focus();
      return;
    }

    var mode = t.closest('[data-preview-mode] [data-mode]');
    if (mode) {
      var m = mode.getAttribute('data-mode');
      preview.classList.remove('ink-paper', 'ink-night');
      preview.classList.add('ink-' + m);
      mode.parentElement.querySelectorAll('[data-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === mode ? 'true' : 'false');
      });
      return;
    }

    if (t.closest('[data-themer-apply]')) {
      var v = vars(state);
      Object.keys(v).forEach(function (k) { root.style.setProperty(k, v[k]); });
      try {
        localStorage.setItem(KEY, JSON.stringify(v));
        localStorage.setItem(KEY + '-state', JSON.stringify(state));
      } catch (err) { /* private mode: applies to this page only */ }
      status(true);
      return;
    }

    if (t.closest('[data-themer-reset]')) {
      Object.keys(vars(state)).forEach(function (k) { root.style.removeProperty(k); });
      try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '-state'); } catch (err) { /* fine */ }
      Object.keys(D).forEach(function (k) { state[k] = D[k]; });
      status(false);
      render();
    }
  });

  box.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-preview-full')) preview.classList.toggle('ink-full', e.target.checked);
  });
})();
