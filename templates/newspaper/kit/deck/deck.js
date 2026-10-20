/* deck.js: slide engine. Contract: window.DECK_SLIDES (array, see ../../README.md) is rendered
   into #deck-frame; keys ←/→/Space or a sideways swipe navigate, D contents, N notes, P presenter window, F fullscreen, E export PPTX. Mockup iframes
   carry data-shot (a PNG path) so the PPTX export can swap them for a still image. */
(function () {
  'use strict';

  // The front page lives at '/' on the served site only; inside a frame the host page owns navigation.
  if (location.protocol !== 'file:' && window.self === window.top) document.documentElement.classList.add('site');
  const FRAME_W = 1920, FRAME_H = 1080;
  const frame = document.getElementById('deck-frame');
  const viewport = document.getElementById('deck-viewport');
  const slides = window.DECK_SLIDES || [];
  const DECK = window.DECK_CONFIG || {};
  let current = 0;

  // ---------- Rendering ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const head = (s) => `
    <div class="slide-head">
      <h2 class="slide-title">${s.title}</h2>
      ${s.subtitle ? `<p class="slide-sub">${s.subtitle}</p>` : ''}
    </div>`;

  const foot = (s, i) => `
    <div class="slide-foot">
      <span>${s.source ? `Source: ${s.source}` : (DECK.footer || '')}</span>
      <span class="pg">${i + 1} / ${slides.length}</span>
    </div>`;

  const frameDesktop = (m) => `
    <div class="frame-desktop"><div class="screen"><iframe data-src="${esc(m.src)}" data-shot="${esc(m.shot || '')}" title="${esc(m.label || 'Mockup')}" loading="lazy"></iframe></div></div>`;
  const framePhone = (m) => `
    <div class="frame-wrap"><div class="frame-phone scaled"><div class="screen"><iframe data-src="${esc(m.src)}" data-shot="${esc(m.shot || '')}" title="${esc(m.label || 'Mockup')}" loading="lazy"></iframe></div></div></div>`;
  const picture = (p) => `
    <figure class="figure ${p.boxed ? 'boxed' : ''}"><img src="${esc(p.src)}"${p.shot ? ` data-shot="${esc(p.shot)}"` : ''} alt="${esc(p.alt || '')}">${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}</figure>`;
  const proof = (s) => s.mockup ? (s.mockup.kind === 'phone' ? framePhone(s.mockup) : frameDesktop(s.mockup)) : s.picture ? picture(s.picture) : s.aside ? `<div>${s.aside}</div>` : '';

  const rows = (list, cls) => `
    <div class="rows ${cls || ''}">
      ${list.map((p) => `
        <div class="r">
          ${p.pillar ? `<span class="pillar-tag" data-pillar="${p.pillar}">${p.pillarName || ''}</span>` : ''}
          <b>${p.title}</b>${p.text ? `<span>${p.text}</span>` : ''}
        </div>`).join('')}
    </div>`;

  const table = (t) => `
    <table class="table ${t.dense ? 'dense' : ''}">
      <thead><tr>${t.columns.map((c) => `<th class="${c.r ? 'r' : ''}">${c.label || c}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr class="${r.total ? 'total' : ''}">${(r.cells || r).map((c, k) => `<td class="${t.columns[k].r ? 'r' : ''} ${k === 0 && t.keyCol !== false ? 'k' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  const TEMPLATES = {
    cover: (s) => `
      <div class="cover-lines" aria-hidden="true">${s.art || ''}</div>
      <div class="cover-client">
        <span class="logo-slot">${s.logo || ''}</span>
        <span>${s.client || ''}</span>
      </div>
      <h1 class="cover-title ${s.compact ? 'compact' : ''}">${s.title}</h1>
      <p class="cover-sub">${s.subtitle || ''}</p>
      ${s.meta ? `<p class="cover-meta">${s.meta}</p>` : ''}`,

    section: (s) => `
      <div class="no">${s.number}</div>
      <h1>${s.title}</h1>
      ${s.subtitle ? `<p>${s.subtitle}</p>` : ''}
      <ol class="section-list" aria-label="Sections">${(s.sections || []).map((c, k) => `<li class="${k + 1 === Number(s.number) ? 'current' : ''}"><span class="num">${k + 1}</span>${c}</li>`).join('')}</ol>`,

    statement: (s) => `
      <h1>${s.title}</h1>
      ${s.source ? `<p class="statement-source">Source: ${s.source}</p>` : ''}`,

    ledger: (s, i) => `
      ${head(s)}
      <div class="slide-body">
        <div class="ledger">
          ${(s.rows || []).map((k) => `
            <div class="lrow">
              <div class="lab">${k.pillar ? `<span class="pillar-tag" data-pillar="${k.pillar}">${k.label}</span>` : k.label}</div>
              <div class="fig num">${k.value}${k.unit ? `<small>${k.unit}</small>` : ''}</div>
              <div class="note">${k.note || ''}</div>
            </div>`).join('')}
        </div>
      </div>
      ${foot(s, i)}`,

    rows: (s, i) => `
      ${head(s)}
      <div class="slide-body">
        ${!(s.rows || []).length ? `<div class="solo">${proof(s)}</div>`
          : s.mockup || s.picture || s.aside
          ? `<div class="split ${s.mockup && s.mockup.kind !== 'phone' ? 'wide-right' : ''}">${rows(s.rows || [])}${proof(s)}</div>`
          : rows(s.rows || [], (s.rows || []).length > 4 ? 'cols-2' : '')}
      </div>
      ${foot(s, i)}`,

    table: (s, i) => `
      ${head(s)}
      <div class="slide-body"><div class="table-fill">${table(s.table)}</div>${s.after ? `<p class="slide-sub" style="margin-top:28px">${s.after}</p>` : ''}</div>
      ${foot(s, i)}`,

    picture: (s, i) => `
      ${head(s)}
      <div class="slide-body">${picture(s.picture)}</div>
      ${foot(s, i)}`,

    timetable: (s, i) => `
      ${head(s)}
      <div class="slide-body">
        <div class="timetable">
          ${(s.rows || []).map((r) => `
            <div class="trow">
              <div class="when">${r.when}</div>
              <div class="what">${r.what}</div>
              <div class="detail">${r.detail}</div>
              <div class="status ${r.statusClass || ''}">${r.status || ''}</div>
            </div>`).join('')}
        </div>
      </div>
      ${foot(s, i)}`,

    html: (s, i) => `${s.title ? head(s) : ''}<div class="slide-body">${s.html}</div>${s.noFoot ? '' : foot(s, i)}`,

    close: (s) => `
      <h1>${s.title}</h1>
      <ol class="asks">${(s.asks || []).map((a, k) => `<li><span>${k + 1}</span>${a}</li>`).join('')}</ol>
      <p class="statement-source" style="margin-top:56px">${s.contact || ''}</p>`
  };

  // A deck may add or replace templates (chartbook.js) and choose its dark types
  Object.assign(TEMPLATES, window.DECK_TEMPLATES || {});
  const DARK = DECK.dark || ['cover', 'section', 'statement', 'timetable', 'close'];

  function render() {
    frame.innerHTML = slides.map((s, i) => {
      const dark = s.dark === true || (s.dark !== false && DARK.includes(s.type));
      return `<section class="slide slide-${s.type} ${dark ? 'on-board' : ''}" data-index="${i}" aria-hidden="true">${TEMPLATES[s.type](s, i)}${DECK.stamp ? `<span class="internal">${DECK.stamp}</span>` : ''}</section>`;
    }).join('') + '<div class="deck-edge" aria-hidden="true"><i></i></div>';
  }

  // ---------- Scaling ----------
  function fitFrame() {
    const scale = Math.min(viewport.clientWidth / FRAME_W, viewport.clientHeight / FRAME_H);
    frame.style.setProperty('--frame-scale', scale.toFixed(4));
  }
  function fitMockups(section) {
    section.querySelectorAll('.frame-desktop').forEach((f) => {
      // data-cw/data-ch: the page region shown (CB.desktop crop); the whole 1440x900 page by default
      const cw = Number(f.dataset.cw) || 1440, ch = Number(f.dataset.ch) || 900;
      // Shrink the frame to the cell height so the whole screen (and its legend) stays visible
      if (!f.dataset.w) f.dataset.w = f.style.width || '';
      f.style.width = f.dataset.w;
      const room = f.parentElement.clientHeight;
      if (room && f.offsetHeight > room) f.style.width = `${Math.floor(room * cw / ch)}px`;
      const screen = f.querySelector('.screen');
      f.style.setProperty('--shot-scale', (screen.clientWidth / cw).toFixed(4));
    });
    section.querySelectorAll('.frame-phone.scaled').forEach((f) => {
      const wrap = f.parentElement;
      const scale = Math.min(1, (wrap.clientHeight || 844) / 872, (wrap.clientWidth || 390) / 418);
      f.style.setProperty('--phone-scale', scale.toFixed(4));
    });
  }

  // data-scroll (CB.phone scroll): bring that element to the top of its scrolling box inside the mockup. A file://
  // frame is cross-origin, so there the page keeps its own scroll and the still (data-shot) shows the intended view.
  function scrollFrame(f) {
    try {
      const d = f.contentDocument, t = d && d.querySelector(f.dataset.scroll);
      let box = t && t.parentElement;
      while (box && box.scrollHeight <= box.clientHeight + 1) box = box.parentElement;
      if (box) box.scrollTop += t.getBoundingClientRect().top - box.getBoundingClientRect().top - 8;
    } catch (e) { /* cross-origin frame */ }
  }

  // ---------- Contents: every title, appendix slides grouped under their own heading ----------
  const toc = document.getElementById('deck-toc');
  const tocBtn = document.getElementById('btn-toc');
  function renderToc() {
    const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent; };
    let appendix = false;
    document.getElementById('deck-toc-list').innerHTML = slides.map((s, i) => {
      const head = !appendix && /^Appendix/.test(s.kicker || '') ? (appendix = true, '<li class="toc-group">Appendix</li>') : '';
      return `${head}<li><button type="button" data-go="${i}"><span class="num">${i + 1}</span>${esc(plain(s.title))}</button></li>`;
    }).join('');
  }
  // Closing hands focus back to the control that opened the list (the button, or whatever had focus before D)
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
      if (on) {
        sec.querySelectorAll('iframe[data-src]').forEach((f) => {
          if (f.dataset.scroll) f.addEventListener('load', () => scrollFrame(f), { once: true });
          f.src = f.dataset.src; f.removeAttribute('data-src');
        });
        fitMockups(sec);
      }
    });
    frame.querySelector('.deck-edge').style.setProperty('--progress', ((current + 1) / slides.length).toFixed(4));
    frame.classList.toggle('light-edge', !frame.querySelector('.slide.active').classList.contains('on-board'));
    document.getElementById('deck-counter').textContent = `${current + 1} / ${slides.length}`;
    toc.querySelectorAll('[data-go]').forEach((b) => b.toggleAttribute('aria-current', Number(b.dataset.go) === current));
    document.getElementById('deck-notes-body').textContent = slides[current].notes || 'No notes for this slide.';
    renderPresenter();
    history.replaceState(null, '', `#${current + 1}`);
  }

  // ---------- Presenter window: notes, next title and elapsed time on a second screen ----------
  let presenter = null, started = 0;
  function renderPresenter() {
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
    if (!presenter) { const toast = document.getElementById('deck-toast'); toast.textContent = 'The presenter window was blocked; allow pop-ups for this page.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); return; }
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
    presenter.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view: ${esc(document.title)}</title>${css}</head>
      <body class="presenter"><header><span id="p-count"></span><span id="p-time">00:00</span></header>
      <h1 id="p-title"></h1><div id="p-notes"></div><footer id="p-next"></footer></body></html>`);
    presenter.document.close();
    presenter.document.addEventListener('keydown', onKey);
    started = Date.now();
    renderPresenter();
  }
  setInterval(tick, 1000);

  // ---------- Export: PPTX of slide screenshots (1920×1080) ----------
  // One export at a time: while it runs, keys, clicks and hash changes are ignored and the HUD says so
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
    if (on) exportBtn.textContent = text; else exportBtn.innerHTML = exportLabel;
  }
  async function exportPptx() {
    if (exporting) return;
    const toast = document.getElementById('deck-toast');
    // file:// pages taint the canvas when a still is drawn, so the export needs an http origin
    if (location.protocol === 'file:') { toast.textContent = 'PPTX export needs the deck served over http (python -m http.server), not file://.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 4000); return; }
    if (!window.PptxGenJS || !window.html2canvas) { toast.textContent = 'The export libraries have not loaded (they need the CDN).'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); return; }
    exporting = true;
    const prev = current;
    setBusy(true, 'Exporting…');
    try {
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      // html2canvas mis-measures text under a scaled ancestor, so capture at 1:1
      frame.style.setProperty('--frame-scale', '1');
      frame.classList.add('exporting');
      const ground = getComputedStyle(frame).backgroundColor;
      for (let i = 0; i < slides.length; i++) {
        exportBtn.textContent = `Exporting ${i + 1} / ${slides.length}…`;
        show(i);
        const sec = frame.querySelector('.slide.active');
        const swaps = [];
        sec.querySelectorAll('iframe').forEach((f) => {
          // the still is the page at the iframe's own size, under the iframe's own scale and crop
          const img = document.createElement('img');
          img.src = f.dataset.shot || '';
          img.alt = f.title;
          img.style.cssText = `position:absolute;left:0;top:0;width:${f.offsetWidth}px;height:${f.offsetHeight}px;max-width:none;transform-origin:0 0;transform:${getComputedStyle(f).transform}`;
          f.replaceWith(img); swaps.push([img, f]);
        });
        // an SVG with foreignObject taints the canvas; export its PNG still (data-shot) instead
        const pics = [...sec.querySelectorAll('img[data-shot]')].map((im) => [im, im.getAttribute('src')]);
        pics.forEach(([im]) => { im.src = im.dataset.shot; });
        await new Promise((r) => setTimeout(r, 600));
        // html2canvas ignores object-fit: size each still to its own aspect ratio
        pics.forEach(([im]) => {
          const w = im.clientWidth, h = im.clientHeight, r = im.naturalWidth / im.naturalHeight;
          if (w / h > r) im.style.width = `${Math.round(h * r)}px`; else im.style.height = `${Math.round(w / r)}px`;
          im.style.justifySelf = 'center';
        });
        const canvas = await window.html2canvas(sec, { width: FRAME_W, height: FRAME_H, scale: 1, useCORS: true, backgroundColor: ground, logging: false });
        swaps.forEach(([img, f]) => img.replaceWith(f));
        pics.forEach(([im, src]) => { im.src = src; im.removeAttribute('style'); });
        const slide = pptx.addSlide();
        slide.addImage({ data: canvas.toDataURL('image/png'), x: 0, y: 0, w: '100%', h: '100%' });
        if (slides[i].notes) slide.addNotes(slides[i].notes);
      }
      // the local calendar date: toISOString() is UTC and can be a day off
      await pptx.writeFile({ fileName: `${DECK.file || 'deck'}-${localDate()}.pptx` });
      toast.textContent = 'PPTX saved.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500);
    } catch (err) {
      toast.textContent = 'PPTX export failed; try again.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 4000);
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
  window.addEventListener('resize', () => { if (!exporting) { fitFrame(); fitMockups(frame.querySelector('.slide.active')); } });
  // a typed or pasted #n moves the open deck; show() rewrites the hash with replaceState, which fires no event
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (exporting) { history.replaceState(null, '', `#${current + 1}`); return; }
    if (n) show(n - 1);
  });
  function onKey(e) {
    // browser and OS chords (Ctrl+P print, Ctrl+D bookmark, Alt+arrow history) stay the browser's
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    if (exporting) { e.preventDefault(); return; }
    // a focused control keeps its own Space and Enter (Space on "Previous" goes back, not forward)
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
  document.getElementById('btn-presenter').addEventListener('click', openPresenter);
  document.getElementById('btn-next').addEventListener('click', () => show(current + 1));
  document.getElementById('btn-notes').addEventListener('click', () => document.getElementById('deck-notes').classList.toggle('open'));
  document.getElementById('btn-export').addEventListener('click', exportPptx);
  tocBtn.addEventListener('click', () => toggleToc());
  toc.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { show(Number(b.dataset.go)); toggleToc(false); } });
  // a zoomed-in phone is reading the slide: its taps and drags are the browser's (pan), not page turns
  const zoomed = () => !!window.visualViewport && window.visualViewport.scale > 1.01;
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => viewport.classList.toggle('zoomed', zoomed()));
  viewport.addEventListener('click', (e) => { if (exporting || zoomed() || e.target.closest('.deck-hud, .deck-notes, .deck-toc, a, button')) return; show(current + 1); });

  // Touch: one finger dragged sideways turns the page (left = next); a second finger makes it a pinch, not a swipe
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
