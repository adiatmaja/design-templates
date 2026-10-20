/* kit.js: behaviour and drawing for datasheet-world pages (classic script, also opens from file://).
   Defines window.SHEET (full reference: ../../README.md):
   format:   tok(--css-var), esc, fmt.num(n, dp), fmt.int(n), fmt.pct(n, dp), fmt.signed(n, dp), nice(max)
   marks:    status(kind, word), srcmark(id, registry), sources(registry) -> {open, close}
   controls: tabs(tablist, {onChange}), seg(group, onChange)
   builders: columns(opt), range(opt), ranked(opt), timelineSVG(model, opt). Each returns static SVG at the width it is
             given (one SVG unit is one CSS pixel), so the same builder draws a page chart and a slide.
   mounts:   mount(host, build, {readout}), timeline(host, model, {onSelect, onPointer}).
   Every chart is built at its host's width and rebuilt when that width changes; nothing stretches a fixed viewBox. */
(function () {
  'use strict';

  // ---------- format: en-US numbers, one contract for every figure ----------
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (n, dp = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const fmt = {
    num,
    int: (n) => num(Math.round(n), 0),
    pct: (n, dp = 1) => `${num(n, dp)} %`,
    // the sign carries the direction; a minus is the true minus sign, never a hyphen
    signed: (n, dp = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n), dp)}`
  };
  function nice(max) {
    if (!(max > 0)) return { top: 1, step: 1 };
    const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    return { top: Math.ceil(max / step) * step, step };
  }
  // a builder refuses bad input by name rather than drawing an empty box
  const fail = (who, msg) => { throw new Error(`SHEET.${who}: ${msg}`); };

  // ---------- marks ----------
  const STATUS = { pass: 'Pass', caution: 'Caution', fault: 'Fault', none: 'Not assessed' };
  // a shape and a word, never colour alone; the word defaults to the state's name
  const status = (kind, word) => `<span class="status is-${kind}"><i aria-hidden="true"></i>${esc(word || STATUS[kind] || kind)}</span>`;

  // A source mark: a 24 px button naming the registry entry a figure came from. No entry, no mark.
  function srcmark(id, reg) {
    const e = reg && reg[id];
    if (!e) return '';
    const un = e.verified === false;
    return `<button type="button" class="srcmark${un ? ' is-unverified' : ''}" data-src="${esc(id)}" aria-expanded="false" aria-haspopup="dialog" aria-label="Source ${esc(id)}: ${esc(e.title)}${un ? ', unverified' : ''}">${esc(id)}</button>${un ? ' <span class="unverified">unverified</span>' : ''}`;
  }

  // The source card: one popover for every [data-src] on the page. Opens on click or Enter, closes on Escape, on a
  // click elsewhere or on its own Close button, and gives focus back to the mark that opened it.
  function sources(reg) {
    let pop = null, from = null;
    const build = () => {
      pop = document.createElement('div');
      pop.className = 'pop'; pop.id = 'sheet-pop'; pop.hidden = true;
      pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-labelledby', 'sheet-pop-t');
      document.body.appendChild(pop);
      pop.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(true); });
    };
    function place(a) {
      const r = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, g = 6;
      pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
      pop.style.top = (r.bottom + g + h > innerHeight - 8 ? Math.max(8, r.top - g - h) : r.bottom + g) + 'px';
    }
    function open(id, a) {
      const e = reg[id];
      if (!e) return;
      if (!pop) build();
      if (from) from.setAttribute('aria-expanded', 'false');
      from = a || null;
      pop.innerHTML = `<div class="pop-head"><span class="mono">${esc(id)}</span><b id="sheet-pop-t">${esc(e.title)}</b></div>
        <dl><dt>Source</dt><dd>${esc(e.source)}</dd><dt>Method</dt><dd>${esc(e.method)}</dd>
        ${e.formula ? `<dt>Formula</dt><dd><span class="mono">${esc(e.formula)}</span></dd>` : ''}
        <dt>Date</dt><dd>${esc(e.date)}</dd>
        <dt>Status</dt><dd>${e.verified === false ? status('caution', 'Unverified: ' + (e.gap || 'not checked against a primary source')) : status('pass', 'Checked')}</dd></dl>
        <div class="pop-foot"><button type="button" class="btn ghost" data-close>Close</button></div>`;
      pop.hidden = false;
      if (from) { from.setAttribute('aria-expanded', 'true'); place(from); }
    }
    function close(refocus) {
      if (!pop || pop.hidden) return;
      pop.hidden = true;
      if (from) { from.setAttribute('aria-expanded', 'false'); if (refocus) from.focus(); }
      from = null;
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('[data-src]');
      if (a) { if (from === a) close(false); else open(a.dataset.src, a); return; }
      if (pop && !pop.hidden && !pop.contains(e.target)) close(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
    addEventListener('resize', () => close(false));
    document.addEventListener('scroll', () => { if (from && pop && !pop.hidden) place(from); }, true);
    return { open, close };
  }

  // ---------- controls ----------
  /* Tabs over panes that are built once and toggled with [hidden]. Arrow keys, Home and End move and select
     (automatic activation); the selected tab is the only Tab stop. A tab whose data-tab matches the URL hash opens first. */
  function tabs(list, { onChange } = {}) {
    const all = [...list.querySelectorAll('[role=tab]')];
    function select(t, focus) {
      all.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        const p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      if (t.dataset.tab) history.replaceState(null, '', '#' + t.dataset.tab);
      if (onChange) onChange(t.dataset.tab, t);
    }
    list.addEventListener('click', (e) => { const t = e.target.closest('[role=tab]'); if (t && !t.disabled) select(t, false); });
    list.addEventListener('keydown', (e) => {
      const live = all.filter((x) => !x.disabled), i = live.indexOf(document.activeElement);
      if (i < 0) return;
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: live.length - 1 }[e.key];
      if (k == null) return;
      e.preventDefault();
      select(live[(k + live.length) % live.length], true);
    });
    const first = all.find((x) => x.dataset.tab && '#' + x.dataset.tab === location.hash) || all.find((x) => x.getAttribute('aria-selected') === 'true') || all[0];
    all.forEach((x) => { x.tabIndex = -1; });
    const p = document.getElementById(first.getAttribute('aria-controls'));
    all.forEach((x) => { const q = document.getElementById(x.getAttribute('aria-controls')); if (q) q.hidden = x !== first; x.setAttribute('aria-selected', String(x === first)); });
    first.tabIndex = 0;
    if (p && onChange) onChange(first.dataset.tab, first);
    return { select: (id) => { const t = all.find((x) => x.dataset.tab === id); if (t) select(t, false); } };
  }

  // A segmented control: buttons with aria-pressed, exactly one pressed
  function seg(group, onChange) {
    const bs = [...group.querySelectorAll('button')];
    const set = (v) => { bs.forEach((b) => b.setAttribute('aria-pressed', String(b.value === v))); if (onChange) onChange(v); };
    group.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !b.disabled && b.getAttribute('aria-pressed') !== 'true') set(b.value); });
    return { set };
  }

  // ---------- builders: pure functions, (opt) -> {svg, geo}; fs is the text size in px (14 on a screen, 22 on a slide) ----------
  const textW = (s, fs) => String(s).length * fs * 0.56;

  /* columns: one zero-based column per row, an optional reference per row drawn as a dashed step (a comparison in grey,
     never a second set of columns), and a direct label only on the extreme row.
     opt = {width, height, fs, rows: [{label, v}], ref: [v] | null, refLabel, unit, extreme: 'min' | 'max', fmt, aria} */
  function columns(o) {
    const W = o.width, H = o.height, fs = o.fs || 14, f = o.fmt || fmt.int;
    if (!(W > 0) || !(H > 0)) fail('columns', `width and height must be positive numbers, got ${W} x ${H}`);
    if (!o.rows || !o.rows.length) fail('columns', 'rows is empty');
    const ref = o.ref || null;
    const top = nice(Math.max(...o.rows.map((r) => r.v), ...(ref || [0])) * 1.08);
    const tick = (v) => (v === 0 ? '0' : f(v));
    const L = Math.ceil(Math.max(...[0, top.step, top.top].map((v) => textW(tick(v), fs))) + fs * 0.75);
    const R = ref ? Math.ceil(textW(o.refLabel || '', fs) + fs * 0.9) : Math.ceil(fs * 0.5);
    const T = Math.ceil(fs * 2), B = Math.ceil(fs * 2.1);
    const pw = Math.max(40, W - L - R), ph = Math.max(40, H - T - B), n = o.rows.length, band = pw / n;
    const cw = Math.min(band * 0.62, fs * 3.4);
    const y = (v) => T + ph - (v / top.top) * ph;
    const xOf = (i) => L + band * i + band / 2;
    let g = `<rect class="c-hl" x="0" y="${T}" width="${band.toFixed(1)}" height="${ph}" visibility="hidden"/>`;
    for (let v = top.step; v <= top.top + 1e-9; v += top.step) {
      const yy = Math.round(y(v)) + 0.5;
      g += `<line class="c-grid" x1="${L}" x2="${L + pw}" y1="${yy}" y2="${yy}"/><text x="${L - fs * 0.5}" y="${yy + fs * 0.35}" text-anchor="end" font-size="${fs}">${esc(tick(v))}</text>`;
    }
    g += `<text x="${L - fs * 0.5}" y="${T + ph + fs * 0.35}" text-anchor="end" font-size="${fs}">0</text>`;
    const ext = o.extreme ? o.rows.reduce((b, r, i) => ((o.extreme === 'min' ? r.v < o.rows[b].v : r.v > o.rows[b].v) ? i : b), 0) : -1;
    const every = Math.max(1, Math.ceil((textW('Mmm', fs) + fs * 0.5) / band));
    o.rows.forEach((r, i) => {
      const x0 = xOf(i) - cw / 2, yy = y(r.v);
      g += `<rect class="c-col" data-i="${i}" x="${x0.toFixed(1)}" y="${yy.toFixed(1)}" width="${cw.toFixed(1)}" height="${(T + ph - yy).toFixed(1)}"/>`;
      // every nth label, plus the extreme's; a regular label that would touch the extreme's gives way to it
      if (i === ext || (i % every === 0 && (ext < 0 || Math.abs(i - ext) >= every))) g +=`<text x="${xOf(i).toFixed(1)}" y="${T + ph + fs * 1.45}" text-anchor="middle" font-size="${fs}"${i === ext ? ' class="c-strong"' : ''}>${esc(r.label)}</text>`;
    });
    if (ref) {
      let d = '';
      ref.forEach((v, i) => { const yy = y(v).toFixed(1); d += `${i ? 'L' : 'M'}${(L + band * i).toFixed(1)} ${yy}H${(L + band * (i + 1)).toFixed(1)}`; });
      g += `<path class="c-ref" d="${d}"/>`;
      g += `<text x="${L + pw + fs * 0.45}" y="${(y(ref[n - 1]) + fs * 0.35).toFixed(1)}" font-size="${fs}" class="c-val">${esc(o.refLabel || '')}</text>`;
    }
    if (ext >= 0) {
      // the label sits above the tallest column it spans, so a clamped label never lands on a neighbour
      const r = o.rows[ext], tw = textW(f(r.v), fs), lx = Math.max(L + tw / 2, Math.min(L + pw - tw / 2, xOf(ext)));
      const top = o.rows.reduce((m, q, i) => (Math.abs(xOf(i) - lx) < tw / 2 + cw / 2 ? Math.max(m, q.v) : m), r.v);
      g += `<text x="${lx.toFixed(1)}" y="${(y(top) - fs * 0.5).toFixed(1)}"text-anchor="middle" font-size="${fs}" class="c-strong">${esc(f(r.v))}</text>`;
    }
    g += `<line class="c-base" x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}"/>`;
    const svg = `<svg class="sheet-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}" data-w="${W}">${g}</svg>`;
    return { svg, geo: { n, band, L, T, ph, W, xOf, yOf: (i) => y(o.rows[i].v) } };
  }

  /* range: one estimate and its tolerance against a target, on a stated axis. The track is the axis, the shaded band is
     the estimate plus or minus its tolerance, the ink bar is the estimate and the dashed grey tick is the target it is
     read against. opt = {width, fs, min, max, value, tol, target, targetLabel, unit, fmt, aria, markLabel} */
  function range(o) {
    const W = o.width, fs = o.fs || 14, f = o.fmt || ((v) => num(v, 1)), tol = o.tol || 0;
    if (!(W > 0)) fail('range', `width must be a positive number, got ${W}`);
    if (!(o.max > o.min)) fail('range', `max must exceed min, got ${o.min} to ${o.max}`);
    const P = Math.ceil(fs * 0.25), pw = W - 2 * P, x = (v) => P + ((Math.max(o.min, Math.min(o.max, v)) - o.min) / (o.max - o.min)) * pw;
    const yBar = Math.ceil(fs * 2), hBar = Math.ceil(fs * 1.15), H = Math.ceil(yBar + hBar + fs * 3.3);
    const clampX = (cx, w) => Math.max(P + w / 2, Math.min(W - P - w / 2, cx)).toFixed(1);
    let g = `<rect class="r-track" x="${P}" y="${yBar}" width="${pw}" height="${hBar}"/>`;
    const a = x(o.value - tol), e = x(o.value + tol);
    g += `<rect class="r-band" x="${a.toFixed(1)}" y="${yBar}" width="${(e - a).toFixed(1)}" height="${hBar}"/>`;
    // round ticks under the track, thinned so their labels never touch
    // a whole-number step prints whole numbers; the value and the target keep fmt's decimals
    const step = nice(o.max - o.min).step, ty = yBar + hBar + fs * 2.75, tf = Number.isInteger(step) ? fmt.int : f;
    const ticks = []; for (let v = Math.ceil(o.min / step) * step; v <= o.max + 1e-9; v += step) ticks.push(v);
    const every = Math.max(1, Math.ceil((Math.max(...ticks.map((v) => textW(tf(v), fs))) + fs) / ((step / (o.max - o.min)) * pw)));
    ticks.forEach((v, i) => {
      g += `<line class="r-tick" x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${yBar + hBar}" y2="${yBar + hBar + 5}"/>`;
      if (i % every === 0) g += `<text x="${clampX(x(v), textW(tf(v), fs))}" y="${ty.toFixed(1)}" text-anchor="middle" font-size="${fs}">${esc(tf(v))}</text>`;
    });
    if (o.target != null) {
      const tx = x(o.target), tl = `${o.targetLabel || 'Target'} ${f(o.target)}`;
      g += `<line class="r-target" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${yBar - fs * 0.35}" y2="${yBar + hBar + fs * 0.35}"/>`;
      g += `<text x="${clampX(tx, textW(tl, fs))}" y="${(yBar + hBar + fs * 1.45).toFixed(1)}" text-anchor="middle" font-size="${fs}" class="c-val">${esc(tl)}</text>`;
    }
    const mx = x(o.value), lab = `${f(o.value)}${tol ? ` ± ${f(tol)}` : ''} ${o.unit || ''}`.trim();
    g += `<rect class="r-mark" x="${(mx - 1.5).toFixed(1)}" y="${yBar - fs * 0.45}" width="3" height="${(hBar + fs * 0.9).toFixed(1)}"/>`;
    // markLabel: false when the value is printed large beside the range, so a slide does not say it twice
    if (o.markLabel !== false) g += `<text x="${clampX(mx, textW(lab, fs))}" y="${yBar - fs * 0.75}" text-anchor="middle" font-size="${fs}" class="c-strong">${esc(lab)}</text>`;
    return { svg: `<svg class="sheet-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}" data-w="${W}">${g}</svg>` };
  }

  /* ranked: N magnitudes on ONE zero-based scale, sorted, every bar labelled with its value. There is no stack option:
     parts read against each other are compared by length on a shared baseline, never by segments of one bar.
     opt = {width, fs, rows: [{label, v}], unit, fmt, aria, sort: true} */
  function ranked(o) {
    const W = o.width, fs = o.fs || 14, f = o.fmt || ((v) => num(v, 1));
    if (!(W > 0)) fail('ranked', `width must be a positive number, got ${W}`);
    const rows = o.sort === false ? o.rows : [...o.rows].sort((a, b) => b.v - a.v);
    const lw = Math.ceil(Math.max(...rows.map((r) => textW(r.label, fs))) + fs);
    const vw = Math.ceil(textW(f(rows[0].v) + ' ' + (o.unit || ''), fs) + fs);
    const rowH = Math.ceil(fs * 2.4), bh = Math.ceil(fs * 1.1), H = rows.length * rowH, max = Math.max(...rows.map((r) => r.v));
    const pw = Math.max(40, W - lw - vw);
    let g = '';
    rows.forEach((r, i) => {
      const yy = i * rowH, bw = Math.max(2, (r.v / max) * pw);
      g += `<text x="0" y="${(yy + rowH / 2 + fs * 0.35).toFixed(1)}" font-size="${fs}" class="c-val">${esc(r.label)}</text>`;
      g += `<rect class="c-bar${i ? ' b2' : ''}" x="${lw}" y="${(yy + (rowH - bh) / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh}"/>`;
      g += `<text x="${(lw + bw + fs * 0.5).toFixed(1)}" y="${(yy + rowH / 2 + fs * 0.35).toFixed(1)}" font-size="${fs}" class="${i ? 'c-val' : 'c-strong'}">${esc(f(r.v))} ${esc(o.unit || '')}</text>`;
    });
    g += `<line class="c-base" x1="${lw}" x2="${lw}" y1="0" y2="${H}"/>`;
    return { svg: `<svg class="sheet-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}" data-w="${W}">${g}</svg>` };
  }

  // ---------- mount: build at the host's width, rebuild when it changes, and answer on hover, focus and keys ----------
  /* build(width) returns {svg, geo}. readout(i) returns the readout's HTML for mark i. The host gets tabindex 0; the arrow
     keys step mark to mark, Home and End jump, Escape hides; a tap pins the readout until a tap elsewhere. */
  function mount(host, build, { readout } = {}) {
    let geo = null, sel = -1, builtW = 0;
    const ro = host.querySelector('.readout') || host.appendChild(Object.assign(document.createElement('div'), { className: 'readout', hidden: true }));
    ro.setAttribute('role', 'status'); ro.setAttribute('aria-live', 'polite');
    function draw() {
      const w = Math.floor(host.clientWidth);
      if (w < 1 || host.closest('[hidden]')) return;
      const r = build(w);
      const old = host.querySelector('svg');
      if (old) old.remove();
      host.insertAdjacentHTML('afterbegin', r.svg);
      geo = r.geo || null; builtW = w;
      if (sel >= 0 && geo) show(Math.min(sel, geo.n - 1));
    }
    function show(i) {
      if (!geo || !readout) return;
      sel = i;
      const svg = host.querySelector('svg');
      svg.querySelectorAll('.is-hv').forEach((m) => m.classList.remove('is-hv'));
      const m = svg.querySelector(`[data-i="${i}"]`);
      if (m) m.classList.add('is-hv');
      const hl = svg.querySelector('.c-hl');
      if (hl) { hl.setAttribute('x', (geo.L + geo.band * i).toFixed(1)); hl.setAttribute('visibility', 'visible'); }
      ro.innerHTML = readout(i);
      ro.hidden = false;
      const cx = geo.xOf(i), w = ro.offsetWidth, gap = geo.band / 2 + 6;
      ro.style.left = (cx + gap + w <= host.clientWidth ? cx + gap : Math.max(0, cx - gap - w)) + 'px';
      ro.style.top = Math.max(0, Math.min(geo.yOf(i), geo.T + geo.ph - ro.offsetHeight)) + 'px';
    }
    function hide() {
      sel = -1; ro.hidden = true; host.classList.remove('is-focus');
      const svg = host.querySelector('svg');
      if (!svg) return;
      svg.querySelectorAll('.is-hv').forEach((m) => m.classList.remove('is-hv'));
      const hl = svg.querySelector('.c-hl'); if (hl) hl.setAttribute('visibility', 'hidden');
    }
    const at = (e) => {
      const px = e.clientX - host.getBoundingClientRect().left;
      return Math.max(0, Math.min(geo.n - 1, Math.floor((px - geo.L) / geo.band)));
    };
    if (readout) {
      host.tabIndex = 0;
      host.addEventListener('pointermove', (e) => { if (geo && e.pointerType !== 'touch') show(at(e)); });
      host.addEventListener('pointerdown', (e) => { if (geo) show(at(e)); });
      host.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && document.activeElement !== host) hide(); });
      host.addEventListener('focus', () => { if (geo) { host.classList.add('is-focus'); show(sel >= 0 ? sel : geo.n - 1); } });
      host.addEventListener('blur', hide);
      host.addEventListener('keydown', (e) => {
        if (!geo) return;
        const i = sel < 0 ? geo.n - 1 : sel;
        const k = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: geo.n - 1 }[e.key];
        if (k == null) { if (e.key === 'Escape') hide(); return; }
        e.preventDefault(); show(Math.max(0, Math.min(geo.n - 1, k)));
      });
    }
    // rebuild only when the host's width differs from the width the chart was built at
    new ResizeObserver(() => { if (Math.floor(host.clientWidth) !== builtW) draw(); }).observe(host);
    draw();
    return { redraw: draw, hide };
  }

  // ---------- the drawing: rows of bars on a time axis, drawn at the host's size ----------
  /* timelineSVG(model, opt): the drawing as static SVG. Times are in one unit counted from 0.
     model = {grid, unit, end?, rows: [{id, label, group, start, end, float?, critical?}], links?: [[fromId, toId, strong?]],
              marks?: [{at, label, kind: 'target' | 'forecast'}], band?: [from, to], dims?: [[from, to, text]]}
     opt = {width, height, fs, sel, layers: {links, float, dims}, id, focusable, label(row) -> aria text, aria}
     Returns {svg, geo: {at(px, py) -> {t, row}}}. Every layer defaults to on. */
  function timelineSVG(M, o) {
    const W = o.width, H = o.height, fs = o.fs || 14, Ly = Object.assign({ links: true, float: true, dims: true }, o.layers);
    if (!(W > 0) || !(H > 0)) fail('timelineSVG', `width and height must be positive numbers, got ${W} x ${H}`);
    if (!M.rows || !M.rows.length) fail('timelineSVG', 'rows is empty');
    if (!(M.grid > 0)) fail('timelineSVG', `grid must be a positive number, got ${M.grid}`);
    const id = o.id || 't', u = M.unit ? ' ' + M.unit : '', by = Object.fromEntries(M.rows.map((r) => [r.id, r]));
    const last = Math.max(...M.rows.map((r) => r.end + (r.float || 0)), ...(M.marks || []).map((m) => m.at), M.band ? M.band[1] : 0);
    // half a grid of room past the last thing drawn, for the mark labels
    const end = M.end || Math.ceil(last / M.grid + 0.5) * M.grid;
    // a narrow drawing names a row by its id alone
    const compact = W < 560, lab = (r) => (compact ? r.id : `${r.id}  ${r.label}`);
    const LW = Math.ceil(Math.max(...M.rows.map((r) => textW(lab(r), fs))) + fs * 1.4);
    const sel = o.sel && by[o.sel] ? by[o.sel] : null;
    const dimList = Ly.dims ? (sel ? [[sel.start, sel.end, `${num(sel.end - sel.start, 1)}${u}`, sel]] : []).concat(M.dims || []) : [];
    const axisH = Math.ceil(fs * 2.2), dimH = Math.ceil(dimList.length * fs * 1.9 + fs * 1.2), gapU = 0.5;
    const groups = new Set(M.rows.map((r) => r.group)).size;
    const top = axisH + Math.ceil(fs * 0.5), rowH = (H - top - dimH) / (M.rows.length + (groups - 1) * gapU);
    const X0 = LW, X1 = W - Math.ceil(fs * 1.2), x = (t) => +(X0 + (t / end) * (X1 - X0)).toFixed(1);
    const yOf = {}, seps = [];
    let yy = top, prev = null;
    M.rows.forEach((r) => {
      if (prev != null && r.group !== prev) { seps.push(yy + (rowH * gapU) / 2); yy += rowH * gapU; }
      yOf[r.id] = yy; yy += rowH; prev = r.group;
    });
    const bot = yy + fs * 0.4, bh = Math.max(4, Math.min(rowH * 0.56, fs * 1.4)), mid = (r) => yOf[r.id] + rowH / 2;
    const f1 = (v) => (+v).toFixed(1);
    let g = `<defs><pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="d-hatch-line" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>`;
    // the sheet inside the frame, the grid every M.grid units across it, and the axis above it
    g += `<rect class="d-ground" x="${X0}" y="${axisH}" width="${X1 - X0}" height="${f1(bot - axisH)}"/>`;
    if (M.band) g += `<rect class="d-band" x="${x(M.band[0])}" y="${axisH}" width="${f1(x(M.band[1]) - x(M.band[0]))}" height="${f1(bot - axisH)}" fill="url(#${id}-hatch)"/>`;
    const gx = (X1 - X0) * (M.grid / end), every = Math.max(1, Math.ceil((textW(String(end), fs) + fs) / gx));
    for (let t = 0, k = 0; t <= end + 1e-9; t += M.grid, k++) {
      if (t > 0 && t < end) g += `<line class="d-grid" x1="${x(t)}" x2="${x(t)}" y1="${axisH}" y2="${f1(bot)}"/>`;
      g += `<line class="d-tick" x1="${x(t)}" x2="${x(t)}" y1="${axisH - 5}" y2="${axisH}"/>`;
      if (k % every === 0) g += `<text class="d-mono d-axis" x="${x(t)}" y="${f1(axisH - fs * 0.65)}" text-anchor="middle" font-size="${fs}">${num(t, 0)}</text>`;
    }
    seps.forEach((sy) => { g += `<line class="d-sep" x1="0" x2="${X1}" y1="${f1(sy)}" y2="${f1(sy)}"/>`; });
    if (sel) g += `<rect class="d-selrow" x="${X0}" y="${f1(yOf[sel.id])}" width="${X1 - X0}" height="${f1(rowH)}"/>`;
    // the rows: a hit area over the whole row, the bar, its float and its label
    M.rows.forEach((r) => {
      const on = sel === r, y = mid(r), aria = o.label ? o.label(r) : r.label;
      g += `<g class="d-row-g" data-row="${esc(r.id)}"${o.focusable ? ` tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(aria)}"` : ''}>`;
      g += `<rect class="d-hit" x="0" y="${f1(yOf[r.id])}" width="${X1}" height="${f1(rowH)}"/>`;
      if (Ly.float && r.float > 1e-6) {
        const a = x(r.end), b = x(r.end + r.float);
        g += `<path class="d-float" d="M${a} ${f1(y)}H${b}M${b} ${f1(y - bh / 2)}V${f1(y + bh / 2)}"/>`;
      }
      g += `<rect class="d-bar${r.critical ? ' is-crit' : ''}${on ? ' is-sel' : ''}" x="${x(r.start)}" y="${f1(y - bh / 2)}" width="${f1(Math.max(2, x(r.end) - x(r.start)))}" height="${f1(bh)}"/>`;
      const idTxt = `<tspan class="d-mono">${esc(r.id)}</tspan>`;
      g += `<text class="d-lab${on ? ' is-sel' : ''}" x="${f1(fs * 0.6)}" y="${f1(y + fs * 0.35)}" font-size="${fs}">${compact ? idTxt : `${idTxt}<tspan dx="${f1(fs * 0.5)}">${esc(r.label)}</tspan>`}</text>`;
      g += `<rect class="d-focus" x="2" y="${f1(yOf[r.id] + 1)}" width="${X1 - 2}" height="${f1(rowH - 2)}"/>`;
      g += '</g>';
    });
    // links: from the end of one bar along its row to the start of the next, then into that bar's top or bottom edge
    if (Ly.links) (M.links || []).forEach(([a, b, strong]) => {
      const A = by[a], B = by[b];
      if (!A || !B) return;
      const xa = x(A.end), xb = Math.max(xa, x(B.start)), ya = mid(A), down = mid(B) > ya, yb = mid(B) + (down ? -bh / 2 : bh / 2), h = fs * 0.35;
      g += `<path class="d-link${strong ? ' is-strong' : ''}" d="M${xa} ${f1(ya)}H${xb}V${f1(yb - (down ? h : -h))}"/>`;
      g += `<path class="d-arrow${strong ? ' is-strong' : ''}" d="M${f1(xb - h * 0.6)} ${f1(yb - (down ? h : -h))}L${xb} ${f1(yb)}L${f1(xb + h * 0.6)} ${f1(yb - (down ? h : -h))}Z"/>`;
    });
    // the frame over the grid, then the marks over everything: the target dashed grey, the forecast solid ink
    g += `<rect class="d-frame" x="${X0}" y="${axisH}" width="${X1 - X0}" height="${f1(bot - axisH)}"/>`;
    const marks = (M.marks || []).slice().sort((p, q) => p.at - q.at);
    marks.forEach((m) => { g += `<line class="d-mark is-${m.kind}" x1="${x(m.at)}" x2="${x(m.at)}" y1="${axisH}" y2="${f1(bot)}"/>`; });
    // mark labels sit at the top of the frame: the earlier mark to the left of its line, the later to the right, and a
    // label that does not fit drops a line
    const placed = [];
    marks.forEach((m, i) => {
      const w = textW(m.label, fs), mx = x(m.at), right = i === marks.length - 1 && mx + fs * 0.4 + w <= X1;
      let lx = right ? mx + fs * 0.4 : mx - fs * 0.4 - w, ly = top + fs * 0.95;
      if (lx < X0 + 2) lx = mx + fs * 0.4;
      while (placed.some(([px, py, pw]) => Math.abs(py - ly) < fs && lx < px + pw && lx + w > px)) ly += fs * 1.3;
      placed.push([lx, ly, w]);
      g += `<text class="d-note${m.kind === 'forecast' ? ' is-strong' : ''}" x="${f1(lx)}" y="${f1(ly)}" font-size="${fs}">${esc(m.label)}</text>`;
    });
    // dimensions under the frame, one per line: the selected row first, then the model's own; extension lines come
    // down from the bar or from the frame, the text breaks the line, and a span too short for its text puts it outside
    if (dimList.length) {
      const gap = (tx, cx, cy) => { const w = 0.6 * fs * tx.length + 8; return `<rect class="d-dimgap" x="${f1(cx - w / 2)}" y="${f1(cy - fs * 0.85)}" width="${f1(w)}" height="${f1(fs * 1.1)}"/>`; };
      dimList.forEach(([a, b, text, row], i) => {
        const xa = x(a), xb = x(b), dy = bot + fs * 1.3 + i * fs * 1.9, from = row ? mid(row) + bh / 2 + 2 : bot;
        g += `<path class="d-ext" d="M${xa} ${f1(from)}V${f1(dy + 5)}M${xb} ${f1(from)}V${f1(dy + 5)}"/>`;
        g += `<path class="d-dim" d="M${xa} ${f1(dy)}H${xb}M${f1(xa - 4)} ${f1(dy + 4)}l8 -8M${f1(xb - 4)} ${f1(dy + 4)}l8 -8"/>`;
        const tw = 0.6 * fs * text.length, cy = dy + fs * 0.35;
        if (tw + fs <= xb - xa) g += gap(text, (xa + xb) / 2, cy) + `<text class="d-dimt" x="${f1((xa + xb) / 2)}" y="${f1(cy)}" text-anchor="middle" font-size="${fs}">${esc(text)}</text>`;
        else if (xb + fs * 0.6 + tw <= W) g += `<text class="d-dimt" x="${f1(xb + fs * 0.6)}" y="${f1(cy)}" font-size="${fs}">${esc(text)}</text>`;
        else g += `<text class="d-dimt" x="${f1(xa - fs * 0.6)}" y="${f1(cy)}" text-anchor="end" font-size="${fs}">${esc(text)}</text>`;
      });
    }
    const svg = `<svg class="sheet-svg d-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="${o.focusable ? 'group' : 'img'}" aria-label="${esc(o.aria || 'Drawing')}" data-w="${W}">${g}</svg>`;
    const at = (px, py) => {
      const r = M.rows.find((q) => py >= yOf[q.id] && py < yOf[q.id] + rowH);
      return px < X0 || px > X1 ? null : { t: ((px - X0) / (X1 - X0)) * end, row: r ? r.id : null };
    };
    return { svg, geo: { at } };
  }

  /* timeline(host, model, {sel, layers, aria, label(row), onSelect(id), onPointer({t, row} | null)}): the live drawing.
     Rows are buttons (click, Enter, Space); the pointer reports its time and row. Returns {select(id), layers(patch),
     redraw(model?)}; pass a new model to redraw after the data changes. */
  function timelineMount(host, M, opt = {}) {
    let model = M, sel = opt.sel || null, layers = Object.assign({ links: true, float: true, dims: true }, opt.layers), geo = null, builtW = 0, builtH = 0;
    function draw() {
      const w = Math.floor(host.clientWidth), h = Math.floor(host.clientHeight);
      if (w < 1 || h < 1) return;
      const keep = document.activeElement && document.activeElement.closest && document.activeElement.closest('.d-row-g');
      const keepId = keep && host.contains(keep) ? keep.dataset.row : null;
      const r = timelineSVG(model, { width: w, height: h, fs: parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.875, sel, layers, id: 'dwg', focusable: true, label: opt.label, aria: opt.aria });
      const old = host.querySelector('svg'); if (old) old.remove();
      host.insertAdjacentHTML('afterbegin', r.svg);
      geo = r.geo; builtW = w; builtH = h;
      if (keepId) { const z = host.querySelector(`[data-row="${keepId}"]`); if (z) z.focus(); }
    }
    const pick = (id) => { sel = id; draw(); if (opt.onSelect) opt.onSelect(id); };
    host.addEventListener('click', (e) => { const z = e.target.closest('.d-row-g'); if (z) pick(z.dataset.row); });
    host.addEventListener('keydown', (e) => { const z = e.target.closest && e.target.closest('.d-row-g'); if (z && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(z.dataset.row); } });
    host.addEventListener('pointermove', (e) => { if (!geo || !opt.onPointer) return; const b = host.getBoundingClientRect(); opt.onPointer(geo.at(e.clientX - b.left, e.clientY - b.top)); });
    host.addEventListener('pointerleave', () => { if (opt.onPointer) opt.onPointer(null); });
    new ResizeObserver(() => { if (Math.floor(host.clientWidth) !== builtW || Math.floor(host.clientHeight) !== builtH) draw(); }).observe(host);
    draw();
    return { select: (id) => { sel = id; draw(); }, layers: (l) => { layers = Object.assign({}, layers, l); draw(); }, redraw: (m) => { if (m) model = m; draw(); } };
  }

  window.SHEET = { tok, esc, fmt, nice, status, srcmark, sources, tabs, seg, columns, range, ranked, mount, timelineSVG, timeline: timelineMount };
})();
