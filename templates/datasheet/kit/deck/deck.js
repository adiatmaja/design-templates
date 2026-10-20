/* deck.js: slide engine. Contract: window.DECK_SLIDES (array, see ../../README.md) is rendered into #deck-frame
   with the templates in window.DECK_TEMPLATES (sheet.js, loaded first). Keys: arrows, Space or a sideways swipe
   navigate, Home and End jump, D contents, N notes, P presenter window, F fullscreen, E export PPTX. #n opens slide n.
   The 1920 x 1080 frame is scaled as one picture to fit the window, so a slide looks the same at every size. */
(function () {
  'use strict';

  const FRAME_W = 1920, FRAME_H = 1080;
  const frame = document.getElementById('deck-frame');
  const viewport = document.getElementById('deck-viewport');
  const slides = window.DECK_SLIDES || [];
  const DECK = window.DECK_CONFIG || {};
  const TEMPLATES = window.DECK_TEMPLATES || {};
  let current = 0;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (text, ms) => { const t = document.getElementById('deck-toast'); t.textContent = text; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), ms); };

  // ---------- Rendering ----------
  function render() {
    frame.innerHTML = slides.map((s, i) => {
      const tpl = TEMPLATES[s.type];
      if (!tpl) throw new Error(`deck.js: slide ${i + 1} has type "${s.type}", which no template defines`);
      return `<section class="slide slide-${s.type}" data-index="${i}" aria-hidden="true">${tpl(s, i, slides.length, DECK)}${DECK.stamp ? `<span class="sim deck-stamp">${esc(DECK.stamp)}</span>` : ''}</section>`;
    }).join('') + '<div class="deck-edge" aria-hidden="true"><i></i></div>';
  }

  function fitFrame() {
    const scale = Math.min(viewport.clientWidth / FRAME_W, viewport.clientHeight / FRAME_H);
    frame.style.setProperty('--frame-scale', scale.toFixed(4));
  }

  // ---------- Contents ----------
  const toc = document.getElementById('deck-toc');
  const tocBtn = document.getElementById('btn-toc');
  function renderToc() {
    const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent; };
    document.getElementById('deck-toc-list').innerHTML = slides.map((s, i) => `<li><button type="button" data-go="${i}"><span class="num">${i + 1}</span>${esc(plain(s.title))}</button></li>`).join('');
  }
  // closing hands focus back to whatever opened the list
  let tocOpener = null;
  function toggleToc(open = !toc.classList.contains('open')) {
    const was = toc.classList.contains('open');
    if (open && !was) tocOpener = document.activeElement;
    toc.classList.toggle('open', open);
    tocBtn.setAttribute('aria-expanded', String(open));
    if (open) (toc.querySelector('[aria-current]') || toc.querySelector('button'))?.focus();
    else if (was && (toc.contains(document.activeElement) || document.activeElement === document.body)) {
      (tocOpener && tocOpener !== document.body && document.contains(tocOpener) ? tocOpener : tocBtn).focus();
    }
  }

  // ---------- Navigation ----------
  function show(n) {
    current = Math.max(0, Math.min(slides.length - 1, n));
    frame.querySelectorAll('.slide').forEach((sec, i) => {
      const on = i === current;
      sec.classList.toggle('active', on);
      sec.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    frame.querySelector('.deck-edge').style.setProperty('--progress', ((current + 1) / slides.length).toFixed(4));
    document.getElementById('deck-counter').textContent = `${current + 1} / ${slides.length}`;
    navState();
    toc.querySelectorAll('[data-go]').forEach((b) => b.toggleAttribute('aria-current', Number(b.dataset.go) === current));
    document.getElementById('deck-notes-body').textContent = slides[current].notes || 'No notes for this slide.';
    drawPresenter();
    history.replaceState(null, '', `#${current + 1}`);
  }

  // Previous is really disabled on the first slide and Next on the last, so neither is a button that does nothing
  function navState() {
    if (exporting) return;
    document.getElementById('btn-prev').disabled = current === 0;
    document.getElementById('btn-next').disabled = current === slides.length - 1;
  }

  // ---------- Presenter window: notes, next title and elapsed time on a second screen ----------
  let presenter = null, started = 0;
  function drawPresenter() {
    if (!presenter || presenter.closed) return;
    const d = presenter.document, next = slides[current + 1];
    d.getElementById('p-count').textContent = `${current + 1} / ${slides.length}`;
    d.getElementById('p-title').textContent = slides[current].title || '';
    d.getElementById('p-notes').textContent = slides[current].notes || 'No notes for this slide.';
    d.getElementById('p-next').textContent = next ? `Next: ${next.title}` : 'This is the last slide.';
  }
  function tick() {
    if (!presenter || presenter.closed) return;
    const t = Math.floor((Date.now() - started) / 1000);
    presenter.document.getElementById('p-time').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }
  function openPresenter() {
    if (presenter && !presenter.closed) { presenter.focus(); return; }
    presenter = window.open('', 'deck-presenter', 'width=960,height=720');
    if (!presenter) { toast('The presenter window was blocked; allow pop-ups for this page.', 3000); return; }
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
    presenter.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view: ${esc(document.title)}</title>${css}</head>
      <body class="presenter"><header><span id="p-count"></span><span id="p-time">00:00</span></header>
      <h1 id="p-title"></h1><div id="p-notes"></div><footer id="p-next"></footer></body></html>`);
    presenter.document.close();
    presenter.document.addEventListener('keydown', onKey);
    started = Date.now();
    drawPresenter();
  }
  setInterval(tick, 1000);

  // ---------- Export: PPTX of slide screenshots (1920 x 1080) ----------
  // one export at a time: while it runs, keys, clicks and hash changes are ignored and the HUD says so
  let exporting = false;
  const hud = document.querySelector('.deck-hud');
  const exportBtn = document.getElementById('btn-export');
  const exportLabel = exportBtn.innerHTML;  // keeps the key hint span, which touch screens hide
  const pad2 = (n) => String(n).padStart(2, '0');
  const localDate = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  function setBusy(on, text) {
    hud.classList.toggle('busy', on);
    hud.setAttribute('aria-busy', String(on));
    hud.querySelectorAll('button').forEach((x) => { x.disabled = on; });
    if (on) exportBtn.textContent = text; else { exportBtn.innerHTML = exportLabel; navState(); }
  }
  async function exportPptx() {
    if (exporting) return;
    if (location.protocol === 'file:') { toast('PPTX export needs the deck served over http (python -m http.server), not file://.', 4000); return; }
    if (!window.PptxGenJS || !window.html2canvas) { toast('The export libraries have not loaded (they need the CDN).', 3000); return; }
    exporting = true;
    const prev = current;
    setBusy(true, 'Exporting...');
    try {
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      // html2canvas mis-measures text under a scaled ancestor, so capture at 1:1
      frame.style.setProperty('--frame-scale', '1');
      frame.classList.add('exporting');
      const ground = getComputedStyle(frame).backgroundColor;
      for (let i = 0; i < slides.length; i++) {
        exportBtn.textContent = `Exporting ${i + 1} / ${slides.length}...`;
        show(i);
        await new Promise((r) => setTimeout(r, 200));
        const canvas = await window.html2canvas(frame.querySelector('.slide.active'), { width: FRAME_W, height: FRAME_H, scale: 1, backgroundColor: ground, logging: false });
        const slide = pptx.addSlide();
        slide.addImage({ data: canvas.toDataURL('image/png'), x: 0, y: 0, w: '100%', h: '100%' });
        if (slides[i].notes) slide.addNotes(slides[i].notes);
      }
      // the local calendar date: toISOString() is UTC and can be a day off
      await pptx.writeFile({ fileName: `${DECK.file || 'deck'}-${localDate()}.pptx` });
      toast('PPTX saved.', 2500);
    } catch (err) {
      toast('PPTX export failed; try again.', 4000);
      console.warn(err);
    } finally {
      frame.classList.remove('exporting');
      fitFrame();
      show(prev);
      exporting = false;
      setBusy(false);
    }
  }

  // ---------- Wiring ----------
  render();
  renderToc();
  fitFrame();
  show(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  window.addEventListener('resize', () => { if (!exporting) fitFrame(); });
  // a typed or pasted #n moves the open deck; show() rewrites the hash with replaceState, which fires no event
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (exporting) { history.replaceState(null, '', `#${current + 1}`); return; }
    if (n) show(n - 1);
  });
  function onKey(e) {
    // browser and OS chords (Ctrl+P print, Alt+arrow history) stay the browser's
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    if (exporting) { e.preventDefault(); return; }
    // a focused control keeps its own Space and Enter
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest && e.target.closest('button, a[href]')) return;
    if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); show(current + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); show(current - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'Escape') { if (toc.classList.contains('open')) toggleToc(false); }
    else if (e.key.toLowerCase() === 'd') toggleToc();
    else if (e.key.toLowerCase() === 'n') document.getElementById('deck-notes').classList.toggle('open');
    else if (e.key.toLowerCase() === 'f') (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
    else if (e.key.toLowerCase() === 'p') openPresenter();
    else if (e.key.toLowerCase() === 'e') exportPptx();
  }
  document.addEventListener('keydown', onKey);
  document.getElementById('btn-prev').addEventListener('click', () => show(current - 1));
  document.getElementById('btn-next').addEventListener('click', () => show(current + 1));
  document.getElementById('btn-presenter').addEventListener('click', openPresenter);
  document.getElementById('btn-notes').addEventListener('click', () => document.getElementById('deck-notes').classList.toggle('open'));
  document.getElementById('btn-export').addEventListener('click', exportPptx);
  tocBtn.addEventListener('click', () => toggleToc());
  toc.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { show(Number(b.dataset.go)); toggleToc(false); } });
  // a zoomed-in phone is reading the slide: its taps and drags are the browser's (pan), not page turns
  const zoomed = () => !!window.visualViewport && window.visualViewport.scale > 1.01;
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => viewport.classList.toggle('zoomed', zoomed()));
  viewport.addEventListener('click', (e) => { if (exporting || zoomed() || e.target.closest('.deck-hud, .deck-notes, .deck-toc, a, button')) return; show(current + 1); });

  // touch: one finger dragged sideways turns the page (left = next); a second finger makes it a pinch, not a swipe
  let touch = null;
  viewport.addEventListener('touchstart', (e) => { touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  viewport.addEventListener('touchmove', (e) => { if (e.touches.length > 1) touch = null; }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0], start = touch; touch = null;
    if (!start || e.touches.length || exporting || zoomed()) return;
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    show(current + (dx < 0 ? 1 : -1));
  });
})();
