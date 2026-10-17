/* The Ink documentation site's only script. It remembers the chosen
   mode, copies snippets on request and turns the pages of the reader
   demo. Everything responds to a press. Nothing recurs, nothing appears on
   its own, and nothing changes unless someone touched it. */

(function () {
  'use strict';

  var KEY = 'ink-theme';
  var root = document.documentElement;

  function apply(mode) {
    root.classList.remove('ink-paper', 'ink-night');
    root.classList.add('ink-' + mode);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'night' ? '#111111' : '#eeeeee');
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-btn') === mode ? 'true' : 'false');
    });
  }

  /* A stored choice wins. With none, follow the operating system, live.
     The <head> already set the class before first paint, so the page is
     not drawn twice; this only syncs the switch. */
  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }
  var dark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (stored === 'paper' || stored === 'night') {
    apply(stored);
  } else {
    apply(dark && dark.matches ? 'night' : 'paper');
    if (dark && dark.addEventListener) {
      dark.addEventListener('change', function (e) {
        var chosen;
        try { chosen = localStorage.getItem(KEY); } catch (err) { chosen = null; }
        if (!chosen) apply(e.matches ? 'night' : 'paper');
      });
    }
  }

  function press(group, btn) {
    group.querySelectorAll('[aria-pressed]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
  }

  /* The reader: a finite set of pages, the count always in view, and an
     ending. The controls never move between pages. */
  function turn(box, i) {
    var pages = box.querySelectorAll('[data-page]');
    var total = pages.length;
    var end = box.querySelector('[data-reader-end]');
    pages.forEach(function (p, n) { p.hidden = n !== i; });
    end.hidden = i < total;
    box.querySelector('[data-reader-prev]').disabled = i === 0;
    box.querySelector('[data-reader-next]').disabled = i >= total;
    box.querySelector('[data-reader-label]').textContent = i < total ? 'Page ' + (i + 1) + ' of ' + total : 'The end';
    var chapter = i < total ? pages[i].getAttribute('data-chapter') : 'The end';
    box.querySelector('[data-reader-chapter]').textContent = chapter;
    box.querySelector('[data-reader-progress]').style.setProperty('--at', Math.round(Math.min(i + 1, total) / total * 100) + '%');
    box.setAttribute('data-i', String(i));
  }

  document.addEventListener('click', function (e) {
    var t = e.target;

    var themeBtn = t.closest('[data-theme-btn]');
    if (themeBtn) {
      var mode = themeBtn.getAttribute('data-theme-btn');
      apply(mode);
      try { localStorage.setItem(KEY, mode); } catch (err) { /* private mode: fine */ }
      return;
    }

    var copy = t.closest('[data-copy]');
    if (copy) {
      var pre = copy.parentElement.querySelector('pre');
      if (pre && navigator.clipboard) {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          var was = copy.textContent;
          copy.textContent = 'Copied';
          /* One shot, tied to the press that caused it. */
          setTimeout(function () { copy.textContent = was; }, 1400);
        }, function () {});
      }
      return;
    }

    var chip = t.closest('[data-chips] .ink-chip');
    if (chip) { press(chip.parentElement, chip); return; }

    var reader = t.closest('[data-reader]');
    if (reader) {
      var i = Number(reader.getAttribute('data-i') || 0);
      if (t.closest('[data-reader-next]')) turn(reader, i + 1);
      else if (t.closest('[data-reader-prev]')) turn(reader, Math.max(0, i - 1));
      else if (t.closest('[data-reader-restart]')) { turn(reader, 0); reader.querySelector('[data-reader-next]').focus(); }
    }
  });

  /* Switches say what they are, in words. */
  document.addEventListener('change', function (e) {
    var input = e.target.closest('.ink-switch input');
    if (!input) return;
    var state = input.closest('.ink-switch').querySelector('.ink-switch__state');
    if (state) state.textContent = input.checked ? 'On' : 'Off';
  });
})();
